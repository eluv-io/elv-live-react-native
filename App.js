/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
// import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';

import ReactNative, {
  StyleSheet,
  View,
  Text,
} from 'react-native';

import GalleryPage from './pages/gallerypage'
import Login from './components/login'
import AppButton from './components/appbutton'
import SitePage from './pages/sitepage'
import PlayerPage from './pages/playerpage'
import MainPage from './pages/mainpage'
import PresentsPage from './pages/presentspage'
import Fabric from './fabric';
import Config from './config.json';
import AppContext, {initialState} from './AppContext'
import { Navigation, Route } from './components/navigation';
import {JQ, isEmpty} from './utils'
import Video from 'react-native-video';
import BackgroundVideo from './static/videos/EluvioLive.mp4'
import Spinner from 'react-native-loading-spinner-overlay';
import { LogBox } from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import { ElvPlatform } from './fabric/elvplatform';
import DeviceInfo from 'react-native-device-info';
import uuid from 'react-native-uuid';

const APP_STORAGE_KEY = "@eluvio_live";
const APP_VERSION = 1.0;

const isHermes = () => !!global.HermesInternal;

function LoginPage(props) {
  return (
    <View style={styles.container}>
    <Video
      source = {BackgroundVideo}
      style={styles.background}
      //muted = {true}
      resizeMode ="cover"
      //repeat = {true}
    />
        <Login {...props}/>
  </View>
  );
}

function ErrorPage(props){
  let {text,next} = props.data;
  console.log("ErrorPage: " + JQ(props.data));
 
  if(isEmpty(text)){
    text = "An Unexpected error occured. Press to continue.";
  }

  return (
    <View style={styles.background}>
      <Text style={styles.text}>{text}</Text>
      <AppButton 
        hasTVPreferredFocus={true}
        onPress = {()=>{
          if(!isEmpty(next)){
            console.log("ErrorPage: " + JQ(next));
            props.navigation.replace(next[0],next[1]);
            return;
          }
          props.navigation.goBack();
        }}
        isFocused = {props.isActive}
        text="Continue"
      />
    </View>
  );
}

function ProgressPage(props){
  console.log("ProgressPage.");
 
  return (
    <View style={styles.background}>
    <Spinner
      visible={props.isActive}
      textContent={'Loading...'}
      textStyle={styles.text}
    />
    </View>
  );
}

function initPlatform(network){
  return new Promise(async (resolve, reject) => {
    console.time("****** App initplatform ******");
    try {
      var configUrl = Config.networks[network].configUrl;
      var libraryId = Config.networks[network].platform.libraryId;
      var siteId = Config.networks[network].platform.objectId;
      var fabric = new Fabric();
      console.log("Loading configUrl: " + configUrl);
      await fabric.initWithLib({configUrl, libraryId});
      var platform = new ElvPlatform({fabric,libraryId,siteId});
      resolve({fabric, platform});
    } catch (e) {
      reject(e);
    } finally{
      console.timeEnd("****** App initplatform ******");
    }
  })
}

let defaultState = {
  redeemItems:{},
  ticketCode:"",
  site:null,
  platform:null,
  fabric: null,
  reloadFinished: false,
  showDebug:false
};

export default class App extends React.Component {
  state = initialState
  constructor(props) {
    super(props);
    this.state = defaultState;

    this.reload = this.reload.bind(this);
    LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
    LogBox.ignoreAllLogs();
    this.appState = null;
    this.sessionTag = uuid.v4();
    console.log("Using Hermes engine? " + isHermes());
    if (__DEV__) {
      console.log('Running in Debug Mode.');
    }else{
      console.log('Running in Release Mode.');
    }
  }

  componentDidMount = async () => {
    await this.loadState();
    await this.reload();
    //There's a delay using this.
    //AppState.addEventListener("change", this._handleAppStateChange);
    console.log("Session params: " + this.getQueryParams());
  }

  componentWillUnmount = ()=>{
    //AppState.removeEventListener("change");
    console.log("App will unmount.");
  }

  getQueryParams = ()=>{
    return `&session_id=${encodeURIComponent(this.sessionTag)}&app_id=${encodeURIComponent(DeviceInfo.getBundleId())}&app_version=${encodeURIComponent(APP_VERSION)}&system_version=${encodeURIComponent(DeviceInfo.getSystemVersion())}`;
  }

  _handleAppStateChange = async (nextAppState) => {
    if (!this.appState || (this.appState.match(/inactive|background/) &&
      nextAppState === "active")
    ) {
      console.log("App has come to the foreground!");
      await this.loadState();
      await this.reload();
    }

    this.appState = nextAppState;
    console.log("AppState", this.appState.current);
  };

  saveState = async () => {
    await this.storeData({redeemItems: this.state.redeemItems});
  };

  loadState = async () => {
    console.time("****** App loadState ******");
    let saved = await this.getData();
    console.log("loadState ", saved);
    if(saved != null && !isEmpty(saved.redeemItems != undefined)){
      this.setState({redeemItems:saved.redeemItems});
    }else{
      console.log("no state found, setting default: ");
      this.setState(defaultState);
    }
    console.timeEnd("****** App loadState ******");
  }

