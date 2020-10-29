import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';

class SitePage extends React.Component {
  render() {
    let image = require('../../static/images/VideoPage.png');
    return (
      <View style={styles.container}>
        <ImageBackground
          source={image}
          style={styles.image}
        >
        </ImageBackground>
      </View>
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

export default SitePage;