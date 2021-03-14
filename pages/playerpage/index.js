import React from 'react';
import { StyleSheet, Text, View, Image,TouchableOpacity,TVEventHandler} from 'react-native';
import Video from 'react-native-video';
import { JQ } from '../../utils';
import Timer from '../../utils/timer';
import AppContext from '../../AppContext'
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
      sid: null
    }

  constructor(props) {
    super(props);
    this.state = SitePage.defaultState;

    this.tvEventHandler = null;
    this.showControls = this.showControls.bind(this);
    this.hideControls = this.hideControls.bind(this);
    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.select = this.select.bind(this);
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingControls} = page.state;
      console.log(evt.eventType);
      if(!isShowingControls){
        await page.showControls();
        return;
      }

      if (evt && evt.eventType === 'right') {
        page.next();
      } else if (evt && evt.eventType === 'up') {

      } else if (evt && evt.eventType === 'left') {
        page.previous();
      } else if (evt && evt.eventType === 'down') {

      } else if (evt && evt.eventType === 'playPause') {

      } else if (evt && evt.eventType === 'select') {
        page.select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  async showControls(){
    const {platform,site,fabric,setState} = this.context;
    let {channelHash, offering, isShowingControls, sid, currentViewIndex} = this.state;
    if(isShowingControls || !sid){
      return;
    }

    console.log("Show controls")
    let views = [];
    try{
      let currentViews = await fabric.getChannelViews({channelHash, offering, sid});
      console.log("views response: " + JQ(currentViews));
      if(!currentViews.errors){
        for(index in currentViews){
          let view = currentViews[index];
          console.log("Found view: " + JQ(view));
          let uri = new URI(platform.getCurrentHost() + "" + view.image_uri);
          uri.addSearch("width",THUMBWIDTH);
          view.image_uri = uri.toString();
          console.log("Created image uri with width: " + view.image_uri);
          if(view.currently_selected){
            currentViewIndex = index;
          }
          views.push(view);
        }
      }
    }catch(error){
      console.log("error: " + JQ(error));
    }
    isShowingControls = true;
    this.setState({currentViewIndex,views,isShowingControls});
    
    this.controlsTimer = Timer(() => {
      console.log("timeout!");
      this.setState({
        isShowingControls: false,
        currentViewIndex: 0
      });
    }, 2000);

    this.controlsTimer.start();

  }

  hideControls(){
    console.log("hide controls");
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

    if(currentViewIndex == 0){
      return;
    }

    currentViewIndex--;
    console.log("previous " + currentViewIndex);
    this.setState({currentViewIndex});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }
  }

  async select(){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }

    const {fabric} = this.context;
    if(!fabric){
      return;
    }

    let {currentViewIndex,views,isShowingControls,
        channelHash, offering, sid} = this.state;

    if(!isShowingControls){
      return;
    }
    
    if(!views || views.length == 0){
      console.log("No views for select()");
      return;
    }

    console.log("select " + currentViewIndex);
    try{
      await fabric.switchChannelView({channelHash, offering, sid, view:currentViewIndex});
    }catch(e){
      console.error(e);
    }
  }

  async reload(){
    console.log("player reload");
    this.setState(SitePage.defaultState);    
    this.disableTVEventHandler();
    const {appReload} = this.context;
    await appReload();
    this.enableTVEventHandler();
    await this.init();
  }

  async componentDidMount() {
    this.enableTVEventHandler();
    await this.init();
  }

  async init() {
    const {site,fabric,setState} = this.context;
    console.log("SitePage init()");
    //XXX: temporary to get views
    try{
      let channel = site["channels"]["default"];
      console.log("Channels: ", channel);

      let channelHash = channel["/"].split("/")[2];
      console.log("Channel hash:", channelHash);

      let offerings = await fabric.getOfferings(channelHash);
      let offering = Object.keys(offerings)[0];
      console.log("offering: " + JQ(offering));

      //videoUrl = "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8";
      let videoUrl = await fabric.getChannelVideoUrl({channelHash, offering});
      console.log("videoUrl: " + videoUrl);
      if(!videoUrl){
        //TODO: Proper error.
        this.setState({error:"Error occured."});
        return;
      }
      let sid = fabric.getSessionId({uri:videoUrl});
      console.log("sid: " + sid);
      this.setState({channelHash,offering,videoUrl,sid});
    }catch(e){
      this.setState({error:"Could not get video uri."});
    }

  }


  componentWillUnmount() {
    this.disableTVEventHandler();
  }

  videoError = (error) => {
    console.log("VideoError: " + JQ(error));
    this.setState({error});
  }

  onBuffer = () => {

  }

  RenderPagination = () => {
    let {videoUrl, currentViewIndex, views, isShowingControls} = this.state;
    if(!views || !isShowingControls) return null;

    const items = [];
    for (var i = 0; i < views.length; i++){
      console.log("paginate: " + i);
      let view = views[i];
      items.push(
        <Image
          key = {i}
          style={i == currentViewIndex ? styles.paginationImageActive: styles.paginationImage}
          source={{
            uri: view.image_uri ,
          }}
        />
      );
    }

    return (
      <View style={styles.paginationStyle}>
        {items}
      </View>
    )
  }

  render() {
    const {site,setState} = this.context;
    let {videoUrl, currentViewIndex, views, error} = this.state;
    console.log("SitePage: videoUrl " + videoUrl + " error: " +  JQ(error));

    if(error != null){
      console.log("Error loading video: " + JQ(error));
      return (
      <View style={styles.container}>
        <Text style={styles.text} >We're sorry. Content is not available right now.</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          activeOpacity ={0.6}
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
      return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
      );
    }

    console.log("No error");

   return (
    <View style={styles.container}>
        <Video source={{uri: videoUrl}}   // Can be a URL or a local file.
          ref={(ref) => {
            this.player = ref
          }}                                      // Store reference
          onBuffer={this.onBuffer}                // Callback when remote video is buffering
          onError={this.videoError}               // Callback when video cannot be loaded
          style={styles.video} 
          controls={false}
          />
          <this.RenderPagination index={currentViewIndex}/>
    </View>
  );
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
  text: {
    color: 'white',
    fontSize: 20,
    margin:30
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',    
    paddingVertical: 10,
    paddingHorizontal: 12,    
    width: 200,
    height: 60,
    borderWidth: 2,
    borderColor: "white",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
  },
});

export default PlayerPage;