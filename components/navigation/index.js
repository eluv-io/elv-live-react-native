import React, {useEffect} from 'react';
import { View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  BackHandler, 
  TVMenuControl,
  TVEventHandler } from 'react-native';
import Timer from '../../utils/timer';
import FadeInView from '../fadeinview'
const { width } = Dimensions.get('window');
import { isEmpty } from '../../utils';
import AppContext from '../../AppContext'

export const Route = () => null;

const buildSceneConfig = (children = []) => {
  const config = {};

  children.forEach(child => {
    config[child.props.name] = { key: child.props.name, component: child.props.component };
  });

  return config;
};


export class Navigation extends React.Component {
  static contextType = AppContext;
  _animatedValue = new Animated.Value(0);

  constructor(props) {
    super(props);

    sceneConfig = buildSceneConfig(props.children);
    this.initialSceneName = props.default || props.children[0].props.name;

    this.state = {
      sceneConfig,
      stack: [{scene:sceneConfig[this.initialSceneName],data:null}],
    };

    // Holds {sceneName, data} to be shown after a timeout or keypress
    this.queued = null;

    //Needed so BackHandler can detect the menu button on ios
    TVMenuControl.enableTVMenuKey();

    BackHandler.addEventListener('hardwareBackPress', () => {
      console.log("Back pressed.");
      this.goBack();
      return true;
    }); 
  }

  async componentDidMount() {
    this.enableTVEventHandler();
  }

  async componentWillUnmount(){
    this.disableTVEventHandler();
  }

  showMessage = (sceneName, text) =>{
    if(!isEmpty(this.state.sceneConfig[sceneName])){
      this.navigate(sceneName,text);
      this.queued=null;
    }
  }

  switchToQueued = () =>{
    const {reloadFinished} = this.context;
    if(!reloadFinished){
      return;
    }

    try{
      if(!isEmpty(this.queued)){
        this.replace(this.queued.sceneName, this.queued.data);
        this.queued = null;
      }
    }catch(e){}
  }

  cancelTransition = () =>{
    this.queued = null;
  }

  enableTVEventHandler = () => {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingExtras} = page.state;
      if(evt.eventType == "blur" || evt.eventType == "focus"){
        return;
      }

      console.log("Navigation event: " + evt.eventType);
      console.log("Navigation stack: ",page.state.stack);
      page.switchToQueued();
    });
  }

  disableTVEventHandler = () => {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  animate = () =>{
    this._animatedValue.setValue(width);
    Animated.timing(this._animatedValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  //Transitions from scene1 to scene2 with delay in ms. If the delay is 0 (default), 
  // the user has to press a button
  transition = (scene1, scene2, data=null, delayMS=0) => {
    if(!this.state.sceneConfig[scene1] || !this.state.sceneConfig[scene2]){
      console.error("Navigation transition error, no sceneName " + sceneName);
      return;
    }


    this.navigate (scene1,data);
    this.queued={sceneName: scene2,data};

    if(delayMS > 0){
      if(!isEmpty(this.pressedTimer)){
        this.pressedTimer.stop();
        this.pressedTimer = null;
      }

      this.pressedTimer = Timer(() => {
        this.switchToQueued();
      }, delayMS);
      this.pressedTimer.start();
    }
  }

  setNext(sceneName,data){
    this.queued={sceneName,data};
  }

  navigate = (sceneName, data=null) => {
    console.log("navigation navigate " + sceneName);
    if(sceneName != "main"){
      //Needed or else the app with exit with the menu key during other screens than main.
      TVMenuControl.enableTVMenuKey();
    }

    let scene = this.state.sceneConfig[sceneName];
    if(!scene){
      console.error("Navigation navigate error, no sceneName " + sceneName);
      return;
    }

    this.setState(state => ({
      ...state,
      stack: [...state.stack, {scene:state.sceneConfig[sceneName],data}],
    }),this.animate);
  }

  replace = (sceneName, data=null) => {
    console.log("navigation replace " + sceneName);
    if(sceneName != "main"){
      //Needed or else the app with exit with the menu key during other screens than main.
      TVMenuControl.enableTVMenuKey();
    }

    let scene = this.state.sceneConfig[sceneName];
    if(!scene){
      console.error("Navigation replace error, no sceneName " + sceneName);
      return;
    }
    
    this.setState(state => {
      console.log("set state.");
      const {stack} = state;
      let newStack = stack;

      console.log("Current stack: ", newStack);

      if (stack.length > 1) { 
        newStack = stack.slice(0, stack.length - 1)
        console.log("New stack sliced: ", newStack);
      }

      newStack = [...newStack,{scene:state.sceneConfig[sceneName],data}];
      console.log("New stack final: ", newStack);
      
      return {...state, stack:newStack};
    },this.animate);
  }

  goBack = (toFirst=false) => {
    this.cancelTransition();
    this.setState(state => {
      const {stack} = state;
      if (stack.length > 1) {
        if(toFirst){
          return{stack:[stack[0]]}
        }else{
          return {
            stack: stack.slice(0, stack.length - 1)
          };
        }
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

  //Removes the all scenes up to the first one, under the current one.
  removeUnder = () => {
    this.setState(state => {
      const {stack} = state;
      if (stack.length > 1) {
        return {
          stack: [stack[0],stack[stack.length-1]]
        };
      }
      return state;
    });
  }

  loadDefault = () => {
    console.log("navigation loadDefault ");
    this.setState({stack: [{scene:this.state.sceneConfig[this.initialSceneName],data:null}]});
  }

  render() {
    let activeIndex = this.state.stack.length-1;
    console.log("active index: " + activeIndex);

    return (
      <View style={styles.container}>
        {this.state.stack.map(({scene,data}, index) => {
          console.log(`Navigation render: ${index} ${scene.key}`);
          if(!scene){
            return null;
          }

          const CurrentScene = scene.component;
          /*
          let comp = React.Render(CurrentScene);
          if(comp && comp.update()){
            comp.update();
          }
          */


          return (
            <FadeInView key={index} style={styles.scene}>
              <CurrentScene
                navigation={this}
                isActive={index == activeIndex}
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
    backgroundColor:"black"
  },
});
