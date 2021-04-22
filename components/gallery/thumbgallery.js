import React from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler,
  FlatList,
  SafeAreaView,
  ActivityIndicator
} 
from 'react-native';
import AppContext from '../../AppContext'
import { isEmpty, JQ, dateCountdown } from '../../utils';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'react-native-elements'
import FadeInView from '../../components/fadeinview'
import Timer from '../../utils/timer';
import extras from '../../testdata/extras';
import Video from 'react-native-video';
var URI = require("urijs");

const BLUR_OPACITY = 0.3;
const THUMBWIDTH = 300;
const FADE_MS = 5000;

//TODO: Fix Thumbselector for non sliding
class ThumbGallery extends React.Component {
  static contextType = AppContext

  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : 0,
      layout: props.layout || 0,
      isShowingControls: false,
      showBackground: props.showBackground === undefined? true : props.showBackground,
      showText: props.showText === undefined? true : props.showText,
      progress: false,
      videoUrl: null
    }
    this.tvEventHandler = null;
    this.flatlist = React.createRef();
    this.subscribed = false;

    this.showControls = this.showControls.bind(this);
    this._next = this._next.bind(this);
    this._previous = this._previous.bind(this);
    this._select = this._select.bind(this);
  }
  
  async componentDidMount() {
    await this.enableTVEventHandler();
    if(this.props.show){
      this.showControls();
    }

  }

  componentWillUnmount(){
    this.disableTVEventHandler();
  }

  async enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {isShowingControls, videoUrl} = page.state;
      const {isActive, showBackground} = page.props;
      if(!isActive){
        return;
      }

      //I don't really like this but this allows remote press for any key to activate thumbnails
      //only if the current selection is an image. Videos will only activate when pressing up.
      if(showBackground && videoUrl == null && !isShowingControls){
        await page.showControls();
        return;
      }

      console.log("Thumbgallery isShowingControls " + isShowingControls + " " + evt.eventType);
      if (evt && evt.eventType === 'right' || evt.eventType === 'swipeRight') {
        page._next();
      } else if (evt && evt.eventType === 'up' || evt.eventType === 'swipeUp') {
        if(!isShowingControls){
          await page.showControls();
        }
      } else if (evt && evt.eventType === 'left' || evt.eventType === 'swipeLeft') {
        page._previous();
      } else if (evt && evt.eventType === 'down' || evt.eventType === 'swipeDown') {
        page.hideControls();
      } else if (evt && evt.eventType === 'playPause') {

      } else if (evt && evt.eventType === 'select') {
        await page._select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
      this.tvEventHandler = null;
    }
  }

  async showControls(){
    const {platform,fabric} = this.context;
    let {isShowingControls, currentViewIndex} = this.state;
    let {onShowControls, isActive} = this.props;
    
    if(isShowingControls || !isActive){
        return;
    }

    if(onShowControls != undefined){
      await onShowControls();
    }
    
    let {data} = this.props;

    if(isEmpty(data)){
      return;
    }

    console.log("Thumbgallery Show controls");
    isShowingControls = true;
    this.setState({isShowingControls});
    if(this.controlsTimer){
      console.log("Thumbgallery controlsTimer start!");
      this.controlsTimer.start();
    }else{
      this.controlsTimer = Timer(() => {
        if(!isActive) return;
        console.log("Thumbgallery controlsTimer timeout!");
        this.setState({
          isShowingControls: false,
          progress: false
        });
      }, FADE_MS);
      this.controlsTimer.start();
    }
  }
  
  hideControls(){
    console.log("hide controls");
    this.setState({isShowingControls:false});
  }

  _next = async()=>{
    const {isActive, data,next} = this.props;
    const {progress} = this.state;
    if(!isActive || progress){
      return;
    }

    let {currentViewIndex,isShowingControls} = this.state;
    if(!isShowingControls){
      console.log("Not showing controls");
      return;
    }

    if(!data){
      console.log("No data for next()");
      return;
    }

    if(currentViewIndex >= data.length - 1){
      return;
    }
    
    console.log("next " + currentViewIndex + " sites: " + data.length);
    currentViewIndex++;
    this.setState({currentViewIndex,videoUrl:null});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }

    if(this.flatlist.current){
      this.flatlist.current.scrollToIndex({index:currentViewIndex});
    }

    if(next){
      next();
    }
    await this.getVideo();
  }
  
  _previous = async()=>{ 
    const {isActive, data, previous} = this.props;
    const {progress} = this.state;
    if(!isActive || progress){
      return;
    }

    let {currentViewIndex,isShowingControls} = this.state;

    if(!isShowingControls){
      return;
    }

    if(!data){
      console.log("No sites for previous");
      return;
    }

    if(currentViewIndex == 0){
      return;
    }

    console.log("previous " + currentViewIndex);
    currentViewIndex--;
    this.setState({currentViewIndex,videoUrl:null});
    if(this.controlsTimer){
      this.controlsTimer.start();
    }

    if(this.flatlist.current){
      this.flatlist.current.scrollToIndex({index:currentViewIndex});
    }

    if(previous){
      previous();
    }
    await this.getVideo();
  }

  _select = async () => {
    const {isActive,data,select,showProgress} = this.props;
    const {progress} = this.state;

    if(!isActive || !data || progress){
      return;
    }

    const {currentViewIndex,isShowingControls} = this.state;
    if(!isShowingControls){
      return;
    }
    try{
      let selected = data[currentViewIndex];
      console.log("Thumbgallery select " + currentViewIndex);
      if(select){
        select({item:selected,index:currentViewIndex, videoUrl:null});
      }

      await this.getVideo();
      if(showProgress){
        this.setState({progress:true});
      }
    }catch(e){
      console.error(e);
    }
  }

  getVideo = async () => {
    const {isActive,data,select} = this.props;
    if(!isActive || !data){
      return;
    }
    const {currentViewIndex,isShowingControls} = this.state;
    if(!isShowingControls){
      return;
    }
    try{
      const {getQueryParams} = this.context;

      let selected = data[currentViewIndex];
      console.log("Thumbgallery select " + currentViewIndex);

      let videoUrl = selected.videoUrl;
      if(isEmpty(videoUrl) && selected.createVideoUrl != undefined){
        videoUrl = await selected.createVideoUrl();
        if(!videoUrl){
          return;
        }
        console.log("videoUrl response: " + videoUrl);
        videoUrl += getQueryParams();
        selected.videoUrl = videoUrl;
        console.log("videoUrl: " + videoUrl);
      }

      if(videoUrl){
        this.setState({videoUrl});
      }
    }catch(e){
      console.error("Thumbgallery getVideo: " +e);
    }
  }

  videoError = (error) => {
    console.log("VideoError: " + JQ(error));
    this.setState({error});
  }

  onBuffer = (buffer) => {
    console.log("Thumbgallery onBuffer: " + JQ(buffer));
  }

  RenderItem = ({ item, index }) => {
    let {currentViewIndex,progress} = this.state;
    //console.log("Thumbgallery RenderItem "+ progress);
    let hasVideo = item.video != undefined && item.video.sources != undefined;
    let hasImage = !isEmpty(item.image);

    let element = null;
    let image = item.image;
    
    
    if(hasImage){
      image = URI(item.image).addQuery({width:THUMBWIDTH,height:Math.trunc(THUMBWIDTH * 9/16)}).toString();
      //console.log("thumb image: " + image);
    }
    

    if(!hasImage){
      element = (
        <Text 
            style=
            {{
              width:"100%",
              height:"100%",
              fontSize:36,
              textAlign:'center',
              borderWidth:1, 
              borderColor:"white",
              heigth: 100,
              color: "white"
            }}>
            {item.title}
        </Text>
      );
    }else{
      element = (<Image
        style={{width:"100%",height:"100%"}}
        source={{
          uri: image,
        }} />);
    }

/*
    if(!hasImage){
      return (
        <View key={`${index}`} style={index == currentViewIndex ? styles.paginationImageActive: styles.paginationImage}>
          <Text 
              style=
              {{
                width:"100%",
                height:"100%",
                fontSize:36,
                textAlign:'center',
                borderWidth:1, 
                borderColor:"white",
                heigth: 100,
                color: "white"
              }}>
            {item.title}
          </Text>
        {hasVideo ?
          <View style={styles.center} >
            <Icon
              name='play'
              color='#ffffff'
              type='font-awesome'
              size={32}
          />
          </View> : null }
        {currentViewIndex == index && progress?
        <View style={styles.center} >
          <ActivityIndicator
            size="small" color={"white"}
          /><Text style={styles.text}>Loading...</Text>
          </View> :null
        }
      </View>
      );
    }
    */

    return (
      <View key={`${index}`} style={index == currentViewIndex ? styles.paginationImageActive: styles.paginationImage}>
        {element}
        {hasVideo ?
          <View style={styles.center} >
            <Icon
              name='play'
              color='#ffffff'
              type='font-awesome'
              size={32}
          />
          </View> : null }
        {currentViewIndex == index && progress?
        <View style={styles.center} >
          <ActivityIndicator
            size="small" color={"white"}
          /><Text style={styles.text}>Loading...</Text>
          </View> :null
        }
      </View>
    );
  }

  RenderContent = ({title,description}) => {
    let {currentViewIndex, isShowingControls, showText} = this.state;
    let {data,showBackground} = this.props;
    if(!data) return null;

    const items = [];
    
    for (var i = 0; i < data.length; i++){
      let item = data[i];
      item.index = i;
      item.id = i;
      items.push(
        item
      );
    }

    return (
      <View style={styles.controlsContainer}>
        <FadeInView duration={isShowingControls? 500:1500} fadeOut={isShowingControls == false} style={styles.controlsContainer}>
          {showBackground && showText? <View style={styles.contentContainer}>
              {title ? <Text numberOfLines={1} style={styles.headerText}>{title}</Text> : null }
              {description? <Text numberOfLines={3} style={styles.subheaderText}>{description}</Text> : null }
          </View> : null }

          <View style={styles.paginationStyle}>
            <FlatList
              data={items}
              renderItem={({item,index,separator}) => {
                return this.RenderItem({item,index,separator});
              }}
              keyExtractor={item => `${item.id}`}
              horizontal={true}
              ref = {this.flatlist}
              contentContainerStyle={styles.flatListContainer}
              />
          </View>
        </FadeInView>
      </View>
    )
  }

  RenderBackground = (props)=>{
    const {item} = props;
    let {showBackground,videoUrl} = this.state;
    if(!showBackground){
      return null;
    }
    try{
      videoUrl = URI(videoUrl).toString();
      if(videoUrl){
        //console.log("Thumbgallery Render: " + videoUrl);
        return (
          <Video source={{uri: videoUrl}}   // Can be a URL or a local file.
            ref={(ref) => {
              this.player = ref
            }}                                      // Store reference
            onBuffer={this.onBuffer}                // Callback when remote video is buffering
            onError={this.videoError}               // Callback when video cannot be loaded
            style={styles.video} 
            controls={true}
            //volume={volume}
            repeat={true}
            onEnd={()=>{console.log("Extra video ended. ", item.title);}}
            />
        );
      }
    }catch(e){
      console.error("Error rendering video: " +e);
    }

    let imageUrl= null;
    try{
      imageUrl = item.image;
    }catch(e){
      return null;
    }

    return (
      <Image
        style={styles.mainImage}
        source={{
          uri: URI(imageUrl).toString()
        }}
      />
    );
    
  }

  render() {
    const {currentViewIndex,showBackground,isShowingControls} = this.state;
    const {data} = this.props;
    //console.log("Thumbselector render current index: " + JQ(data));
    const views = [];

    if(!data){
      return null;
    }

    let item = data[currentViewIndex];
    let title = null;
    try{
      title = item.title;
    }catch(e){}

    let description= null;
    try{
      description = item.description;
    }catch(e){}

    return (
        <View style={showBackground?[styles.container,styles.blackBackground]:styles.container}>
          <FadeInView key={currentViewIndex} duration={1500} start={.1} end={1} style={styles.container}>
          <this.RenderBackground item={item}/>
          </FadeInView>
          <FadeInView key={isShowingControls} duration={isShowingControls? 500:1500} fadeOut={isShowingControls == false} style={styles.controlsContainer}>
          <LinearGradient 
            start={{x: 0, y: 1}} end={{x: 0, y: 0}} 
            colors={['rgba(0,0,0,.9)', 'rgba(0,0,0,.5)', 'rgba(0,0,0,0)']} 
            style={styles.linearGradient} 
          />
          </FadeInView>
          <this.RenderContent index={currentViewIndex} title={title} description={description}/>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  fadeIn: {
    flex: 1,
    backgroundColor: "black"
  },
  fadeOut: {
    flex: 1,
    backgroundColor: "black"
  },
  container: {
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  center:{
    flex: 1,
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  blackBackground: {
    backgroundColor: "black",
  },
  background: {
    backgroundColor: "black",
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  noborder: {
    borderWidth: 0,
  },
  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
  controlsContainer: {
    position: "absolute",
    left:0,
    top: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: "100%",
    height: '100%',
  },
  button: {
    marginTop: 30,
    marginBottom: 10,
    margin: 30,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor:'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 250,
    height: 60,
    borderWidth: 2,
    borderColor: "white",
    color: "white",
    opacity:BLUR_OPACITY
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
  nextContainer: {
    padding:30,
    paddingBottom:100,
    position: "absolute",
    height: "100%",
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextButton: {
    opacity: BLUR_OPACITY
  },
  buttonFocused: {
    shadowOpacity: .5,
    shadowRadius: 2,
    shadowOffset:{width:4,height:4},
    opacity: 1
  },
  previousButton: {
    opacity: BLUR_OPACITY
  },
  previousContainer: {
    padding:30,
    paddingBottom:100,
    position: "absolute",
    height: "100%",
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  noOpacity: {
    opacity:0
  },
  flatListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  paginationStyle: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    bottom: 60,
    flexDirection: 'row',
    width: "100%",
    paddingLeft: 160,
    paddingRight: 160
  },
  paginationImage: {
    marginRight:5,
    marginLeft:5,
    alignItems: 'center',
    resizeMode: 'cover',
    width:THUMBWIDTH * .8,
    height:THUMBWIDTH * 9/16 * .8
  },
  paginationImageActive: {
    marginRight:1,
    marginLeft:1,
    alignItems: 'center',
    resizeMode: 'cover',
    width:THUMBWIDTH,
    height:THUMBWIDTH * 9/16
  },
  mainImage: {
    position: "absolute",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%"
  },
  linearGradient: {
    position: "absolute",
    left:0,
    bottom:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "50%"
  },
  contentContainer: {
    position: "absolute",
    display: "flex",
    left:0,
    bottom:0,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    width: "100%",
    height: "100%",
    padding: 160,
    paddingBottom: 260,
  },
  headerText: {
    fontFamily: "Helvetica",
    color: '#fff',
    fontSize: 48,
    fontWeight: "300"
  },
  subheaderText: {
    fontFamily: "Helvetica",
    lineHeight: 62,
    marginTop:20,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
  dateText: {
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textAlign: 'center',
    marginTop:60,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
  text: {
    fontFamily: "Helvetica",
    textAlign: 'center',
    margin:20,
    color: '#fff',
    fontSize: 20,
    fontWeight: "300"
  },
});

export default ThumbGallery;