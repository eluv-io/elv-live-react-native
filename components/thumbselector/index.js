import React from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TVEventHandler,
  FlatList,
  Animated,
  TouchableHighlightBase
} 
from 'react-native';
import AppContext from '../../AppContext'
import { isEmpty, JQ, dateCountdown } from '../../utils';
import LinearGradient from 'react-native-linear-gradient';
import {Icon} from 'react-native-elements'
import FadeInView from '../../components/fadeinview'
import Slide from '../../components/slide'
import {AIMS, DIRECTIONS, MOVEMENT_TYPES, STATIC_TYPES, SimpleAnimation } from 'react-native-simple-animations';
import Timer from '../../utils/timer';
var URI = require("urijs");

const BLUR_OPACITY = 0.3;
const THUMBWIDTH = 500;
const FADE_MS = 5000;

class ThumbSelector extends React.Component {
  static contextType = AppContext

  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : 0,
      showBackground: props.showBackground === undefined? true : props.showBackground,
      showText: props.showText === undefined? true : props.showText,
      show: props.show !== undefined? props.show: false,
      slide: false
    }
    this.tvEventHandler = null;
    this.flatlist = React.createRef();
    this.subscribed = false;

    this.showControls = this.showControls.bind(this);
    this.hideControls = this.hideControls.bind(this);
    this._next = this._next.bind(this);
    this._previous = this._previous.bind(this);
    this._select = this._select.bind(this);
  }
  
  async componentDidMount() {
    await this.enableTVEventHandler();
    if(this.state.show){
      this.showControls();
    }
  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  async enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {isActive} = page.props;
      if(!isActive){
        return;
      }

      if(evt.eventType == "blur" || evt.eventType == "focus"){
        return;
      }

      console.log("thumbselector event " + evt.eventType);
      if (evt && evt.eventType === 'right' || evt.eventType === 'swipeRight') {
        page._next();
      }else if (evt && evt.eventType === 'left' || evt.eventType === 'swipeLeft') {
        page._previous();
      } else if (evt && evt.eventType === 'down' || evt.eventType === 'swipeDown') {
        page.hideControls();
      } else if (evt && evt.eventType === 'playPause' ) {

      } else if (evt && evt.eventType === 'select') {
        await page._select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
      this.tvEventHandler = null;
    }
  }

  async showControls(){
    const {platform,fabric} = this.context;
    let {currentViewIndex} = this.state;
    let {onShowControls, isActive} = this.props;
    console.log("thumbselector Show controls: ", isActive);

    if(!isActive){
        return;
    }

    if(this.controlsTimer){
      this.controlsTimer.start();
    }else{
      this.controlsTimer = Timer(() => {
        if(!isActive) return;
        this.hideControls();
      }, FADE_MS);
    }
    if(onShowControls != undefined){
      onShowControls();
    }
  }
  
  hideControls(){
    const {isActive} = this.props;

    if(!isActive){
      return;
    }
    console.log("thumbselector hide controls");
    let {onHideControls} = this.props;
    if(onHideControls != undefined){
      onHideControls();
    }
  }

  _next(){
    const {isActive, data,next} = this.props;
    if(!isActive){
      return;
    }

    let {currentViewIndex} = this.state;

    if(!data){
      console.log("No data for next()");
      return;
    }

    if(currentViewIndex >= data.length - 1){
      return;
    }
    
    console.log("next " + currentViewIndex + " sites: " + data.length);
    currentViewIndex++;
    this.setState({currentViewIndex});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }

    if(this.flatlist.current){
      this.flatlist.current.scrollToIndex({index:currentViewIndex});
    }

    if(next){
      next();
    }
  }
  
  _previous(){
    const {isActive, data, previous} = this.props;
    if(!isActive){
      return;
    }

    let {currentViewIndex} = this.state;

    if(!data){
      console.log("No sites for previous");
      return;
    }

    if(currentViewIndex == 0){
      return;
    }

    console.log("previous " + currentViewIndex);
    currentViewIndex--;
    this.setState({currentViewIndex});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }

    if(this.flatlist.current){
      this.flatlist.current.scrollToIndex({index:currentViewIndex});
    }

    if(previous){
      previous();
    }
  }

  _select(){
    const {isActive,data,select} = this.props;
    if(!isActive || !select || !data){
      return;
    }

    const {currentViewIndex} = this.state;

    try{
      let selected = data[currentViewIndex];
      console.log("Thumb select " + currentViewIndex);
      select({item:selected,index:currentViewIndex});
    }catch(e){
      console.error(e);
    }
  }

  RenderItem = ({ item, index }) => {
    let {currentViewIndex} = this.state;
    let imageStyle = styles.paginationImage;
    if(index == currentViewIndex ){
      if(this.props.showImageLabels){
        imageStyle = styles.paginationImageActiveLabel
      }else{
        imageStyle = styles.paginationImageActive
      }
    }

    if(isEmpty(item.image)){
      return null;
    }

    let image = URI(item.image).addQuery({width:THUMBWIDTH,height:Math.trunc(THUMBWIDTH * 9/16)}).toString();
    //console.log("Thumbselector image: " + image);

    return (
      <View style={this.props.showImageLabels ? styles.paginationItemsLabel : styles.paginationItems}>
      <Image
        style={imageStyle}
        source={{
          uri: image,
        }} />
        <View style={styles.flexContainer} >
        <Icon
          iconStyle={item.isAvailable? styles.noOpacity: styles.lockIcon}
          name='lock'
          color='#ffffff'
          type='font-awesome'
          size={32}
        />
        </View>
        {this.props.showImageLabels ? <Text  numberOfLines={1} style={styles.thumbLabel}>{item.title}</Text> : null }
        </View>
    );
  }

  RenderContent = ({title,description}) => {
    let {currentViewIndex, showText} = this.state;
    let {isActive, data, slide} = this.props;
    if(isEmpty(data)) return null;

    const items = [];
    
    for (key in data){
      let item = data[key];
      item.index = key;
      try{
        if(item.image.url){
          item.image = item.image.url;
        }
      }catch(e){
        console.error("Error parsing extras for thumbselector: " + e);
        return null;
      }
      items.push(
        item
      );
    }

    return (
      <View style={styles.controlsContainer}>
        <FadeInView key={isActive} duration={isActive? 500:1500} fadeOut={isActive == false} style={styles.controlsContainer}>
          {showText? <View style={styles.contentContainer}>
              {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
              {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
          </View> : null }
          </FadeInView>
          <View style={styles.paginationStyle}>
            <Slide style={styles.flatListContainer} show={isActive} enabled={slide}>
              <FlatList
                contentContainerStyle={styles.flatListContainer}
                data={items}
                renderItem={({item,index,separator}) => {
                  return this.RenderItem({item,index,separator});
                }}
                keyExtractor={item => item.id}
                horizontal={true}
                ref = {this.flatlist}
                />
            </Slide>
          </View>
      </View>
    )
  }

  render() {
    const {currentViewIndex,showBackground, slide} = this.state;
    const {data, isActive} = this.props;
    const views = [];

    if(isEmpty(data)){
      return null;
    }

    if (!isActive){
      this.hideControls();
    }


    let item = data[currentViewIndex];
    let title = null;
    try{
      title = item.title;
    }catch(e){}

    let description= null;
    try{
      description = item.description;
    }catch(e){}

    let imageUrl= null;
    try{
      imageUrl = item.image;
    }catch(e){}

    let show = isActive;

    return (
        <View style={showBackground?[styles.container,styles.blackBackground]:styles.container}>
          <FadeInView key={currentViewIndex} duration={1500} start={.1} end={1} style={styles.container}>
          {showBackground? <Image
            style={styles.mainImage}
            source={{
              uri: imageUrl
            }}
          /> : null }
          </FadeInView>
          <FadeInView key={show} duration={show? 500:1500} fadeOut={show == false} style={styles.controlsContainer}>
          {!showBackground ? <View style={[styles.container,styles.blackBackground,{opacity:.7}]} /> :null}
          <LinearGradient 
            start={{x: 0, y: 1}} end={{x: 0, y: 0}} 
            colors={['rgba(0,0,0,.9)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']} 
            style={styles.linearGradient} 
          />
          </FadeInView>
          <this.RenderContent index={currentViewIndex} title={title} description={description}/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  flexContainer: {
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    //backgroundColor: "red",
  },
  blackBackground: {
    backgroundColor: "black",
  },
  noborder: {
    borderWidth: 0,
  },
  controlsContainer: {
    position: "absolute",
    left:0,
    top: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: "100%",
    height: '100%',
  },
  button: {
    marginTop: 30,
    marginBottom: 10,
    margin: 30,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor:'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 250,
    height: 60,
    borderWidth: 2,
    borderColor: "white",
    color: "white",
    opacity:BLUR_OPACITY
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
  },
  nextContainer: {
    padding:30,
    paddingBottom:100,
    position: "absolute",
    height: "100%",
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextButton: {
    opacity: BLUR_OPACITY
  },
  buttonFocused: {
    shadowOpacity: .5,
    shadowRadius: 2,
    shadowOffset:{width:4,height:4},
    opacity: 1
  },
  previousButton: {
    opacity: BLUR_OPACITY
  },
  previousContainer: {
    padding:30,
    paddingBottom:100,
    position: "absolute",
    height: "100%",
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  noOpacity: {
    opacity:0
  },
  flatListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  justifyCenter:{
    justifyContent: 'center',
  },
  paginationStyle: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    bottom: 60,
    flexDirection: 'row',
    width: "100%",
    //backgroundColor:"red",
    paddingLeft: 160,
    paddingRight: 160
  },
  paginationItemsLabel: {
    display:"flex",
    flexDirection:"column", 
    justifyContent:"flex-end",
    height:"100%"
  },
  paginationItems: {display:"flex",flexDirection:"column", justifyContent:"center",height:"100%"},
  paginationImage: {
    marginRight:5,
    marginLeft:5,
    resizeMode: 'cover',
    width:THUMBWIDTH * .8,
    height:THUMBWIDTH * 9/16 * .8
  },
  paginationImageActiveLabel: {
    marginRight:1,
    marginLeft:1,
    resizeMode: 'cover',
    width:THUMBWIDTH*.9,
    height:THUMBWIDTH * 9/16 * .9
  },
  paginationImageActive: {
    marginRight:1,
    marginLeft:1,
    resizeMode: 'cover',
    width:THUMBWIDTH,
    height:THUMBWIDTH * 9/16
  },
  lockIcon: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
  linearGradient: {
    position: "absolute",
    left:0,
    bottom:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "50%"
  },
  contentContainer: {
    position: "absolute",
    display: "flex",
    left:0,
    bottom:0,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    width: "100%",
    height: "100%",
    padding: 160,
    paddingBottom: 260,
  },
  headerText: {
    fontFamily: "Helvetica",
    color: '#fff',
    fontSize: 48,
    fontWeight: "300"
  },
  subheaderText: {
    fontFamily: "Helvetica",
    lineHeight: 62,
    marginTop:20,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
  dateText: {
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textAlign: 'center',
    marginTop:60,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
  thumbLabel: {
    marginTop: 10,
    fontSize: 25,
    color: "white",
    fontFamily: "Helvetica",
    fontWeight: "300"
  },
});

export default ThumbSelector;