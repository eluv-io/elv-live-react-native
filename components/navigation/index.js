import React, {useEffect} from 'react';
import { View, StyleSheet, Animated, Dimensions, BackHandler, TVMenuControl,Platform } from 'react-native';

import FadeInView from '../fadeinview'
const { width } = Dimensions.get('window');

export const Route = () => null;

const buildSceneConfig = (children = []) => {
  const config = {};

  children.forEach(child => {
    config[child.props.name] = { key: child.props.name, component: child.props.component };
  });

  return config;
};


export class Navigation extends React.Component {
  _animatedValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    const sceneConfig = buildSceneConfig(props.children);
    const initialSceneName = props.default || props.children[0].props.name;

    this.state = {
      sceneConfig,
      stack: [{scene:sceneConfig[initialSceneName],data:null}],
    };

    //Needed so BackHandler can detect the menu button on ios
    TVMenuControl.enableTVMenuKey();

    BackHandler.addEventListener('hardwareBackPress', () => {
      console.log("Back pressed.");
      this.goBack();
      return true;

    });
    
  }

  navigate = (sceneName, data=null) => {
    if(sceneName != "main"){
      //TVMenuControl.enableTVMenuKey();
    }

    this.setState(state => ({
      ...state,
      stack: [...state.stack, {scene:state.sceneConfig[sceneName],data}],
    }),() =>{
      this._animatedValue.setValue(width);
      Animated.timing(this._animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }

  goBack = () => {
    this.setState(state => {
      const { stack} = state;
      if (stack.length > 1) {
        return {
          stack: stack.slice(0, stack.length - 1)
        };
      }else{
        //Disabling the Menu on ios allows the the default action of exiting the app
        //For some reason the user has to press twice but this could possibly be a feature
        //So they don't accidentally exit?
        TVMenuControl.disableTVMenuKey();
        BackHandler.exitApp();
      }

      return state;
    });
  }
  
  render() {
    return (
      <View style={styles.container}>
        {this.state.stack.map(({scene,data}, index) => {
          console.log(`Navigation render: ${index} ${scene}`);
          const CurrentScene = scene.component;
          return (
            <FadeInView key={index} style={styles.scene}>
              <CurrentScene
                navigation={this}
                isActive={index == this.state.stack.length-1}
                data={data}
              />
            </FadeInView>
          );
        })}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});
