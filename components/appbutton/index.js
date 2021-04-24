import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler,
  AccessibilityInfo,  
  findNodeHandle
} 
from 'react-native';

import Video from 'react-native-video';
import BackgroundVideo from '../../static/videos/EluvioLive.mp4'
import { isEmpty, JQ } from '../../utils';
import Timer from '../../utils/timer';

class AppButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPressed:false
    }
    this.tvEventHandler = null;
    this.onPress = this.onPress.bind(this);
    this.buttonRef = React.createRef();
  }
  
  async componentDidMount() {
    this.enableTVEventHandler();
  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  focus =()=>{
    if(this.buttonRef.current){
      //console.log("Appbutton focus "+ this.props.title);
      //this.buttonRef.current.focus();
      this.buttonRef.current.setNativeProps({
        hasTVPreferredFocus:true
      });
    }
  }
  
  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {isActive, isFocused} = page.props;
      if(!isActive && !isFocused){
        return null;
      }
      if(evt.eventType == "blur" || evt.eventType == "focus"){
        return;
      }

      console.log("Appbutton event: " + evt.eventType);

      if (evt && evt.eventType === 'select') {
        page.onPress();
      }
    });
  }

  onPress = ()=>{
    const {isActive, isFocused, onPress} = this.props;
    if(!isActive && !isFocused){
      return null;
    }

    this.setState({isPressed:true});
    let pressedTimer = Timer(() => {
      this.setState({isPressed:false});
      if(onPress){
        onPress();
      }
    }, 200);
    pressedTimer.start();
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  render() {
    const {text, isFocused, onPress, style, isActive, onFocus, ...otherProps} = this.props;
    const {isPressed} = this.state;

    if(isEmpty(text)){
      return null;
    }

    let buttonStyle = isFocused? [styles.button,styles.buttonFocused,style]: [styles.button, style];
    if(isPressed){
      buttonStyle = [styles.button,styles.buttonSelected,style];
    }
    
    //We need a real button if onFocus is passed in
    if(onFocus){
      return (
        //Don't use native focusable components, it will mess up the react-native-swiper because of the focus management.
        <TouchableOpacity
          ref={this.buttonRef}
          accessible={true}
          //hasTVPreferredFocus={isFocused}
          style={buttonStyle} 
          activeOpacity ={1}
          onFocus={onFocus}
          onPress={onPress}
          {...otherProps}
        >
          <Text style={styles.buttonText}>{text}</Text>
        </TouchableOpacity>
      );
    }

    return (
      //Don't use native focusable components, it will mess up the react-native-swiper because of the focus management.
      <View
        style={buttonStyle} 
        activeOpacity ={1}
        ref={this.props.innerRef}
        {...otherProps}
      >
        <Text style={styles.buttonText}>{text}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "normal",
    alignSelf: "center",
    textShadowColor: 'gray',
    fontFamily: "HelveticaNeue",
    paddingLeft:30,
    paddingRight:30,
    paddingTop:10,
    paddingBottom:10
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "white",
    opacity: 0.6
  },
  buttonFocused: {
    opacity: 1.0
  },
  buttonSelected: {
    shadowOpacity: .5,
    shadowRadius: 2,
    shadowOffset:{width:4,height:4},
    opacity: 1.0,
    borderWidth: 0,
    elevation:0,
    backgroundColor: 'rgba(100,100,100,1.0)'
  },
});

export default AppButton;