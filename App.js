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
  SafeAreaView,
  Button,
  StyleSheet,
  ScrollView,
  View,
  ImageBackground,
  Text,
} from 'react-native';

import GalleryPage from './pages/gallerypage'
import Login from './components/login'
import SitePage from './pages/sitepage'
import PlayerPage from './pages/playerpage'
import MainPage from './pages/mainpage'
import Fabric from './fabric';
import Config from './config.json';
import AppContext, {initialState} from './AppContext'
import LinearGradient from 'react-native-linear-gradient'
import { Navigation, Route } from './components/navigation';
import {JQ, isEmpty} from './utils'
import Video, {FilterType} from 'react-native-video';
import BackgroundVideo from './static/videos/EluvioLive.mp4'
import FadeInOut from 'react-native-fade-in-out';
import Spinner from 'react-native-loading-spinner-overlay';
import { LogBox } from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import { ElvPlatform } from './fabric/elvplatform';

const APP_STORAGE_KEY = "@eluvio_live";

function LoginPage(props) {
  return (
    <View style={styles.container}>
    <Video
      source = {BackgroundVideo}
      style={styles.background}
      muted = {true}
      resizeMode ="cover"
      repeat = {true}
    />
        <Login {...props}/>
  </View>
  );
}

function initPlatform(network){
  return new Promise(async (resolve, reject) => {
    console.log('loadPlatform');
    try {
      var configUrl = Config.networks[network].configUrl;
      var libraryId = Config.networks[network].platform.libraryId;
      var siteId = Config.networks[network].platform.objectId;
      var staticToken = Config.networks[network].staticToken;
      var fabric = new Fabric();
      console.log("Loading configUrl: " + configUrl);
      await fabric.init({configUrl, staticToken});
      console.log('fabric init');
      var platform = new ElvPlatform({fabric,libraryId,siteId});
      resolve({fabric, platform});
    } catch (e) {
      reject(e);
    }
  })
}

let defaultState = {
  redeemItems:{}
};

export default class App extends React.Component {
  state = initialState
  constructor(props) {
    super(props);
    this.reload = this.reload.bind(this);
    LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
    LogBox.ignoreAllLogs();
  }

  componentDidMount = async () => {
    //await this.storeData({test:"ya ya ya!"});
    //let data = await this.getData();
    //console.log("Data retrieved: ",data);
    await this.loadState();
    await this.reload();
    
    /*
    loadPlatform("demo").then(
      ({fabric,platform}) => {
        console.log("Successfully initialized the Fabric client. ");
        this.setState({fabric,platform})
      },
      error=>{
        console.log("Could not initialize the Fabric client: " + error);
      }
    );
    */
  }

  saveState = async () => {
    await this.storeData({redeemItems: this.state.redeemItems});
  };

  loadState = async () => {
    let saved = await this.getData();
    console.log("loadState ", saved);
    if(saved != null && !isEmpty(saved.redeemItems != undefined)){
      this.setState({redeemItems:saved.redeemItems});
    }else{
      console.log("no state found, setting default: ");
      this.setState({redeemItems:{}})
    }
  }

  storeData = async (value) => {
    console.log("storeData ", value);
    try {
      const jsonValue = JSON.stringify(value);
      await DefaultPreference.set(APP_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("Could not save app data.");
    }
  }

  getData = async () => {
    try {
      const jsonValue = await DefaultPreference.get(APP_STORAGE_KEY);
      console.log("retrieved from prefs: ", jsonValue);
      let state = JSON.parse(jsonValue);
      return state;
    } catch(e) {
      console.error("Could not retrieve app data.");
      return null;
    }
  }

  reload =  async ()=>{
    console.log("app reload");
    let {site,ticketCode,redeemItems} = this.state;

      let {fabric,platform} = await initPlatform("demo");
      let newSite = null;
      if(site && platform && fabric && ticketCode){
        let tenantId = site.info.tenant_id;
        let siteId = await this.redeemCode(fabric,site,redeemItems,tenantId,ticketCode);
        if(!siteId){
          console.log("Error redeeming site.");
          return;
        }
        
        platform.setFabric(fabric);
        await platform.load();
        
        let sites = await platform.getSites();
        for(index in sites){
          let test = sites[index];
          if(test.slug == site.slug){
            console.log("newSite found");
            newSite = test;
            break;
          }  
        }
      }else{
        platform.setFabric(fabric);
        await platform.load();
      }

      if(newSite){
        console.log("App setting new State: ");
        this.setState({fabric,platform, site:newSite});
      }else{
        this.setState({fabric,platform, site:null});
      }
  }

  //Use callback to execute after setState finishes.
  handleSetState  = (state,callback) => {
    this.setState(state,callback);
  }

  getRedeemedCodes = () =>{
    return this.state.redeemItems;
  }

  //Internal
  redeemCode = async (fabric,site, redeemItems, tenantId,ticketCode) =>{
    let id = await fabric.redeemCode(tenantId,ticketCode);
    if(id != null){
      let items = {...redeemItems};
      let objectId = site.objectId;
      items[objectId] = {ticketCode,tenantId};
      console.log("redeem success. ", items);
      this.setState(
        {redeemItems:items},
        async ()=>{
          await this.saveState();
          console.log("saved: ", await this.getData());
        }
      );
      return id;
    }
    return null;
  }

  render() {
    const {fabric, site, platform, redeemItems} = this.state;

    //FIXME: Find working spinner

    if(isEmpty(platform)){
      return (
        <Spinner
          textContent={'Loading...'}
          textStyle={styles.spinnerTextStyle}
        />
      );
    }
    
    return (
      <AppContext.Provider value={
        {
          fabric,
          site,
          platform,
          redeemItems,
          setAppState:this.handleSetState,
          appReload:this.reload
          }
        }
        >
        <Navigation default="main">
            <Route name="main" component={MainPage} />
            <Route name="redeem" component={LoginPage} />
            <Route name="site" component={SitePage} />
            <Route name="player" component={PlayerPage} />
            <Route name="gallery" component={GalleryPage} />          
        </Navigation>
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
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    width: "100%",
    height: "100%"
  },
  spinnerTextStyle: {
    color: '#FFF'
  },
});