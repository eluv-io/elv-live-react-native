import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler
} 
from 'react-native';
import Swiper from 'react-native-swiper'
import reactNativeTvosController from "react-native-tvos-controller"
import AppContext from '../../AppContext'
import {Site} from '../../fabric/site'
import { isEmpty, JQ, dateCountdown, dateStarted} from '../../utils';
import { Icon } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient';
import Gallery from '../../components/gallery'
var URI = require("urijs");
var UrlJoin = require("url-join");

const BLUR_OPACITY = 0.3;


class SitePage extends React.Component {
  static contextType = AppContext

  constructor(props) {
    super(props);
    let currentViewIndex = 0;
    this.state = {
      currentViewIndex,
      extras: []
    }
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.galleryRef = React.createRef();
    this.subscribed = false;

    this.select = this.select.bind(this);
    setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  async componentDidMount() {
    const {site} = this.context;
    const {data} = this.props;
    const {redeemItems} = this.context;

    try{
      let extras = [];

      //Push the main event site as the first extra
      let main = {};
      main.title = site.info.event_info.event_title;
      main.description = site.info.event_info.event_subheader;
      main.image = site.tv_main_background;
      main.logo = site.tv_main_logo;
      
      let date = null;
      let countDown = null;
      try{
        date = site.info.calendar.start_time;
        countDown = dateCountdown(date);
      }catch(e){}

      main.release_date = countDown;
      main.channels = site.channels;
      //XXX: TODO - find a way to check if the channel is available to play
      main.isAvailable = dateStarted(date);
      main.isRedeemed = site.objectId in redeemItems;
      extras.push(main);

      for(index in site.info.extras){
        let extra = site.info.extras[index];
        extras.push(extra);
        if(index == 1){
          console.log("Found extra: " + JQ(extra));      
        }  
      }
      this.setState({extras});

      if(data && this.galleryRef.current && !isNaN(data.extra)){
        //Add one to account for the main event inserted at the beginning.
        let currentViewIndex = parseInt(data.extra) + 1;
        console.log("SitePage select: " + currentViewIndex);
        this.galleryRef.current.setIndex(currentViewIndex);
      }

    }catch(error){
      console.log(error);
    }

  }

  componentWillUnmount(){

  }

  select(item){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }


    const {setAppState} = this.context;
    const {navigation} = this.props;

    let {extras,currentViewIndex, isPackagesVisible} = this.state;
    try{
      if(item.channels != undefined){
        navigation.navigate('player');
      }
    }catch(e){
      console.error(e);
    }

    try{
      if(item.package != undefined){
        let data = [];
        for(const index in item.package.info.gallery){
          let galleryItem = {...item.package.info.gallery[index]};
          if(galleryItem.image.url != undefined){
            galleryItem.image = galleryItem.image.url;
          }
          data.push(galleryItem);
          console.log("push data: " + JQ(galleryItem));
        }
        navigation.navigate('gallery', data);
      }
    }catch(e){
      console.error(e);
    }
  }

  RenderPagination = ({views,currentViewIndex, isVisible}) => {
    if(!views || !isVisible) return null;

    const items = [];
    for (var i = 0; i < views.length; i++){
      console.log("paginate: " + i);
      let view = views[i];
      items.push(
        <Image
          key = {i}
          style={i == currentViewIndex ? styles.paginationImageActive: styles.paginationImage}
          source={{
            uri: view.image_uri,
          }}
        />
      );
    }

    return (
      <View style={styles.paginationStyle}>
        {items}
      </View>
    )
  }

  //Create mosaic album cover
  getGalleryCoverImage(extra){
    const {platform} = this.context;
    let uri = new URI(platform.getCurrentHost() + "" + extra.image);
    //let uri = extra.images["landscape"];
    return uri.toString();
  }

  render() {
    const {platform,setAppState} = this.context;
    const {navigation, isActive} = this.props;
    const {currentViewIndex, extras} = this.state;

    const views = [];
    const extra = extras[currentViewIndex];

    let data = extras;
    //console.log("SitePage render() " + JQ(extras));
    return (
      <View style={styles.container}>
        <Gallery
          ref={this.galleryRef}
          isActive={isActive}
          layout={0} data={data}
          firstLayout={1}
          select={this.select}
          />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  linearGradient: {
    position: "absolute",
    left:0,
    top:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "70%",
    height: "100%"
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  formContainer: {
    position: "absolute",
    left:190,
    top:175,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 615,
    height: 718,
    //backgroundColor: "red",
  },
  noborder: {
    borderWidth: 0,
  },
  buttonContainer: {
    position: "absolute",
    left:0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: "40%",
    height: '60%',
    paddingBottom: 300,
    margin: 30,
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
    marginTop: 66,
    marginBottom: 10,
    margin: 30,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor:'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
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
  logo: {
    width:"100%",
    height: 225,
    resizeMode: "contain",
    //backgroundColor: "blue",
    padding:0
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
  noOpacity: {
    opacity:0
  },
  headerText: {
    color: '#fff',
    fontSize: 50,
  },
  subheaderText: {
    fontFamily: "Helvetica",
    letterSpacing: 13,
    textAlign: 'center',
    textTransform: "uppercase",
    lineHeight: 50,
    marginTop:66,
    color: '#fff',
    fontSize: 32,
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

export default SitePage;