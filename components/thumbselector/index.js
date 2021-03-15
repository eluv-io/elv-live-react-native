import React from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler,
  FlatList,
  SafeAreaView
} 
from 'react-native';
import AppContext from '../../AppContext'
import { isEmpty, JQ, dateCountdown } from '../../utils';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'react-native-elements'
import FadeInView from '../../components/fadeinview'
import Timer from '../../utils/timer';

const BLUR_OPACITY = 0.3;
const THUMBWIDTH = 300;
const FADE_MS = 5000;

class ThumbSelector extends React.Component {
  static contextType = AppContext

  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : 0,
      layout: props.layout || 0,
      isShowingControls: false,
      showBackground: props.showBackground === undefined? true : props.showBackground,
      showText: props.showText === undefined? true : props.showText
    }
    this.tvEventHandler = null;
    this.flatlist = React.createRef();
    this.subscribed = false;

    this.showControls = this.showControls.bind(this);
    this._next = this._next.bind(this);
    this._previous = this._previous.bind(this);
    this._select = this._select.bind(this);
  }
  
  async componentDidMount() {
    await this.enableTVEventHandler();
    if(this.props.showControls){
      this.showControls();
    }

  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  async enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {isShowingControls} = page.state;
      console.log("isShowingControls " + isShowingControls + " " + evt.eventType);
      if(!isShowingControls){
        await page.showControls();
        return;
      }

      if (evt && evt.eventType === 'right') {
        page._next();
      } else if (evt && evt.eventType === 'up') {

      } else if (evt && evt.eventType === 'left') {
        page._previous();
      } else if (evt && evt.eventType === 'down') {
        page.hideControls();
      } else if (evt && evt.eventType === 'playPause') {

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
    let {isShowingControls, currentViewIndex} = this.state;
    let {onShowControls, isActive} = this.props;
    if(isShowingControls){
        return;
    }

    console.log("Show controls")
    isShowingControls = true;
    this.setState({isShowingControls});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }else{
      this.controlsTimer = Timer(() => {
        if(!isActive) return;
        console.log("timeout!");
        this.setState({
          isShowingControls: false
        });
      }, FADE_MS);
    }
    if(onShowControls != undefined){
      onShowControls();
    }
  }
  
  hideControls(){
    console.log("hide controls");
    this.setState({isShowingControls:false});
  }

  _next(){
    const {isActive, data,next} = this.props;
    if(!isActive){
      return;
    }

    let {currentViewIndex,isShowingControls} = this.state;
    if(!isShowingControls){
      console.log("Not showing controls");
      return;
    }

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

    let {currentViewIndex,isShowingControls} = this.state;

    if(!isShowingControls){
      return;
    }

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

    const {currentViewIndex,isShowingControls} = this.state;
    if(!isShowingControls){
      return;
    }
    try{
      let selected = data[currentViewIndex];
      console.log("Thumb select " + currentViewIndex);
      select({item:selected,index:currentViewIndex});
    }catch(e){
      console.error(e);
    }
  }

  RenderItem = ({ item, index }) => {
    let {currentViewIndex,isShowingControls} = this.state;
    console.log("RenderItem " + index);
    return (
      <FadeInView key={isShowingControls} duration={1500} fadeOut={isShowingControls == false} >
      <Image
        style={index == currentViewIndex ? styles.paginationImageActive: styles.paginationImage}
        source={{
          uri: item.image,
        }} />
      </FadeInView>
    );
  }

  RenderContent = ({title,description}) => {
    let {currentViewIndex, isShowingControls, showText} = this.state;
    let {data} = this.props;
    if(!data) return null;

    const items = [];
    
    for (var i = 0; i < data.length; i++){
      let item = data[i];
      item.index = i;
      item.id = item.image;
      items.push(
        item
      );
    }

    return (
      <View style={styles.controlsContainer}>
        <FadeInView key={isShowingControls} duration={isShowingControls? 500:1500} fadeOut={isShowingControls == false} style={styles.controlsContainer}>
          {showText? <View style={styles.contentContainer}>
              {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
              {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
          </View> : null }
          </FadeInView>
        <View style={styles.paginationStyle}>
          <FlatList
            data={items}
            renderItem={({item,index,separator}) => {
              return this.RenderItem({item,index,separator});
            }}
            keyExtractor={item => item.id}
            horizontal={true}
            ref = {this.flatlist}
            contentContainerStyle={styles.flatListContainer}
            />
          </View>
      </View>
    )
  }

  render() {
    const {currentViewIndex,showBackground,isShowingControls} = this.state;
    const {data} = this.props;
    console.log("Thumbselector render current index: " + JQ(data));
    const views = [];

    if(!data){
      return null;
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
          <FadeInView key={isShowingControls} duration={isShowingControls? 500:1500} fadeOut={isShowingControls == false} style={styles.controlsContainer}>
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
  fadeIn: {
    flex: 1,
    backgroundColor: "black"
  },
  fadeOut: {
    flex: 1,
    backgroundColor: "black"
  },
  container: {
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  blackBackground: {
    backgroundColor: "black",
  },
  background: {
    backgroundColor: "black",
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    flex: 1,
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
  paginationStyle: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    bottom: 60,
    flexDirection: 'row',
    width: "100%",
    paddingLeft: 160,
    paddingRight: 160
  },
  paginationImage: {
    marginRight:5,
    marginLeft:5,
    resizeMode: 'cover',
    width:THUMBWIDTH * .8,
    height:THUMBWIDTH * 9/16 * .8
  },
  paginationImageActive: {
    marginRight:1,
    marginLeft:1,
    resizeMode: 'cover',
    width:THUMBWIDTH,
    height:THUMBWIDTH * 9/16
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
  }
});

export default ThumbSelector;