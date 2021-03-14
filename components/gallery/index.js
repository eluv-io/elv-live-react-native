import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler,
  Image
} 
from 'react-native';
//import Image from 'react-native-fast-image'
import Swiper from 'react-native-swiper'
import reactNativeTvosController from "react-native-tvos-controller"
import AppContext from '../../AppContext'
import {Site} from '../../fabric/site'
import { isEmpty, JQ, dateCountdown } from '../../utils';
import { Icon } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient';

const BLUR_OPACITY = 0.3;

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
      currentViewIndex : 0,
      layout: props.layout || 0
    }
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.subscribed = false;

    this._next = this._next.bind(this);
    this._previous = this._previous.bind(this);
    this._select = this._select.bind(this);
    setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  async componentDidMount() {
    this.setState({data: this.props.data});
    this.enableTVEventHandler();
  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views} = page.state;
      console.log(evt.eventType);

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

    let {currentViewIndex,currentExtrasIndex} = this.state;

    console.log("next() data: " + data);
    if(!data){
      console.log("No sites for next()");
      return;
    }

    if(!this.swiperRef.current){
      console.log("No swiper ref.")
      return;
    }

    if(currentViewIndex >= data.length - 1){
      return;
    }
    
    console.log("next " + currentViewIndex + " sites: " + data.length);
    this.swiperRef.current.scrollBy(1, true);
    if(next){
      next();
    }
  }
  
  _previous(){
    const {isActive, previous, data} = this.props;
    if(!isActive){
      return;
    }

    const {currentViewIndex} = this.state;

    if(!data){
      console.log("No sites for previous");
      return;
    }

    if(!this.swiperRef.current){
      console.log("No swiper ref.")
      return;
    }
    
    if(currentViewIndex == 0){
      return;
    }

    console.log("previous " + currentViewIndex);
    this.swiperRef.current.scrollBy(-1, true);
    if(previous){
      previous();
    }
  }

  _select(){
    const {isActive,select,data} = this.props;
    if(!isActive || !select){
      return;
    }

    const {currentViewIndex} = this.state;

    console.log("select " + currentViewIndex);
    try{
      let selected = data[currentViewIndex];
      select(selected);
    }catch(e){
      console.error(e);
    }
  }

  renderPagination = (index, total, context) => {
    const items = [];
    for (var i = 0; i < total; i++){
      items.push(
        <View key={i} style={i==index ? stylesCommon.paginationActive : stylesCommon.paginationItem} />
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

  renderLayout0 = (styles) => {
    const {currentViewIndex} = this.state;
    const {data} = this.props;
    console.log("Gallery renderLayout0 " + JQ(data));
    const views = [];

    let index = 0;
    for (const key in data){
      let item = data[key];
      //console.log("New item: " + JQ(item));
      let title = null;
      try{
        title = item.title;
      }catch(e){}

      let description= null;
      try{
        description = item.description;
      }catch(e){}

      views.push(
        <View key = {key} style={styles.container}>
          <Image
            style={styles.mainImage}
            source={{
              uri: item.image,
            }}
          />
          <LinearGradient 
            start={{x: 0, y: 1}} end={{x: 0, y: 0}} 
            colors={['rgba(0,0,0,.9)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']} 
            style={styles.linearGradient} 
          />
          <View style={styles.contentContainer}>
            {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
            {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
          </View>
        </View>  
      );
      index++;
    }

    return (
      <View style={styles.container}>
          <Swiper
            style={styles.wrapper} 
            showsButtons={false}
            loop={false}
            onIndexChanged={
              (index) => {
                console.log("Swiper view changed: " + index);
                this.setState({currentViewIndex:index});
            }}
            ref={this.swiperRef}
            renderPagination={this.renderPagination}
            >
          {views}
          </Swiper>
          <View 
            style={styles.controlsContainer} 
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

  renderLayout1 = (styles) => {
    const {currentViewIndex, data} = this.state;
    console.log("Gallery renderLayout1 " + JQ(data));
    const views = [];

    let index = 0;
    for (const key in data){
      let item = data[key];
      //console.log("New item: " + JQ(item));
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

      views.push(
        <View key = {key} style={styles.container}>
          <Image
            style={styles.mainImage}
            source={{
              uri: image,
            }}
          />
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
      index++;
    }

    return (
      <View style={styles.container}>
          <Swiper
            style={styles.wrapper} 
            showsButtons={false}
            loop={false}
            onIndexChanged={
              (index) => {
                console.log("Swiper view changed: " + index);
                this.setState({currentViewIndex:index});
            }}
            ref={this.swiperRef}
            renderPagination={this.renderPagination}
            >
          {views}
          </Swiper>
          <View 
            style={styles.controlsContainer} 
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

});

const stylesLayout0 = StyleSheet.create({
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
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
  logo: {
    width:"100%",
    maxWidth:"100%",
    height: "30%",
    margin: 20,
    resizeMode: "contain",
    padding:0
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