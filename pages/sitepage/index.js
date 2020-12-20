import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import Video from 'react-native-video';
import { JQ } from '../../utils';
import AppContext from '../../AppContext'

class SitePage extends React.Component {

  //Class components must declare the context
  static contextType = AppContext
  constructor(props) {
    super(props);
    this.state = {
      videoUrl : null,
      error : null
    }
  }

  async componentDidMount() {
    const {site,setState} = this.context;
    console.log("SitePage componentDidMount");

/*
    if(site.siteInfo.customizations){
      console.log("customizations: " + site.siteInfo.customizations);
      this.setState({videoUrl: site.siteInfo.customizations.demoTitle.playoutUrl});
      return;
    }
*/
    let keys = Object.keys(site.siteInfo.titles);
    console.log("SitePage: titles length " + keys.length);

    //try{
      if(keys.length== 0){
        //TODO:
      }else if(keys.length >= 1){
        let title = site.siteInfo.titles[keys[0]];
        console.log("Loading " + JQ(title));
        let offerings = await title.getAvailableOfferings();
        console.log("found availableOfferings " + JQ(title.availableOfferings));
        let offeringKeys = Object.keys(offerings);
        if(offeringKeys.length > 0){
          console.log("Found offerings ");
          let videoUrl = await offerings[offeringKeys[0]].getVideoUrl();
          console.log("Found videoUrl " + videoUrl);
          this.setState({videoUrl});
        }
      }else{
        //TODO:
      }
    //}catch(e){
    //  console.error(JQ(e));
    //}

  }


  videoError = () => {

  }

  onBuffer = () => {

  }

  render() {
    const {site,setState} = this.context;
    //console.log("SitePage: site " + JQ(site.siteInfo));
    let {videoUrl} = this.state;
    console.log("SitePage: videoUrl " + videoUrl);
    if(!videoUrl){
      return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
      );
    }
/*
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
    */

  //videoUrl =  "https://host-209-51-161-245.contentfabric.io/qlibs/ilibNpYFGR8XA4ByozB7JWzrSjmqJZj/q/hq__HdsvGRVhbCNaVWXd3pmC5KCgJ5vKudAJPWxAZeYW2hhC8m2ZYCYYyEinStbuMJvniyND8Pr2Hy/rep/playout/default/hls-aes128/video/video_1428x600@6000000/playlist.m3u8?authorization=ascsj_2GZMUidqPyTTG5jM8GGKh9rgnMbJkQuQHc4P4CTGHzMgcLSgvMdQHDce6JTft1dcJqn4R7YLHF39ykMgyRCgfPCdeRes8USnJxKhq5cgmtUgfnUbgAAh88LaKLZpFCtzrwmsNDq2WfMHizS68E4u1qSQ3nFyPKUfLrer1KdWJPeG38e7CdXc3HqAu4hpT5S81uL1rEoE9yu54twEPUoh6XftFdB168SA12VgLh5m4ctUDYQGeHz8fpdNjL2ZXJ4EnofakuwBYJTXhot7JYLxnYXWM6gv2tVNCaThxgeQn5gDAHdNi7egivtNBUrdQ81UGLiUY3dXgtvSNxM8TPw2wUKuiPwENJF3usg2BqC7mpCJFTfdzqvMT8QqwwqyKa3PRwtMnLDtdS63k4gxd64YrjN6Xwe3MacU5d81fbtQhc7SErZYwWs4cmcDvXUHcYs6pWs9tGYEweBD84aNnB3QLUAeZ75NZ3fZNAQo4Vm9Ekh9bNXKrEvYhabjiAfFuDdH5hthV1Roxw6YMJVjwix45UJSiu7r5PN6NPQdyH6cffUhUjYUpbZfHUvJygbsTYKdomrvC7VTwhvNxW38JzGSvoagm3o2hKukXmV3fXgNJtqYgBSBKH3b53TpUAoRnMi3xYwKBZ5vzJSNuoLVBLv8ki2rdWwweJKhpomCNJGMMvd44mSGBuMWeEpba81w8AMutXoxeNo4esXHfR9ttWvU4Sp6uy8xDiJKuVw7ZvTceDXdiwN1ArB98CavfnAwpVDFSnMD4KdG9h5ZofSFUF4MHdZndhURdnKNXFePXhtewyp6DHce2Ubgd4zqzPVGWRd4728M2QqcSTfvbZLeXbv4sszNxYMgR1w2dRchDu6QKYVECs1Qmtic8fiNASvQVKMsPRXnodV4daYozYvbAjXGJEYkRf1soPXDYUJGBhZfvtYPqnGaKsViqgKZyW2YfgRgYEMU3n.RVMyNTZLXzgzS1hFWFM4em1NVUtLbmFDbnhaS3NDYkcxUHQzUFJjV3dBZXplZ3hZRzh0U2l3blBLVzMxektZREtRVDNNRFhjZEdTSmNZNDdaQXY4OUp2U0Ryandvdkdy&player_profile=hls-js";

   return (
    <View style={styles.container}>
    <Video source={{uri: videoUrl}}   // Can be a URL or a local file.
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