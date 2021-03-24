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

import { ElvPlatform } from './fabric/elvplatform';

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


function initFabric() {
  return new Promise(async (resolve, reject) => {
    console.log('initFabric');
    try {
      var configUrl = Config.networks.demo.configUrl;
      var fabric = new Fabric();
      //TODO:
      var newNnemonic = await fabric.initFromKey({configUrl, privateKey:"0x06407eef6fa8c78afb550b4e24a88956f1a07b4a74ff76ffaacdacb4187892d6"});
      resolve(fabric);
    } catch (e) {
      reject(e);
    }
  })
}

function loadPlatform(network){
  return new Promise(async (resolve, reject) => {
    console.log('loadPlatform');
    try {
      var configUrl = Config.networks[network].configUrl;
      console.log('test');
      var libraryId = Config.networks[network].platform.libraryId;
      var siteId = Config.networks[network].platform.objectId;
      var staticToken = Config.networks[network].staticToken;
      var fabric = new Fabric();
      console.log("Loading configUrl: " + configUrl);
      await fabric.init({configUrl, staticToken});
      console.log('fabric init');
      var platform = new ElvPlatform({fabric,libraryId,siteId});
      await platform.load();
      resolve({fabric, platform});
    } catch (e) {
      reject(e);
    }
  })
}

export default class App extends React.Component {
  state = initialState
  constructor(props) {
    super(props);

    loadPlatform("demo").then(
      ({fabric,platform}) => {
        console.log("Successfully initialized the Fabric client. ");
        this.setState({fabric,platform})
      },
      error=>{
        console.log("Could not initialize the Fabric client: " + JQ(error))
      }
    )

    this.reload = this.reload.bind(this);
    LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
    LogBox.ignoreAllLogs();
  }

  reload =  async ()=>{
    console.log("app reload");
    let {site,ticketCode} = this.state;
    try{
      const {fabric,platform} = await loadPlatform("demo");
      let newSite = null;
      if(site && platform && fabric && ticketCode){
        let tenantId = site.info.tenant_id;
        let siteId = await fabric.redeemCode(tenantId,ticketCode);
        await platform.load();
        let sites = await platform.getSites();
        for(index in sites){
          let test = sites[index];
          if(test.slug == site.slug){
            newSite = test;
            break;
          }  
        }

        if(newSite){
          console.log("Redeemed siteId: " + siteId);
          setAppState({site:newSite});
        }else{
          throw "Couldn't find site.";
        }
      }
      this.setState({fabric,platform, site:newSite});
    }catch(error){
      console.log("App Error reloading: " + JQ(error));
      navigator.navigate("main");
    }
  }

  handleSetState  = (state) => {
    //console.log("setState " + JQ(state));
    this.setState(state);
  }

  render() {
    const {fabric, site, platform} = this.state;

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
      <AppContext.Provider value={{fabric, site, platform, setAppState:this.handleSetState, appReload:this.reload}}>
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