  clearData = async () => {
    console.time("****** App clearData ******");
    try {
      //TODO: Confirmation dialog?

      await DefaultPreference.set(APP_STORAGE_KEY, "");
      await this.loadState();
      await this.reload();
    } catch (e) {
      console.error("Could not clear app data.");
    } finally {
      console.timeEnd("****** App clearData ******");
    }
  }

  storeData = async (value) => {
    console.time("****** App storeData ******");
    try {
      const jsonValue = JSON.stringify(value);
      await DefaultPreference.set(APP_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("Could not save app data.");
    }finally{
      console.timeEnd("****** App storeData ******");
    }
  }

  getData = async () => {
    console.time("****** App getData ******");
    try {
      const jsonValue = await DefaultPreference.get(APP_STORAGE_KEY);
      console.log("retrieved from prefs: ", jsonValue);
      let state = JSON.parse(jsonValue);
      return state;
    } catch(e) {
      console.error("Could not retrieve app data.");
      return null;
    } finally {
      console.timeEnd("****** App getData ******");
    }
  }

  reload =  async ()=>{
    console.time("****** App reload ******");
    await this.handleSetState({reloadFinished:false});

    let {site,ticketCode,redeemItems} = this.state;
    console.log("Redeem items: ",redeemItems);
    let {fabric,platform} = await initPlatform("demo");
    let newSite = null;
    if(site && platform && fabric && ticketCode){
      let tenantId = site.info.tenant_id;
      let status = await this.redeemCode(fabric,site,redeemItems,tenantId,ticketCode);
      if(!status){
        console.error("Error redeeming site. Invalid code.");
        throw "Error redeeming site";
      }
      
      platform.setFabric(fabric);
      await platform.load();
      
      let sites = await platform.getSites();
      for(index in sites){
        let test = sites[index];
        if(test.objectId == site.objectId){
          console.log("******** newSite found ***********");
          newSite = test;
          break;
        }  
      }
    }else{
      platform.setFabric(fabric);
      await platform.load();
    }

    await this.handleSetState({fabric,platform, site:newSite, reloadFinished:true});
    console.time("****** App reload ******");
  }

  //Use callback to execute after setState finishes.
  /*
  handleSetState  = (state,callback) => {
    this.setState(state,()=>{if(callback)callback(this.state)});
  }*/

  //You can use async/await now
  handleSetState = (state)=>{
    return new Promise((resolve) => {
      console.log("handleSetState: " + JQ(state.showDebug));
      this.setState(state, resolve);
    });
  }


  getRedeemedCodes = () =>{
    return this.state.redeemItems;
  }

  //Internal
  redeemCode = async (fabric,site, redeemItems, tenantId,ticketCode) =>{
    console.time("* App redeemCode *");
    let otpId = await fabric.redeemCode(tenantId,ticketCode);
    console.log("App redeemCode response: " + otpId);
    if(otpId != null){
      let items = {...redeemItems};
      let objectId = site.objectId;
      items[objectId] = {ticketCode,tenantId,otpId};
      console.log("Redeem success. ");
      this.setState(
        {redeemItems:items},
        async ()=>{
          await this.saveState();
        }
      );
      console.timeEnd("* App redeemCode *");
      return otpId;
    }
    console.timeEnd("* App redeemCode *");
    return null;
  }

  RenderDebug =() =>{
    let {showDebug} = this.state;
    console.log("showDebug: " + showDebug);
    if(!showDebug){
      return null;
    }

    return (
      <Text 
        style={{
          position:"absolute", 
          right:0, 
          top:0,
          color:"white",
          fontSize: 20
        }}
        >
        {"QueryParams: "+this.getQueryParams()}
      </Text>
    );

  }

  render() {
    const {fabric, site, platform, redeemItems,showDebug,reloadFinished} = this.state;

    //FIXME: Find working spinner

    if(isEmpty(platform)){
      return (
      <View style={styles.container}>
        <Spinner
          visible={true}
          textContent={'Loading...'}
          textStyle={styles.text}
        />
        </View>
      );
    }
    
    return (
      <AppContext.Provider value={
        {
          fabric,
          site,
          platform,
          redeemItems,
          showDebug,
          getQueryParams:this.getQueryParams,
          setAppState:this.handleSetState,
          appReload:this.reload,
          appClearData: this.clearData,
          reloadFinished: reloadFinished
          }
        }
        >
        <Navigation default="main">
            <Route name="main" component={MainPage} />
            <Route name="redeem" component={LoginPage} />
            <Route name="site" component={SitePage} />
            <Route name="player" component={PlayerPage} />
            <Route name="gallery" component={GalleryPage} />
            <Route name="presents" component={PresentsPage} />
            <Route name="error" component={ErrorPage} />
            <Route name="progress" component={ProgressPage} />
        </Navigation>
        <this.RenderDebug />
      </AppContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  },
  background: {
    position: "absolute",
    display: "flex",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'black',
    width: "100%",
    height: "100%"
  },
  spinnerTextStyle: {
    color: '#FFF'
  },
  errorMessage: {
    color: '#FFF'
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
  text: {
    fontFamily: "Helvetica",
    textAlign: 'center',
    margin:60,
    color: '#fff',
    fontSize: 36,
    fontWeight: "500"
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',    
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
    height: 60,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: "white",
  },
});