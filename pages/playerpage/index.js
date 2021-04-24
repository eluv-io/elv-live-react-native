import React from 'react';
import { StyleSheet, Text, View, Image,TouchableOpacity,TVEventHandler} from 'react-native';
import Video from 'react-native-video';
import { isEmpty, JQ } from '../../utils';
import Timer from '../../utils/timer';
import AppContext from '../../AppContext'
import ThumbGallery from '../../components/gallery/thumbgallery'
import ThumbSelector from '../../components/thumbselector';
import EluvioLiveLogo from '../../static/images/fulllogo.jpg'

var URI = require("urijs");

const THUMBWIDTH = 300;

class PlayerPage extends React.Component {

  //Class components must declare the context
  static contextType = AppContext
  static defaultState = {
      videoUrl : null,
      error : null,
      isShowingControls: false,
      currentViewIndex: 0,
      views: [],
      //volume: .8,
      playPause: false,
      sid: null
    }

  constructor(props) {
    super(props);
    this.state = PlayerPage.defaultState;
    this.tvEventHandler = null;
    this.showControls = this.showControls.bind(this);
    this.hideControls = this.hideControls.bind(this);
    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.select = this.select.bind(this);
    this.videoRef = React.createRef();
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingControls,playPause,progress} = page.state;
      console.log("Player page event: " + evt.eventType);
      if(isShowingControls){
        return;
      }

      try{
        if (evt && evt.eventType === 'right') {

        } else if (evt && evt.eventType === 'left') {

        } else if (evt && evt.eventType === 'swipeRight') {
          if(page.videoRef.current && progress){
            let seekTime = progress.currentTime + 10;
            console.log("Seek forward ", seekTime);
            page.videoRef.current.seek(seekTime);
          }
        } else if (evt && evt.eventType === 'swipeLeft') {
          if(page.videoRef.current && progress){
            let seekTime = progress.currentTime - 10;
            console.log("Seek back ", seekTime);
            page.videoRef.current.seek(seekTime);
          }
        }
        else if (evt && evt.eventType === 'up') {
          /*
          let volume = page.state.volume;
          console.log("volume " + volume);
          volume += 0.1;
          page.setState({volume});
          */
        } else if (evt && evt.eventType === 'down') {
          /*
          let volume = page.state.volume;
          console.log("volume " + volume);
          volume -= 0.1;
          page.setState({volume});
          */
        } 
        else if (evt && evt.eventType === 'playPause') {

        } else if (evt && evt.eventType === 'select') {
          let newPlaypause = !playPause;
          console.log("playPause " + newPlaypause);
          page.setState({playPause:newPlaypause});
        }
      }catch(e){console.error("PlayerPage remoteEvent: " + e)}
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  showControls = async ()=>{
    const {platform,site,fabric,setState} = this.context;
    let {channelHash, offering, isShowingControls, sid, currentViewIndex} = this.state;
    console.log("Player page Show controls ",sid,offering,isShowingControls);

    if(isShowingControls || !sid){
      return;
    }
    let views = [];
    try{
     console.log("Getting channel views. ");
      let currentViews = await fabric.getChannelViews({channelHash, offering, sid});
      console.log("views response: " + JQ(currentViews));
      if(!currentViews.errors){
        for(index in currentViews){
          let view = currentViews[index];
          console.log("Found view: " + JQ(view));
          if(!isEmpty(view.image_uri)){
            let uri = new URI(platform.getCurrentHost() + "" + view.image_uri);
            uri.addSearch("width",THUMBWIDTH);
            view.image = uri.toString();
          }
          view.title = view.view_display_label;
          view.isAvailable = true;
          console.log("Created image uri with width: " + view.image_uri);
          if(view.currently_selected){
            currentViewIndex = index;
          }
          views.push(view);
        }
      }
      isShowingControls = true;
      this.setState({currentViewIndex,views,isShowingControls});
    }catch(error){
      console.log("error: " + JQ(error));
    }
    
    /*
    this.controlsTimer = Timer(() => {
      console.log("player controls timeout!");
      this.setState({
        isShowingControls: false,
        currentViewIndex: 0
      });
    }, 2000);

    this.controlsTimer.start();
    */

  }

  hideControls=()=>{
    console.log("playerpage hide controls");
    this.setState({isShowingControls:false});
  }

