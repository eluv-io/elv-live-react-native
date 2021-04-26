import React from 'react';
import {
  Text, 
  StyleSheet, 
  View,
  TVEventHandler,
  Image,
} 
from 'react-native';
import AppContext from '../../AppContext'
import Gallery from '../../components/gallery'
import ThumbSelector from '../../components/thumbselector'
import { isEmpty, JQ, endsWithList } from '../../utils';
import Spinner from 'react-native-loading-spinner-overlay';

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
  }

  async componentDidMount() {
    console.log("MainPage componentDidMount");
    this.enableTVEventHandler();
  }

  loadSiteData = ()=>{
    console.log("MainPage loadSiteData");
    const {platform,redeemItems} = this.context;
    const {isActive} = this.props;
    if(!platform || !isActive){
      console.log("exiting, not active.");
      return [];
    }

    let sites = platform.getSites();
    siteData = [];

    for (const key in sites){
      try{
        let site = sites[key];
        if(!site){
          console.error("Mainpage, site is null");
          continue;
        }
        let eventTitle = null;
        try{
          eventTitle = site.info.event_info.event_title;
        }catch(e){}

        let eventHeader = null;
        try{
          eventHeader = site.info.event_info.event_header;
        }catch(e){}

        let eventSub = null;
        try{
          eventSub = site.info.event_info.event_subheader;
        }catch(e){}

        console.log("MainPage loadSiteData Site: " + site.title + " accessible " + site.info.accessible);
        let item = {};
        item.title = eventTitle;
        item.description = eventSub;
        item.image = site.tv_main_background;
        item.logo = site.tv_main_logo;
        item.release_date = site.info.event_info.date;
        item.isAvailable = true;
        item.isAccessible = site.info.accessible && site.info.accessible === true;

        if(site.objectId && !isEmpty(redeemItems)){
          item.isRedeemed = site.objectId in redeemItems;
        }else{
          item.isRedeemed = false;
        }
        siteData.push(item);
      }catch(e){
        console.error("Error parsing site info: " + e);
      }
    }

    return siteData;
  }
  
  loadSiteExtras = (index)=>{
    console.log("MainPage loadSiteExtras " + index);
    let extras = [];
    try{
      const {platform} = this.context;
      const {isActive} = this.props;
      if(!platform || !isActive){
        console.log("exiting, not active.");
        return [];
      }
      
      let sites = platform.getSites();
      if(index > sites.length-1){
        console.error("Mainpage loadSiteExtras - index out of range. ",index);
        return [];
      }

      let site = sites[index];
      console.log("MainPage finding extras for site " + site.title + " extras length: " + site.info.extras.length);
      for (var i in site.info.extras){
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
        console.log("Extra image " + extra.image);
        extras.push(
          extra
        );
      }
    }catch(e){
      console.error("MainPage loadSiteExtras: "+e);
    }
    return extras;
  }

  async componentWillUnmount(){
    console.log("MainPage componentWillUnmount");
    this.disableTVEventHandler();
  }

  enableTVEventHandler = () => {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingExtras} = page.state;
      const {navigation} = page.props;
      const {appClearData,showDebug,setAppState} = page.context;

      const {isActive} = page.props;
      if(!isActive || isEmpty(evt)){
        return;
      }
      
      if(evt.eventType == "focus"){
        return;
      }

      if(evt.eventType == "blur" || evt.eventType == "focus"){
        return;
      }
      
      if(isShowingExtras){
        return;
      }

      console.log("<<<<<<<< MainPage event received: "+evt.eventType);

      if (evt.eventType === 'swipeUp' || evt.eventType === "up") {
        let siteData = page.loadSiteData();

        if(isEmpty(siteData)){
          console.log("No siteData for up event.");
          return;
        }

        let extras = null;
        try{
          extras = page.loadSiteExtras(currentViewIndex);
          console.log("Mainpage event handler current site extras: " + site.extras.length);
        }catch(e){
          console.log("Couldn't get extras from site ", e);
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

  select = async ({index,item}) => {
    console.log("mainpage select() " + index);
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

    if(index != currentViewIndex){
      this.setState({currentViewIndex:index});
    }

    console.log("select site index " + index);
    try{
      let site = sites[index];
      //console.log("select site " + JQ(site.tv_main_logo));

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
          navigation.setNext("error", {text:"Could not retrieve event info. Please try again.",reload:true});
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
    const {platform,network} = this.context;
    const {isActive} = this.props;
    const {currentViewIndex,isShowingExtras} = this.state;
    //console.log("Mainpage>>>render currentViewIndex " + currentViewIndex);
    if(!platform){
      return <View style={styles.background}/>;
    }

    let siteData = this.loadSiteData();
    if(isEmpty(siteData))
    {
      //console.log("Mainpage>>>render no siteData ");
      return null;
    }

    if(currentViewIndex > siteData.length - 1){
      this.setState({currentViewIndex:0});
      return null;
    }

    let data = siteData;
    let extras = null;
    extras = this.loadSiteExtras(currentViewIndex);

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
          onIndexChanged={(index)=>{
            
            console.log("MainPage onIndexChanged: "+index);
            this.setState({currentViewIndex:index});
            
            }
          }
          index={currentViewIndex}
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
        {network && network != "production" ? <Text style={styles.networkText}>{network.toUpperCase()}</Text> : null}
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    display: "flex",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'black',
    width: "100%",
    height: "100%"
  },
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
    justifyContent: "flex-start",
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
  networkText: {
    color: '#ca00a7',
    fontSize: 20,
    justifyContent: "center",
    fontWeight: 'bold',
    marginLeft:5,
    marginTop: 2
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