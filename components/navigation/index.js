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
      stack: [sceneConfig[initialSceneName]],
    };

    TVMenuControl.enableTVMenuKey();

    BackHandler.addEventListener('hardwareBackPress', () => {
      console.log("Back pressed.");
      this.goBack();
      return true;

    });
    
  }

  navigate = (sceneName) => {
    if(sceneName != "login"){
      TVMenuControl.enableTVMenuKey();
    }

    this.setState(state => ({
      ...state,
      stack: [...state.stack, state.sceneConfig[sceneName]],
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
      const { stack } = state;
      if (stack.length > 1) {
        return {
          stack: stack.slice(0, stack.length - 1),
        };
      }else{
        console.log("disable tv menu")
        TVMenuControl.disableTVMenuKey();
        BackHandler.exitApp();
      }

      return state;
    });
  }
  
  render() {
    return (
      <View style={styles.container}>
        {this.state.stack.map((scene, index) => {
          const CurrentScene = scene.component;
          return (
            <FadeInView key={scene.key} style={styles.scene}>
              <CurrentScene
                navigation={this}
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