  next(){
    const {isActive} = this.props;
    console.log("next()");
    if(!isActive){
      return;
    }

    let {currentViewIndex,views,isShowingControls} = this.state;
    console.log("Views: " + views.length);

    if(!isShowingControls){
      console.log("Not showing controls");
      return;
    }
    
    if(!views || views.length == 0){
      console.log("No views for next()");
      return;
    }

    if(currentViewIndex >= views.length - 1){
      console.log("Not showing controls");
      return;
    }
    
    currentViewIndex++;
    console.log("next " + currentViewIndex + " views: " + views.length);
    this.setState({currentViewIndex});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }
  }
  
  previous(){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }

    let {currentViewIndex,views,isShowingControls} = this.state;

    if(!isShowingControls){
      return;
    }

    
    if(!views || views.length == 0){
      console.log("No views for previous()");
      return;
    }

    if(this.controlsTimer){
      this.controlsTimer.start();
    }
  }

  async select({item,index}){
    const {isActive} = this.props;
    console.log("Player select " + index);
    if(!isActive){
      return;
    }

    const {fabric} = this.context;
    if(!fabric){
      return;
    }

    let {views, channelHash, offering, sid} = this.state;

    if(!views || views.length == 0){
      console.log("No views for select()");
      return;
    }

    console.log("player channel select " + index);
    try{
      await fabric.switchChannelView({channelHash, offering, sid, view:index});
    }catch(e){
      console.error(e);
    }
  }

  async reload(){
    const {appReload} = this.context;
    const {navigation} = this.props;
    try{
      this.setState(PlayerPage.defaultState);    
      this.disableTVEventHandler();
      await appReload();
      this.enableTVEventHandler();
      await this.init();
    }catch(e){
      console.log("Player Error reloading: "+JQ(e));
      //this.setState({error:"Error reloading content."});
      navigation.goBack(true);
    }
  }

  async componentDidMount() {
    await this.init();
    this.enableTVEventHandler();
  }
  componentWillUnmount() {
    this.disableTVEventHandler();
  }

 async init() {
    const {site,fabric,getQueryParams,appReload,setState} = this.context;
    console.log("SitePage init()");
    try{
      let channels = await site.getLatestChannels();

      //let channel = site["channels"]["default"];
      let channel = channels["default"];
      console.log("Channel: ", JQ(channel));

      let channelHash = channel["."]["source"];
      console.log("Channel hash:", channelHash);

      let info = await fabric.getPlayoutInfo({channelHash});
      console.log("PlayerPage getPlayoutInfo response: " + JQ(info));
      let sid = info.sessionId;
      let offering = info.offering;
      let videoUrl = info.playlistUrl + getQueryParams();

      if(!videoUrl){
        this.setState({error:"Error occured."});
        return;
      }
      console.log(`player: channelHash ${channelHash}  videoUrl ${videoUrl} offering ${offering} sid ${sid} `);
      this.setState({channelHash,offering,videoUrl,sid});
    }catch(e){
      this.setState({error:"Could not get video uri. " + e});
    }
  }

  videoError = (error) => {
    console.log("VideoError: " + JQ(error));
    this.setState({error});
  }

  onBuffer = (buffer) => {
    console.log("Playerpage onBuffer " + JQ(buffer));
  }

  onProgress = (progress) =>{
    console.log("Playerpage onProgress " + JQ(progress))
    this.setState({progress});
  }

  render() {
    let {videoUrl, views, error, isShowingControls,volume,playPause} = this.state;
    const {isActive,navigation} = this.props;
    //console.log("PlayerPage: videoUrl " + videoUrl + " error: " +  JQ(error) + " isActive " + isActive + " isShowingControls: " + isShowingControls);

    //TESTING LIVE: 
    //error = null;
    //videoUrl = "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
    //VOD
    //videoUrl = "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8";
    //videoUrl = "https://storage.googleapis.com/gaetan/hls.js/master-fmp4-bug.m3u8";
    //videoUrl = "https://host-66-220-3-86.contentfabric.io/q/hq__KcdB8hztcqY5PNn9D978PyHR8AxyiHkeiKmLNxMof4b4skhy9NSaVJaQ8XWus6Dx19SWPGzCbn/rep/playout/default/hls-clear/playlist.m3u8?authorization=eyJ0b2siOiJhc2Nzal9hZ2UzMkFlMVJ6WXJEWnNOWDFaTUgxd2FnbUI2Z1Boc2hzdlM3Zkx0WG9rcnJ0WWNEVlY2d1hzN2dnTmlhemp1RFdBRVZRcER6VjEyVmlTeXN0VGZSSjJUcXFMNTd0eTl2dzFUREZwdXRRZm1kZVFqZ0gyNHdOazdLaWlWeXU0M0hnVm5kekNuM3c3UnZtbWVORmthREo5M0ZYZFJ0dlNnMkhOV21LVWUzRUE5VkZhZWlVaTJ3cllhbVB1RXZoWUdoM0x0Z0FqTUt4bXZ2cm5hYzRpR2piVWtDY1FQQkFuMkhuTXB2akF4eTJrRlJDdHlERlRhWVJjYW5mdU1BM1JwVm42aFFCaVlLZzlIdnRtcWZ4TjVFbWFrcHZQQUd3MjhxY1RGS0NXWEV0clFxR1VrYXlKRG5aYmtzUVpWQzNGQjUxdHhxd3ZOVTJFcEtlZHJLQ0NWd1lQRDdwb005enExZjkyelVpelp1VXBDemR0Q2U3YWdzUVNQNXBTVXk1SGZ6c2trN3ZpelV0Wkg1R1JwS0xvY0JWTFliRFBKdWh0YUN5TEROUWlNd0V3R3ZKNnFzUDFReUtWVURnMjNndU5iWUhvQWd5Qm5TcVNaYkVlVnNEVVcxOEJwV21GUnRjSHBDdEE0Ym16bm5zRm9jNjdGTUU0ZHlTWEtObm9ueEhicjRMUnlQcmgyRGsyOXh1aEd2NFRoRDZtOHVnV3V1eGhlNVZNWVQ5OGlISzgzeENyZEc4Z3QiLCJxaWQiOiJpcV9fMlVtbkN6bnZXZHJlRGtlVjEzYWlIWGlld2VKcSIsIm9pZCI6ImQ6UU9UUFgySlJhdTQyUWRVIn0%3D";
    //videoUrl = "https://host-38-102-0-227.contentfabric.io/qlibs/ilib4UgUTory7GwH1k1syc77Uxnq7bMq/q/hq__ALJ26skJzkNPwyTbV5dvi72UqRAvTmdxYUx3j5EfXtc4vH5cUdi1Kksh23uQAphLxSCsyHdL1W/rep/channel/ga/hls-clear/live.m3u8?sid=1102904DF5&authorization=eyJxc3BhY2VfaWQiOiJpc3BjM0FOb1ZTek5BM1A2dDdhYkxSNjlobzVZUFBaVSIsImFkZHIiOiIweGJhOGJmYTY2MTQ4OWUxNWFiZmE5NWYxMDcxODk0MjRlMDc1NjhkNGQiLCJ0eF9pZCI6IjB4YmQxOGFjNzE1NzBiM2Q1YjVjMjAyOWE0NDFkYzVhODNkOGViNjBiNjA1ODBkODFmNGZjYjY4M2ViMzhhMzBiYSIsInFsaWJfaWQiOiJpbGliNFVnVVRvcnk3R3dIMWsxc3ljNzdVeG5xN2JNcSJ9.RVMyNTZLXzVSaW5VOXRBcnV0QlE5SkFoMlp2NWExeTU5Tlh6djJRaTFqakxxMnNNRmN1VEdwRmFodUhWa2FSb1R3M0pid1ZIZDZ6dGpIMldrYWpmaXEyRFJpRW5RSjla";

    if(error != null){
      console.log("Error loading video: " + JQ(error));
      return (
      <View style={styles.container}>
        <Image source={EluvioLiveLogo}
          style={
          {
            width:"100%",
            height:300,
            marginTop:-50,
            marginBottom:50,
          }
          }
        />
        <TouchableOpacity
          style={styles.retryButton} 
          activeOpacity ={1.0}
          hasTVPreferredFocus={true}
          onPress = {()=>{
            this.reload();
          }}
        >
          <Text style={styles.buttonText}>Reload</Text>
      </TouchableOpacity>
      </View>
      );
    }
    
    if(!videoUrl){
      return null;
    }

    try{
      videoUrl = URI(videoUrl).toString();
      if(videoUrl){
        return (
        <View style={styles.container}>
            <Video source={{uri: videoUrl}}   // Can be a URL or a local file.
              ref={this.videoRef}                                    // Store reference
              onBuffer={this.onBuffer}                // Callback when remote video is buffering
              onError={this.videoError}               // Callback when video cannot be loaded
              style={styles.video} 
              controls={true}
              //volume={volume}
              onEnd={()=>{navigation.goBack()}}
              onBandwidthUpdate={(bitrate)=>{console.log("Video onBandwidthUpdate: ", bitrate)}}
              onLoad = {(load)=>{console.log("Video onLoad: ", load)}}
              paused = {playPause}
              /*
              bufferConfig={{
                minBufferMs: 500,
                maxBufferMs: 1000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 1000
              }}*/
              minLoadRetryCount={5} //default 3
              preferredForwardBufferDuration={0.5}
              onProgress={this.onProgress}
              />
              <ThumbGallery
                isActive = {isActive}
                data={views} 
                showBackground={false}
                select={this.select}
                onShowControls={this.showControls}
                showProgress={true}
              />
        </View>  
        );
      }
    }catch(e){
      console.error("Error rendering video: " +e);
      this.setState({error: "Error loading video."});
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    color: 'white',
    flexDirection: "column"
  },
  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
  paginationStyle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 200,
    flexDirection: 'row'
  },
  paginationImage: {
    marginRight:5,
    marginLeft:5,
    resizeMode: 'cover',
    width:THUMBWIDTH * .8,
    height:THUMBWIDTH * 9/16 * .8
  },
  paginationImageActive: {
    marginRight:1,
    marginLeft:1,
    resizeMode: 'cover',
    width:THUMBWIDTH,
    height:THUMBWIDTH * 9/16
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',    
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "white",
  },
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
  text: {
    fontFamily: "Helvetica",
    textAlign: 'center',
    margin:60,
    color: '#fff',
    fontSize: 36,
    fontWeight: "500"
  },
});

export default PlayerPage;