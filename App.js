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
  Platform,
  View,
  ImageBackground,
  Text,
} from 'react-native';

import Login from './components/login'
import SitePage from './pages/sitepage'
import Fabric from './fabric';
import Config from './config.json';
import AppContext, {initialState} from './AppContext'

import { Navigation, Route } from './components/navigation';
import {JQ} from './utils'

function LoginPage(props) {
  let image = require('./static/images/codeAccess/concert.jpg');
  return (
    <View style={styles.container}>
      <ImageBackground
        source={image}
        style={styles.image}
      >
      <Login {...props}/>
      </ImageBackground>
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

export default class App extends React.Component {
  state = initialState
  constructor(props) {
    super(props);

    initFabric().then(
      fabric => {
        console.log("Successfully initialized the Fabric client.");
        this.setState({fabric})
      },
      error=>{
        console.log("Could not initialize the Fabric client: " + JQ(error))
      }
    )
  }

  handleSetState  = (state) => {
    this.setState(state);
  }

  render() {
    console.log("appstate: " + this.state)
    const {fabric, site} = this.state;
    return (
      <AppContext.Provider value={{fabric, site, setAppState:this.handleSetState}}>
        <Navigation default="login">
            <Route name="login" component={LoginPage} />
            <Route name="site" component={SitePage} />
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
  image: {
    flex: 1,
    resizeMode: "cover",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
});