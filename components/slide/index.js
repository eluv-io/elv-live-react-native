import React, {useRef, useEffect} from 'react';

import {Animated} from 'react-native';

const Slide = (props) => {
  let {show, distance, enabled} = props;
  const value = useRef(new Animated.Value(show ? distance : 0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: show ? 0 : distance,
      useNativeDriver: true,
    }).start();
  }, [show]);

  if (!enabled) {
    return props.children;
  }

  if (!distance) {
    distance = 300;
  }

  return (
    <Animated.View
      style={[
        props.styles,
        {
          transform: [
            {
              translateY: value,
            },
          ],
        },
      ]}>
      {props.children}
    </Animated.View>
  );
};

export default Slide;
