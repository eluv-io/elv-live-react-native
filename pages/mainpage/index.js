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
} 
from 'react-native';
import Swiper from 'react-native-swiper'
import reactNativeTvosController from "react-native-tvos-controller"
import AppContext from '../../AppContext'
import Gallery from '../../components/gallery'
import ThumbSelector from '../../components/thumbselector'
import { isEmpty, JQ, dateCountdown } from '../../utils';
import { Icon } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient';
import testdata from '../../testdata/extras.js';

const BLUR_OPACITY = 0.3;

class MainPage extends React.Component {
  static contextType = AppContext
  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : 0,
      isShowingExtras : false
    }
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.extrasRef = React.createRef();
    this.subscribed = false;

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.select = this.select.bind(this);
    this.onExtrasVisible = this.onExtrasVisible.bind(this);

    //setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  async componentDidMount() {
    console.log("MainPage componentDidMount");
    this.enableTVEventHandler();
  }

  loadSiteData = ()=>{
    console.log("MainPage loadSiteData");
    const {platform} = this.context;

    let sites = platform.getSites();
    console.log("MainPage componentDidMount sites size: " + sites.length);
    siteData = [];

    let index = 0;
    for (const key in sites){
      let site = sites[key];
      console.log("Mainpage accessing site: " + key + " " + site.title);

      let eventTitle = null;
      try{
        eventTitle = site.info.event_info.event_title;
      }catch(e){}

      let eventHeader = null;
      try{
        eventHeader = site.info.event_info.event_header;
      }catch(e){}

      console.log("event_header: " + site.info.event_info.event_header);

      let eventSub = null;
      try{
        eventSub = site.info.event_info.event_subheader;
      }catch(e){}
      console.log("event_subheader: " + site.info.event_info.event_subheader);

      let date = null;
      let countDown = null;
      try{
        date = site.info.event_info.date;
        countDown = dateCountdown(date);
      }catch(e){}

      let item = {};
      item.title = eventTitle;
      item.description = eventSub;
      item.image = site.tv_main_background;
      item.logo = site.tv_main_logo;
      item.release_date = countDown;
      //item.extras = await this.createExtras(index);
      item.extras = site.info.extras;
      console.log("extras length: " + item.extras.length);
      siteData.push(item);

      index++;
    }

    console.log("ComponentDidMount sites size: " + siteData.length);

    return siteData;
  }

  async componentWillUnmount(){
    console.log("MainPage componentWillUnmount");
    this.disableTVEventHandler();
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingExtras} = page.state;
      if(isShowingExtras){
        return;
      }

      console.log("MainPage event received: "+evt.eventType);

      if (evt && evt.eventType === 'right') {
        //page.next();
      } else if (evt && evt.eventType === 'up') {
        //console.log("MainPage extras showControls");
        //page.extrasRef.current.showControls();
        page.setState({isShowingExtras:true});
      } else if (evt && evt.eventType === 'left') {
        //page.previous();
      } else if (evt && evt.eventType === 'down') {
        //page.extrasRef.current.hideControls();
        page.setState({isShowingExtras:false});
      } else if (evt && evt.eventType === 'playPause') {

      } else if (evt && evt.eventType === 'select') {
        //page.select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  onExtrasVisible(visible){
    console.log("Mainpage OnVisible " + visible);
    this.setState({isShowingExtras:visible});
  }

  next = async(index)=>{
    console.log("mainpage next()");
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if(!isActive || isShowingExtras){
      return;
    }

    try{
      let sites = await this.getSites();

      if(!sites){
        console.log("No sites for next()");
        return;
      }
      
      console.log("mainpage next ");

      this.setState({currentViewIndex:index});
    }catch(e){
      console.error("mainpage next error: " + e);
    }
  }
  
  previous = async(index)=>{
    console.log("mainpage previous()");
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if(!isActive || isShowingExtras){
      return;
    }

    try{
      let sites = await this.getSites();   
      if(!sites){
        console.log("No sites for previous");
        return;
      }

      console.log("mainpage previous " + index);
      this.setState({currentViewIndex:index});
    }catch(e){
      console.error("mainpage next error: " + e);
    }
  }

  getSites = async() => {
    const {platform} = this.context;

    let sites = [];
    try{
      sites = await platform.getSites();
    }catch(e){console.error("Could not get sites for mainpage: " + e)}
    return sites;
  }

  select = async () => {
    console.log("mainpage select()");
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if(!isActive || isShowingExtras){
      return;
    }

    let sites = await this.getSites();
    if(!sites){
      console.log("No sites for mainpage select()");
      return;
    }

    const {setAppState} = this.context;
    const {navigation} = this.props;
    const {currentViewIndex} = this.state;

    console.log("select site index " + currentViewIndex);
    try{
      let site = sites[currentViewIndex];
      console.log("select site " + JQ(site.title));
      setAppState({site});
      navigation.navigate('redeem')
    }catch(e){
      console.error(e);
    }
  }

  //Callback for Thumbselector
  onSelectExtra = async ({item,index}) => {
    const {setAppState} = this.context;
    const {isActive,navigation} = this.props;
    const {currentViewIndex,isShowingExtras} = this.state;
    
    if(!isActive || !isShowingExtras){
      return;
    }

    //XXX: For testing, it's able to retrieve the public metadata for some reason
    //let pack  = await item.resolvePackageLink();
    //console.log("mainpage extra select() " + JQ(item));

    try{
      if(item.isAvailable){
        //Go straight to package view
        let data = [];
          for(const index in item.package.info.gallery){
            let galleryItem = {...item.package.info.gallery[index]};
            if(galleryItem.image.url != undefined){
              galleryItem.image = galleryItem.image.url;
            }
          data.push(galleryItem);
        }
        navigation.navigate("gallery",data);
      }else{
        console.log("Package not available: ");
        const sites = await this.getSites();
        let site = sites[currentViewIndex];
        console.log("select site " + JQ(site.title));
        setAppState({site});

        //Redeem and then go to package view
        navigation.navigate("redeem",{extra:index});
      }
    }catch(e){
      console.error(e);
    }
  }

  RedeemButton = ({title}) => (
      <View 
        style={[styles.button,styles.buttonFocused]}
        >
        <Text style={styles.buttonText}>{title}</Text>
      </View>
  );

  renderPagination = (index, total, context) => {

    const items = [];
    for (var i = 0; i < total; i++){
      items.push(
        <View key={i} style={i==index ? styles.paginationActive : styles.paginationItem} />
      );
    }

    return (
      <View style={styles.paginationStyle} >
        {items}
      </View>
    )
  }

  createExtras = async (viewIndex)=> {
    console.log("createExtras " + viewIndex);
    let extras = [];
    if(viewIndex === undefined){
      return extras;
    }

    try{
      const sites = await this.getSites();

      let site = sites[viewIndex];
      //console.log("Sites: " + JQ(sites));
      //console.log("Site extras: " + JQ(site.info.extras.length));
      for(index in site.info.extras){
        let extra = site.info.extras[index];
        //console.log("   Extra found: " + extras.title);
        /*try{
          extra.package = await extra.resolvePackageLink();
        }catch(e){
          console.log("Couldn't resolve extra package for site: " + site.title);
        }*/
        extras.push(extra);
        //console.log("Found extra: " + JQ(extra));        
      }

    }catch(e){
      console.log("Couldn't find extras: " + e);
    }
    return extras;
  }

  render() {
    const {platform,setAppState} = this.context;
    const {navigation, isActive} = this.props;
    const {currentViewIndex,isShowingExtras} = this.state;

    let siteData = this.loadSiteData();

    if(isEmpty(siteData)){
      //console.log("no sites");
      return (
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      );
    }
    //console.log("mainpage render " + siteData.length);

    let data = siteData;
    let extras = null;
    try{
      let site = siteData[currentViewIndex];
      //console.log("Mainpage render current site: " + site.title);
      extras = site.extras;
      //console.log("Mainpage render current site extras: " + site.extras.length);
    }catch(e){
      console.log("Couldn't get extras from site " + JQ(e));
    }

    //console.log("Mainpage isShowingExtras " + JQ(isShowingExtras));
    let eluvioLogo = platform.eluvioLogo || "";
    //console.log("Eluvio Live Logo URL: " + eluvioLogo);

    return (
      <View style={styles.container}>
        <Gallery isActive={isActive && !isShowingExtras} 
          layout={1} 
          data={data}
          next={this.next}
          previous={this.previous}
          select={this.select}
        />
        {!isEmpty(extras) ?
          <ThumbSelector 
            isActive={isActive && isShowingExtras && !isEmpty(extras)}
            showBackground={false}
            showText={false}
            showImageLabels={true}
            data={extras}
            onHideControls={()=>{this.onExtrasVisible(false)}}
            onShowControls={()=>{this.onExtrasVisible(true)}}
            select={this.onSelectExtra}
            slide
            ref={this.extrasRef}
          /> 
          : null }
        <View style={styles.topRow} >
        <Image
            style={styles.eluvioLogo}
            source={{
              uri: eluvioLogo
            }}
            resizeMode="contain"
          />
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topRow: {
    position: "absolute",
    top: 0,
    left: 20,
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "flex-start",
    backgroundColor:"transparent",
    margin: 20
  },
  eluvioLogo:{
    width: 191,
    height: 40
  },
  background: {
    position: "absolute",
    alignItems: 'center',
    left:'20%',
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

export default MainPage;