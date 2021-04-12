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
  TouchableOpacity,
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

const APP_STORAGE_KEY = "@eluvio_live";

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
  let {text} = props.data;
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
          props.navigation.goBack();
        }}
        isFocused = {props.isActive}
        text="Continue"
      />
    </View>
  );

/*
  return (
    <View style={styles.background}>
    <Text style={styles.text}>{text}</Text>
    <TouchableOpacity
      style={styles.continueButton} 
      activeOpacity ={0.6}
      hasTVPreferredFocus={true}
      onPress = {()=>{
        props.navigation.goBack();
      }}
    >
      <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>

  </View>
  );
  */
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
    console.log('loadPlatform');
    try {
      var configUrl = Config.networks[network].configUrl;
      var libraryId = Config.networks[network].platform.libraryId;
      var siteId = Config.networks[network].platform.objectId;
      //var staticToken = Config.networks[network].staticToken;
      var fabric = new Fabric();
      console.log("Loading configUrl: " + configUrl);
      //await fabric.init({configUrl, staticToken});
      await fabric.initWithLib({configUrl, libraryId});
      console.log('fabric init');
      var platform = new ElvPlatform({fabric,libraryId,siteId});
      resolve({fabric, platform});
    } catch (e) {
      reject(e);
    }
  })
}

let defaultState = {
  redeemItems:{},
  ticketCode:"",
  site:null,
  platform:null,
  fabric: null
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
      this.setState(defaultState);
    }
  }

  clearData = async () => {
    console.log("Clear data!");
    try {
      //TODO: Confirmation dialog?

      await DefaultPreference.set(APP_STORAGE_KEY, "");
      await this.loadState();
      await this.reload();
    } catch (e) {
      console.error("Could not clear app data.");
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
      console.log("Redeem items: ",redeemItems);
      let {fabric,platform} = await initPlatform("demo");
      let newSite = null;
      if(site && platform && fabric && ticketCode){
        let tenantId = site.info.tenant_id;
        let siteId = await this.redeemCode(fabric,site,redeemItems,tenantId,ticketCode);
        if(!siteId){
          throw "Error redeeming site";
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
    this.setState(state,()=>{if(callback)callback(this.state)});
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
          setAppState:this.handleSetState,
          appReload:this.reload,
          appClearData: this.clearData
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