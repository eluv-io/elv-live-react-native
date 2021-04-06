import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler,
  Image,
  Dimensions
} 
from 'react-native';
//import Image from 'react-native-fast-image'
import Swiper from 'react-native-swiper'
import reactNativeTvosController from "react-native-tvos-controller"
import AppContext from '../../AppContext'
import {Site} from '../../fabric/site'
import { isEmpty, JQ, dateCountdown,RandomInt} from '../../utils';
import {Icon} from 'react-native-elements'
import EvilIcon from 'react-native-vector-icons/EvilIcons'
import LinearGradient from 'react-native-linear-gradient';
import FadeInView from '../../components/fadeinview'

const BLUR_OPACITY = 0.3;
const WINDOWWIDTH = Dimensions.get('window').width;
const WINDOWHEIGHT = Dimensions.get('window').height;
/*
  This Gallery supports two layouts based on the data
  0 - Shows the Title and Description near the bottom of the screen with white text
  1 - The background shift to the right with a black gradient on the left side for the content

  Gallery takes a data array as a prop with each item consisting:
  
  {
    title,
    description,
    release_date,
    logo,
    image,
    isRedeemed, 
  }

*/

class Gallery extends React.Component {
  static contextType = AppContext

  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : props.index || 0,
      layout: props.layout || 0,
      data: this.props.data
    }

    console.log("Gallery currentViewIndex: " + this.state.currentViewIndex);
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.subscribed = false;

    this._next = this._next.bind(this);
    this._previous = this._previous.bind(this);
    this._select = this._select.bind(this);
    this.renderLayout0 = this.renderLayout0.bind(this);
    this.renderLayout1 = this.renderLayout1.bind(this);
    this.RenderBackground = this.RenderBackground.bind(this);
    this._select = this._select.bind(this);
    this.enableTVEventHandler = this.enableTVEventHandler.bind(this);
    this.isActive = this.isActive.bind(this);

    //setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  //Method to create widths for a brick wall like mosaic with random widths.
  //Returns a list of image widths for the image mosaic.
  //param maxSize is the maximum number of widths to return (could return less if maxRows is reached)
  //param maxWidth is the row width until it calculates for a new row.
  //parm maxRows is the number of rows of images to calculate for.
  //Note, it is up to the caller to use the appropriate height for row numbers.
  createImageWidths = (maxSize,maxWidth,maxRows) => {
    imageWidths = [];
    let width=0;
    let totalWidth = maxWidth;
    let row = 0;
    for (let i = 0; i < maxSize; i++){
      width = RandomInt(maxWidth*.2,maxWidth*.6);
      if(width > maxWidth *.5){
        width = maxWidth;
      }

      if(totalWidth - width > maxWidth*.2){
        totalWidth -= width;
      }else{
        width = totalWidth;
        totalWidth = maxWidth;
        row++;
      }

      if(i+1 == maxSize){
        width += totalWidth;
      }

      imageWidths.push(width);
      if (row>=maxRows){
        break;
      }
    }
    return imageWidths;
  }

  async componentDidMount() {
    this.enableTVEventHandler();

  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  isActive = () => {
    return this.props.isActive;
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views} = page.state;
      if(!page.isActive()){
        return;
      }

      console.log("Gallery event: " + evt.eventType);

      if (evt && evt.eventType === 'right' || evt.eventType === 'swipeRight') {
        page._next();
      }else if (evt && evt.eventType === 'left' || evt.eventType === 'swipeLeft') {
        page._previous();
      }else if (evt && evt.eventType === 'select') {
        page._select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  _next(){
    const {isActive, next,data} = this.props;
    if(!isActive){
      return;
    }

    let {currentViewIndex} = this.state;
    if(!data){
      console.log("No sites for next()");
      return;
    }

    if(currentViewIndex >= data.length - 1){
      return;
    }
    
    console.log("Gallery next " + currentViewIndex);
    currentViewIndex++;
    this.setState({currentViewIndex});
    if(next){
      next(currentViewIndex);
    }
  }
  
  _previous(){
    const {isActive, previous, data} = this.props;
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

    console.log("Gallery previous " + currentViewIndex);
    currentViewIndex--;
    this.setState({currentViewIndex});

    if(previous){
      previous(currentViewIndex);
    }
  }

  _select(){
    const {isActive,select,data} = this.props;
    if(!isActive || !select){
      return;
    }

    const {currentViewIndex} = this.state;

    console.log("Gallery select " + currentViewIndex);
    try{
      let selected = data[currentViewIndex];
      select(selected);
    }catch(e){
      console.error(e);
    }
  }

  setIndex = (index)=>{
    console.log("Gallery set index " + index);
    this.setState({currentViewIndex:index});
  }

  renderPagination = (index, total, context) => {
    const {currentViewIndex} = this.state;
    const items = [];
    for (var i = 0; i < total; i++){
      items.push(
        <View key={i} style={i==currentViewIndex ? stylesCommon.paginationActive : stylesCommon.paginationItem} />
      );
    }

    return (
      <View style={stylesCommon.paginationStyle} >
        {items}
      </View>
    )
  }

  render() {
      const {layout} = this.state;
      if(layout == 0){
        return this.renderLayout0({...stylesCommon, ...stylesLayout0});
      }else {
        return this.renderLayout1({...stylesCommon, ...stylesLayout1});
      }
  }

  RenderBackground = ({item,styles}) => {
    const {currentViewIndex} = this.state;
    try{
      let gallery = item.package.info.gallery;
      let overflow = 0; 
      if(gallery.length > 3){
        height = "50%"
      }

      if(gallery.length > 0){
        let imageWidths = item.imageWidths;
        if(!imageWidths){
          imageWidths = this.createImageWidths(gallery.length,WINDOWWIDTH,2);
          item.imageWidths = imageWidths;
        }
        overflow = gallery.length - imageWidths.length;
        let views = item.views;
        let index = 0;
        if(!views){
          console.log("Create views");
          views = [];
          for (key in gallery){
            if(index > imageWidths.length-1){
              break;
            }

            let galleryItem = gallery[key];
            let width = imageWidths[index];
            let image = galleryItem.image.url !== undefined ? galleryItem.image.url : galleryItem.image;
            let hasVideo = galleryItem.video != undefined && galleryItem.video.sources != undefined ;
            console.log("hasVideo: " + hasVideo);
            views.push(
            <View 
              style={{
                width,
                height,
                padding:5,
                display: "flex"
                }}
                key={key}
            >
            <Image
              key={image}
              style={{width:"100%",height:"100%"}}
              source={{
                uri: image
              }}
              resizeMode="cover"
            />
            {hasVideo ?
            <View style={styles.center} >
              <Icon
                name='play'
                color='#ffffff'
                type='font-awesome'
                size={60}
            />
            </View> : null }
            </View>
            );
            index++;
          }
          item.views = views;
        }

        return(
        <View>
        <View
          key={item}
          style={{
              display: "flex",
              flexWrap: true,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width:"100%",
              height:"100%",
              backgroundColor:"white"
          }}>
            {item.views}
          </View>
            {overflow > 0 ?
              <Text style={styles.overflowText}>+{overflow}</Text>
              : null
            }
          </View>
        );
      }
    }catch(error){
      return (
        <FadeInView duration={500} style={styles.fade}>
        <Image
          style={styles.mainImage}
          source={{
            uri: item.image
          }}
        />
        </FadeInView>
      );
    }
  }

  renderItem0 = ({key, item, styles}) => {
    let title = null;
    try{
      title = item.title;
    }catch(e){}

    let description= null;
    try{
      description = item.description;
    }catch(e){}

    return (
      <View key={key} style={styles.container}> 
      {this.RenderBackground({item,styles})}
      <LinearGradient 
        start={{x: 0, y: 1}} end={{x: 0, y: 0}} 
        colors={['rgba(0,0,0,.9)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']} 
        style={styles.linearGradient} 
      />
      <View style={styles.contentContainer}>
        <View style={styles.row}>
          <Icon
            iconStyle={item.isAvailable? styles.noOpacity: styles.lockIcon}
            name='lock'
            color='#ffffff'
            type='font-awesome'
            size={50}
          />
          <View style={styles.col}>
            {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
            {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
          </View>
        </View>
      </View>
    </View> 
    );
  }

  renderLayout0 = (styles) => {
    const {currentViewIndex} = this.state;
    const {data,firstLayout} = this.props;
    const views = [];


    for (const key in data){
      let item = data[key];
      let renderItem = null;
      if(firstLayout && firstLayout == 1 && key == 0){
        let style = {...stylesCommon, ...stylesLayout1};
        renderItem = this.renderItem1({key,item,styles:style});
      }else{
        renderItem = this.renderItem0({key,item,styles});
      }

      views.push(renderItem);
      index++;
    }

    return (
      <View style={styles.container}>
          <Swiper
            showsButtons={false}
            loop={false}
            index={currentViewIndex}
            ref={this.swiperRef}
            renderPagination={this.renderPagination}
            >
          {views}
          </Swiper>
          <View 
            style={this.isActive() ? styles.controlsContainer : styles.noOpacity} 
          >
            <View 
              style={styles.nextContainer} 
            >
              <EvilIcon
                iconStyle={this.state.focused != "next" ? styles.nextButton: styles.buttonFocused}
                name='chevron-right'
                color='#ffffff'
                size={70}
              />
            </View>

            <View 
              style={styles.previousContainer} 
            >
              <EvilIcon
                iconStyle={this.state.focused != "previous" ? styles.previousButton: styles.buttonFocused}
                name='chevron-left'
                color='#ffffff'
                size={70}
              />
            </View>
          </View>
      </View>
    );
  }

  renderItem1 = ({key, item, styles}) => {

      let title = null;
      try{
        title = item.title;
      }catch(e){}

      let description= null;
      try{
        description = item.description;
      }catch(e){}

      let date = null;
      try{
        date = item.release_date;
      }catch(e){}

      let logo = null;
      try{
        logo = item.logo;
      }catch(e){}

      let image = null;
      try{
        image = item.image;
      }catch(e){}

      let buttonText = "Redeem Ticket";
      if(item.isRedeemed){
        buttonText = "Enter Event";
      }

      return(
      <View key = {key} style={styles.container}>
        {this.RenderBackground({item,styles})}
          <LinearGradient 
            start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,.90)', 'rgba(0,0,0,0)']}
            style={styles.linearGradient} 
            />
          <View style={styles.contentContainer}>
            {item.logo?
            <Image
              style={styles.logo}
              source={{
                uri: item.logo
              }}
            /> : null }
            {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
            {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
            {date? <Text style={styles.dateText} >{date}</Text>: null }
            <View 
              style={[styles.button,styles.buttonFocused]}
              >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </View>
          </View>
      </View>
      );
  }

  changeViewIndex=(index)=>{
    this.setState({currentViewIndex:index});
  }

  renderLayout1 = (styles) => {
    const {currentViewIndex, data} = this.state;
    const views = [];

    for (const key in data){
      let item = data[key];

      views.push(
        this.renderItem1({key, item,styles})
      );
    }

    return (
      <View style={styles.container}>
          <Swiper
            showsButtons={false}
            loop={false}
            index={currentViewIndex}
            ref={this.swiperRef}
            renderPagination={this.renderPagination}
            >
          {views}
          </Swiper>
          <View 
            style={this.isActive() ? styles.controlsContainer : styles.noOpacity} 
          >
            <View 
              style={styles.nextContainer} 
            >
              <Icon
                iconStyle={this.state.focused != "next" ? styles.nextButton: styles.buttonFocused}
                name='chevron-right'
                type='fontawesome'
                color='#ffffff'
                size={70}
              />
            </View>

            <View 
              style={styles.previousContainer} 
            >
              <Icon
                iconStyle={this.state.focused != "previous" ? styles.previousButton: styles.buttonFocused}
                name='chevron-left'
                type='fontawesome'
                color='#ffffff'
                size={70}
              />
            </View>
          </View>
      </View>
    );
  }
}

const stylesCommon = StyleSheet.create({
  container: {
    position: "absolute",
    top:0,
    flex: 1,
    backgroundColor: 'black',
    width: "100%",
    height: "100%"
  },
  center:{
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-start"
  },
  col: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    justifyContent: "center",
    marginLeft: 20
  },
  lockIcon: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    margin: 10
  },
  fade: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    width: "100%",
    height: "100%"
  },
  background: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    width: "100%",
    height: "100%"
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
    paddingBottom:150,
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
    paddingBottom:150,
    position: "absolute",
    height: "100%",
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  noOpacity: {
    opacity:0
  },  
  paginationStyle: {
    position: 'absolute',
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 78,
    width: "100%",
    flexDirection: 'row'
  },
  paginationItem: {
    marginRight:5,
    marginLeft:5,
    width:159,
    height: 3,
    backgroundColor: "white",
    opacity: BLUR_OPACITY
  },
  paginationActive: {
    marginRight:5,
    marginLeft:5,
    width:295,
    height: 3,
    backgroundColor: "white",
  },
  logo: {
    width:474,
    height: 224,
    margin: 20,
    resizeMode: "contain",
    padding:0
  },
  overflowText: {
    position: "absolute",
    right:5,
    top:WINDOWHEIGHT/2+5,
    padding: 30,
    color: "white",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 70,
    textShadowColor: 'grey',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5,
    fontFamily: "HelveticaNeue",
    //backgroundColor: "rgba(0,0,0,.2)"
  },
});

const stylesLayout0 = StyleSheet.create({
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    resizeMode: 'cover',
    backgroundColor: 'rgba(0,0,0,0)',
    top:0,
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
});

const stylesLayout1 = StyleSheet.create({
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    resizeMode: 'cover',
    width: "100%",
    height: "100%",
    left:'15%',
    top:0
  },
  linearGradient: {
    position: "absolute",
    left:0,
    top:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "60%",
    height: "100%"
  },
  contentContainer: {
    flex: 1,
    marginBottom: 150,
    marginLeft:"5%",
    alignItems: 'center',
    justifyContent: 'center',
    width: 615,
    height: "80%",
    resizeMode: "contain",
  },
  headerText: {
    color: '#fff',
    fontSize: 40,
    marginTop:20
  },
  subheaderText: {
    fontFamily: "Helvetica",
    letterSpacing: 13,
    textAlign: 'center',
    textTransform: "uppercase",
    lineHeight: 50,
    marginTop:20,
    color: '#fff',
    fontSize: 24,
    fontWeight: "300"
  },
  dateText: {
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textAlign: 'center',
    marginTop:30,
    color: '#fff',
    fontSize: 20,
    fontWeight: "300"
  },
});

export default Gallery;