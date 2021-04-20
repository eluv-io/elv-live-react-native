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
import { isEmpty, JQ, dateCountdown,endsWithList } from '../../utils';
import { Icon } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient';
import testdata from '../../testdata/extras.js';
import { getOverlappingDaysInIntervals } from 'date-fns';

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
    this.onSelectExtra = this.onSelectExtra.bind(this);

    //setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  async componentDidMount() {
    console.log("MainPage componentDidMount");
    this.enableTVEventHandler();
  }

  loadSiteData = ()=>{
    console.log("MainPage loadSiteData");
    const {platform,redeemItems} = this.context;

    let sites = platform.getSites();
    //console.log("MainPage componentDidMount sites size: " + sites.length);
    siteData = [];

    for (const key in sites){
      let site = sites[key];
      console.log("Mainpage accessing site: " + key + " " + site.title);

      let eventTitle = null;
      try{
        try{
          eventTitle = site.info.event_info.event_title;
        }catch(e){}

        let eventHeader = null;
        try{
          eventHeader = site.info.event_info.event_header;
        }catch(e){}

        //console.log("event_header: " + site.info.event_info.event_header);

        let eventSub = null;
        try{
          eventSub = site.info.event_info.event_subheader;
        }catch(e){}
        //console.log("event_subheader: " + site.info.event_info.event_subheader);

        let date = null;
        let countDown = null;
        try{
          date = site.info.calendar.start_time;
          countDown = dateCountdown(date);
        }catch(e){}

        if(isEmpty(countDown)){
          countDown = site.info.event_info.date;
        }

        let item = {};
        item.title = eventTitle;
        item.description = eventSub;
        item.image = site.tv_main_background;
        item.logo = site.tv_main_logo;
        item.release_date = countDown;
        item.isAvailable = true;
        const extras = [];
    
        for (i in site.info.extras){
          let extra = site.info.extras[i];
          extra.index = i;
          extra.id = `${i}`;
          if(!extra.image){
            continue;
          }
          try{
            if(extra.image.url){
              extra.image = item.image.url;
            }
          }catch(e){
            console.error("Error parsing extras for thumbselector: " + e);
            continue;
          }
          //console.log("Extra image " + extra.image);
          extras.push(
            extra
          );
        }

        item.extras = extras;
        //console.log("Item: "+ item.title + " extras: " + extras.length);
        item.isRedeemed = site.objectId in redeemItems;
        siteData.push(item);
      }catch(e){
        console.error("Error parsing site info: " + e);
      }

    }

    //console.log("ComponentDidMount sites size: " + siteData.length);

    return siteData;
  }

  async componentWillUnmount(){
    console.log("MainPage componentWillUnmount");
    this.disableTVEventHandler();
  }

  enableTVEventHandler = () => {
    const {appClearData} = this.context;
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingExtras} = page.state;
      const {isActive} = page.props;
      if(isShowingExtras || !isActive || isEmpty(evt)){
        return;
      }

      if(evt.eventType == "focus"){
        //page.forceUpdate();
        return;
      }

      
      if(evt.eventType == "blur" || evt.eventType == "focus"){
        return;
      }
      //console.log("<<<<<<<< MainPage event received: "+evt.eventType);

      if(typeof evt.eventType  === 'string' || evt.eventType instanceof String){
        if(!this.remoteEvents){
          this.remoteEvents = [];
        }
        this.remoteEvents.push(evt.eventType.toLowerCase());
        //console.log("Current events: " + JQ(this.remoteEvents));
        if(this.remoteEvents.length > 10){
          this.remoteEvents.shift();
        }

        let cheatcode1 = ["playpause","left","right","left","right"];
        if(endsWithList(this.remoteEvents,cheatcode1)){
          console.log("!!!!!! Cheatcode cleardata activated! " + JQ(this.remoteEvents));
          await appClearData();
          page.forceUpdate();
          return;
        }
      }
      if (evt.eventType === 'swipeUp' || evt.eventType === "up") {
        let siteData = page.loadSiteData();

        if(isEmpty(siteData)){
          return;
        }

        let extras = null;
        try{
          let site = siteData[currentViewIndex];
          //console.log("Mainpage render current site: " + site.title);
          extras = site.extras;
          //console.log("Mainpage render current site extras: " + site.extras.length);
        }catch(e){
          console.log("Couldn't get extras from site " + JQ(e));
        }


        if(!isEmpty(extras)){
          page.setState({isShowingExtras:true});
        }
      }
    });
  }

  disableTVEventHandler = () => {
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

    const {setAppState, redeemItems,appReload} = this.context;
    const {navigation} = this.props;
    const {currentViewIndex} = this.state;

    console.log("select site index " + currentViewIndex);
    try{
      let site = sites[currentViewIndex];
      console.log("select site " + JQ(site.tv_main_logo));

      let redeemInfo = redeemItems[site.objectId];
      if(!isEmpty(redeemInfo) && !isEmpty(redeemInfo.ticketCode)){
        await setAppState({site,ticketCode: redeemInfo.ticketCode});
        try{
          let {site} = this.context;
          let logo = site.tv_main_logo;
          let title = site.title;
          navigation.transition("presents","site",{logo, title},11000);
          await appReload();
        }catch(e){
          console.error("Error loading site info: " + e);
          navigation.setNext("error", {text:"Could not retrieve event info."});
        }
      }else{
        await setAppState({site});
        navigation.navigate("redeem");
      }
    }catch(e){
      console.error(e);
    }
  }

  //Callback for Thumbselector
  onSelectExtra = async ({item,index}) => {
    let extraIndex = index;
    console.log("\n MainPage onSelectExtra() " + extraIndex);
    const {setAppState,redeemItems,appReload} = this.context;
    const {isActive,navigation} = this.props;
    const {currentViewIndex,isShowingExtras} = this.state;
    
    if(!isActive || !isShowingExtras){
      return;
    }

    const getData = (item)=>{
        let data = [];
        try{
          for(const i in item.package.info.gallery){
            let galleryItem = {...item.package.info.gallery[i]};
            if(galleryItem.image.url != undefined){
              galleryItem.image = galleryItem.image.url;
            }
          data.push(galleryItem);
        }
        }catch(e){console.log("Could not get extras info: "+e);}
        console.log(data);
        return data;
    }

    try{
      if(item.isAvailable){
        let data = getData(item);
        navigation.navigate("gallery",data);
      }else{
        console.log("Package not available: ");
        const sites = await this.getSites();
        let site = sites[currentViewIndex];
        console.log("select site extras 1 " + site.title);

        let redeemInfo = redeemItems[site.objectId];
        if(!isEmpty(redeemInfo) && !isEmpty(redeemInfo.ticketCode)){
          await setAppState({site,ticketCode: redeemInfo.ticketCode});
          try{
            console.log("App state set. selectedIndex " + extraIndex);
            navigation.navigate("progress");
            await appReload();
            console.log("App reloaded. selectedIndex " + extraIndex);
            let {site} = this.context;
            let extra = site.info.extras[extraIndex];
            let data = getData(extra);
            if(!isEmpty(data)){
              navigation.replace("gallery",data);
            }else{
              navigation.replace("error", {text:"Could not retrieve event info.", next:["redeem",{extra:index}]});
            }
          }catch(e){
            console.error("Error loading extra info: " + e);
            navigation.replace("error", {text:"Could not retrieve event info.", next:["redeem",{extra:index}]});
          }
        }else{
          await setAppState({site});
          //Redeem and then go to package view
          navigation.navigate("redeem",{extra:index});
        }
      }
    }catch(e){
      console.error(e);
      navigation.navigate("error", {text:"Could not retrieve event info."});
    }
  }

  render() {
    const {platform,setAppState} = this.context;
    const {navigation, isActive} = this.props;
    const {currentViewIndex,isShowingExtras} = this.state;
    //console.log("Mainpage>>>render");
    let siteData = this.loadSiteData();

    if(isEmpty(siteData)){
      return (
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      );
    }

    let data = siteData;
    let extras = null;
    try{
      let site = siteData[currentViewIndex];
      //console.log("<<<<< site.extras " + JQ(site.extras));
      extras = site.extras;
    }catch(e){
      console.log("Couldn't get extras from site " + JQ(e));
    }

    //console.log("<<<<< extras " + JQ(extras));
    let eluvioLogo = platform.eluvioLogo || "";

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
    padding:10,
    width: 191,
    height: 40,
    resizeMode:"contain"
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