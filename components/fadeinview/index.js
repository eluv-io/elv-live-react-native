import React, { useRef, useEffect } from 'react';
import { Animated, Text, View } from 'react-native';

export default FadeInView = (props) => {
/*
  console.log("FadeInView: " + props.run);
  if(props.run === false){
    return (
        <View                 // Special animatable View
          style={{
            ...props.style
          }}
        >
          {props.children}
        </View>
      );
  }
*/
  let start = props.start === undefined ? 0 : props.start;
  let end = props.end === undefined ?  1 : props.end;
  let duration = props.duration === undefined ? 1000 : props.duration;

  if(props.fadeOut){
    start= props.start === undefined ? 1 : props.start;
    end=props.end === undefined ? 0 : props.end;
  }

  const fadeAnim = useRef(new Animated.Value(start)).current  // Initial value for opacity: 0

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: end,
        duration,
        useNativeDriver: true,
      }
    ).start();
  }, [fadeAnim])

  return (
    <Animated.View                 // Special animatable View
      style={{
        ...props.style,
        opacity: fadeAnim,         // Bind opacity to animated value
      }}
    >
      {props.children}
    </Animated.View>
  );
}
