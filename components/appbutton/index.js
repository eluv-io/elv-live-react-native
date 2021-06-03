import React, {useState, useEffect} from 'react';
import {Animated} from 'react-native';
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
  findNodeHandle,
} from 'react-native';

import Video from 'react-native-video';
import BackgroundVideo from '../../static/videos/EluvioLive.mp4';
import {isEmpty, JQ} from '../../utils';
import Timer from '../../utils/timer';

class AppButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPressed: false,
      alpha: new Animated.Value(1.0),
      scale: new Animated.Value(1.0),
    };
    this.tvEventHandler = null;
    this.onPress = this.onPress.bind(this);
    this.buttonRef = React.createRef();

    let duration = 500;
    this.onAnim = Animated.timing(this.state.alpha, {
      toValue: 1.0,
      duration: duration,
      useNativeDriver: true,
    });
    this.offAnim = Animated.timing(this.state.alpha, {
      toValue: 0.5,
      duration: duration / 2,
      useNativeDriver: true,
    });

    this.scaleOnAnim = Animated.timing(this.state.alpha, {
      toValue: 1.05,
      duration: duration / 2,
      useNativeDriver: true,
    });
    this.scaleOffAnim = Animated.timing(this.state.alpha, {
      toValue: 1.0,
      duration: duration,
      useNativeDriver: true,
    });
    this.scaleOnAnim = Animated.timing(this.state.alpha, {
      toValue: 1.05,
      duration: duration / 2,
      useNativeDriver: true,
    });
    this.scaleOffAnim = Animated.timing(this.state.alpha, {
      toValue: 1.0,
      duration: duration,
      useNativeDriver: true,
    });

    //Slight pulsating animation:
    //this.alphaLoop = Animated.loop(Animated.sequence([this.onAnim,this.offAnim]));
    //this.scaleLoop = Animated.loop(Animated.sequence([this.scaleOnAnim,this.scaleOffAnim]));
  }

  async componentDidMount() {
    this.enableTVEventHandler();
    this.startAnim();
  }

  startAnim = () => {
    this.onAnim.start();
    this.scaleOnAnim.start();
  };

  stopAnim = () => {
    this.offAnim.start();
    this.scaleOffAnim.start();
  };

  componentDidUpdate(prevProps, prevState) {
    //console.log('AppButton componentDidUpdate '+this.props.title + " prev " + prevProps.isFocused + " props: "+ this.props.isFocused);
    if (this.props.isFocused) {
      //console.log('AppButton Focus Changed!');
      //this.startAnim();
    } else {
      //this.stopAnim();
    }
  }

  componentWillUnmount() {
    this.disableTVEventHandler();
  }

  focus = () => {
    if (this.buttonRef.current) {
      //console.log("Appbutton focus "+ this.props.title);
      //this.buttonRef.current.focus();
      /*this.buttonRef.current.setNativeProps({
        hasTVPreferredFocus:true
      });*/
    }
  };

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {isActive, isFocused, fakeButton} = page.props;
      if (!isActive || !isFocused) {
        return null;
      }
      if (evt.eventType === 'blur' || evt.eventType === 'focus') {
        return;
      }

      //console.log("Appbutton event: " + evt.eventType);

      if (fakeButton && evt && evt.eventType === 'select') {
        page.onPress();
      }
    });
  }

  onPress = () => {
    const {isActive, isFocused, onPress} = this.props;
    console.log('Appbutton onPress: ' + isActive + ' ' + isFocused);
    if (!isActive || !isFocused) {
      return;
    }

    this.setState({isPressed: true});
    let pressedTimer = Timer(() => {
      this.setState({isPressed: false});
      if (!isActive || !isFocused) {
        return;
      }
      if (onPress) {
        console.log('AppButton calling onPress');
        onPress();
      }
    }, 100);
    pressedTimer.start();
  };

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  render() {
    const {
      text,
      isFocused,
      onPress,
      style,
      isActive,
      onFocus,
      textOnly,
      disabled,
      fakeButton,
      ...otherProps
    } = this.props;
    const {isPressed} = this.state;

    if (isEmpty(text)) {
      return null;
    }

    //console.log('Button ' + otherProps.title + ' ' + isFocused);

    let buttonStyle = isFocused
      ? [styles.button, styles.buttonFocused, style]
      : [styles.button, style];

    let buttonTextStyle = isFocused
      ? [styles.buttonText, styles.buttonTextFocused]
      : [styles.buttonText];

    if (textOnly) {
      buttonStyle = isFocused ? [styles.button, style] : [style];
      buttonTextStyle = [styles.buttonText];
    }

    if (isPressed) {
      buttonStyle = [styles.button, styles.buttonSelected, style];
    }

    //We need a real button if onFocus is passed in
    if (!fakeButton) {
      return (
        <TouchableOpacity
          ref={this.buttonRef}
          //accessible={true}
          //hasTVPreferredFocus={isFocused}
          disabled={disabled}
          activeOpacity={1}
          onFocus={onFocus}
          onPress={onPress}
          {...otherProps}>
          <Animated.View
            style={[
              buttonStyle,
              //{opacity:this.state.alpha},
              //{transform: [{ scale: this.state.alpha}]}
            ]}>
            <Text style={buttonTextStyle}>{text}</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }

    if (disabled) {
      buttonStyle = [...buttonStyle, {opacity: 0.5}];
    }

    return (
      //Don't use native focusable components, it will mess up the react-native-swiper because of the focus management.
      <Animated.View
        style={[buttonStyle]}
        ref={this.props.innerRef}
        {...otherProps}>
        <Text style={buttonTextStyle}>{text}</Text>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'normal',
    alignSelf: 'center',
    textShadowColor: 'gray',
    fontFamily: 'HelveticaNeue',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },
  buttonTextFocused: {
    color: 'black',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'white',
    minWidth: 160,
    opacity: 0.6,
  },
  buttonFocused: {
    opacity: 1.0,
    backgroundColor: 'rgba(200,200,200,1.0)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 3.84,
    elevation: 20,
  },
  buttonSelected: {
    shadowOpacity: 0.5,
    shadowRadius: 2,
    shadowOffset: {width: 4, height: 4},
    opacity: 1.0,
    borderWidth: 0,
    elevation: 0,
    backgroundColor: 'rgba(100,100,100,1.0)',
  },
});

export default AppButton;
