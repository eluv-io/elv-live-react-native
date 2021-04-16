import React, {useRef, useEffect} from 'react';

import ReactNative, {
  Animated
} from 'react-native';

Slide = (props) => {
    let {show,distance,enabled} = props;
    
    if(!enabled){
      return props.children;
    }

    if(!distance){
      distance = 300;
    }

    const value = useRef(new Animated.Value(show? distance : 0)).current;

    useEffect(() => {
      Animated.timing(
          value,
          {
              toValue: show? 0: distance,
              useNativeDriver: true
          },
      ).start();
    },[props.show]);

    return (
        <Animated.View
          style={[props.styles, {
            transform: [
              {
                translateY: value
              }
            ]
          }]}
        >
        {props.children}
      </Animated.View>
    );
};

export default Slide;