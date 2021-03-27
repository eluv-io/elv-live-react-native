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

  createImageWidths = (size,maxWidth) => {
    imageWidths = [];
    let width=0;
    let totalWidth = maxWidth;
    for (let i = 0; i < size; i++){
      width = RandomInt(maxWidth*.2,maxWidth*.6);
      if(width > maxWidth *.5){
        width = maxWidth;
      }

      if(totalWidth - width > maxWidth*.2){
        totalWidth -= width;
      }else{
        width = totalWidth;
        totalWidth = maxWidth;
      }
      imageWidths.push(width);
    }
    return imageWidths;
  }

  async componentDidMount() {
    //this.setState({data: this.props.data});
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

      if (evt && evt.eventType === 'right') {
        page._next();
      } else if (evt && evt.eventType === 'up') {

      } else if (evt && evt.eventType === 'left') {
        page._previous();
      } else if (evt && evt.eventType === 'down') {

      } else if (evt && evt.eventType === 'playPause') {

      } else if (evt && evt.eventType === 'select') {
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

    //console.log("next() data: " + data);
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
    //console.log("RenderBackground screenwidth: " + WINDOWWIDTH);
    //console.log("RenderBackground item: " + item.image);
    try{
      let gallery = item.package.info.gallery;

      if(gallery.length > 3){
        height = "50%"
      }

      if(gallery.length > 0){
        let imageWidths = item.imageWidths;
        if(!imageWidths){
          imageWidths = this.createImageWidths(20,WINDOWWIDTH);
          console.log("Create Image widths: " + JQ(imageWidths));
          item.imageWidths = imageWidths;
          console.log("Create widths");
        }

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
            //console.log("RenderBackground image: " + image);            
            views.push(
            <View 
              style={{
                width,
                height,
                padding:5
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
            </View>
            );
            index++;
          }
          item.views = views;
        }

        return(

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
        );
      }
    }catch(error){
      //console.log(error);
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
      //console.log("New item: " + JQ(item));
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
    //console.log("Gallery renderLayout0 " + JQ(data));
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
      //console.log("New renderItem1 logo: " + JQ(item.logo));
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

      let buttonText = "Enter Event";
      return(
      <View key = {key} style={styles.container}>
        {this.RenderBackground({item,styles})}
          <LinearGradient 
            start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
            colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']} 
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
    //console.log("Gallery renderLayout1 " + JQ(data));
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
    flex: 1,
    backgroundColor: 'black',
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
    width:"100%",
    maxWidth:"100%",
    height: "30%",
    margin: 20,
    resizeMode: "contain",
    padding:0
  },
});

const stylesLayout0 = StyleSheet.create({
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    resizeMode: 'cover',
    backgroundColor: 'rgba(0,0,0,0)',
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
    left:'20%',
  },
  linearGradient: {
    position: "absolute",
    left:0,
    top:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "70%",
    height: "100%"
  },
  contentContainer: {
    flex: 1,
    marginTop:50,
    marginLeft:"10%",
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 615,
    height: "100%",
    resizeMode: "contain",
  },
  headerText: {
    color: '#fff',
    fontSize: 50,
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
    fontSize: 32,
    fontWeight: "300"
  },
  dateText: {
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textAlign: 'center',
    marginTop:30,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
});

export default Gallery;