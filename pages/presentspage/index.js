import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler
} 
from 'react-native';
import Video from 'react-native-video';
import BackgroundVideo from '../../static/videos/EluvioLive.mp4'
import { isEmpty, JQ } from '../../utils';

function PresentsPage(props) {
  const {logo,title} = props.data;
  console.log("Presents page props: " + JQ(props.data));
  return (
    <View style={styles.container}>
    <Video
      source = {BackgroundVideo}
      style={styles.background}
      resizeMode ="cover"
    />
    <View style={styles.formContainer}>
      <Text style={styles.formText}>Presents</Text>
      {isEmpty(logo) ?  
      <Text style={styles.formText}>{title}</Text>:
      <Image
        style={styles.logo}
        source = {{
          uri: logo
        }}
      />
      }

    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black'
  },
  background: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    width: "100%",
    height: "100%"
  },
  formText: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    fontSize: 32,
    fontWeight: "200",
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
    color:"#F4E8D6"
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 320,
    width: '90%',
  },
  logo: {
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: 50,
    marginBottom: 20,
    resizeMode: "contain",
    width: "100%",
    height: 300
  },
});

export default PresentsPage;