import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import Video from 'react-native-video';


class SitePage extends React.Component {


  videoError = () => {

  }

  onBuffer = () => {

  }

  render() {
    let image = require('../../static/images/VideoPage.png');
    return (
      <View style={styles.container}>
      <Video source={{uri: "https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8"}}   // Can be a URL or a local file.
        ref={(ref) => {
          this.player = ref
        }}                                      // Store reference
        onBuffer={this.onBuffer}                // Callback when remote video is buffering
        onError={this.videoError}               // Callback when video cannot be loaded
        style={styles.video} 
        controls={true}
        />
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
  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
});

export default SitePage;