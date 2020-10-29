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
import FastImage from 'react-native-fast-image'
import Modal from 'react-native-modal';
//import { NavigationContainer } from '@react-navigation/native';
//import { createStackNavigator } from '@react-navigation/stack';
import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import Login from './components/login'
import SitePage from './pages/sitepage'
import Fabric from './fabric';
import Config from './config.json';
import {JQ} from './utils';

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

//const Stack = createStackNavigator();


async function initFabric() {
  console.log('initFabric');
  try {
    var configUrl = Config.networks.main.configUrl;
    var fabric = new Fabric();
    var newNnemonic = await fabric.init({configUrl});
    console.log('Mnemonic generated ' + newNnemonic);
    setNnemonic(newNnemonic);
    setIsInit(true);
  } catch (e) {
    console.error('Error Initializing fabric: ' + e + JQ(e));
  }
}

export default class App extends React.Component {
  render() {
    return (
      /*
      <NavigationContainer>{
        <Stack.Navigator initialRouteName="login">
          <Stack.Screen name="login" component={LoginPage} />
          <Stack.Screen name="site" component={SitePage} />
        </Stack.Navigator>
      }</NavigationContainer>
      */
      <LoginPage />
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