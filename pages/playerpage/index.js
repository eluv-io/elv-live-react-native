import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TVEventHandler,
} from 'react-native';
import Video from 'react-native-video';
import {isEmpty, JQ} from '../../utils';
import Timer from '../../utils/timer';
import AppContext from '../../AppContext';
import ThumbGallery from '../../components/gallery/thumbgallery';
import FadeInView from '../../components/fadeinview';
import EluvioLiveLogo from '../../static/images/fulllogo.jpg';

var URI = require('urijs');

const THUMBWIDTH = 300;

class PlayerPage extends React.Component {
  //Class components must declare the context
  static contextType = AppContext;
  static defaultState = {
    videoUrl: null,
    error: null,
    isShowingControls: false,
    currentViewIndex: 0,
    views: [],
    //volume: .8,
    message: '',
    playPause: false,
    sid: null,
    title: '',
  };

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
      const {
        currentViewIndex,
        views,
        isShowingControls,
        playPause,
        progress,
      } = page.state;
      const {isActive} = page.props;

      if (!isActive || evt.eventType == 'blur' || evt.eventType == 'focus') {
        return;
      }

      if (isShowingControls) {
        return;
      }
      console.log('Player page : ' + page.state.title + ' ' + evt.eventType);

      try {
        if (evt && evt.eventType === 'right') {
        } else if (evt && evt.eventType === 'left') {
        } else if (evt && evt.eventType === 'swipeRight') {
          if (page.videoRef.current && progress) {
            let seekTime = progress.currentTime + 30;
            console.log('Seek forward ', seekTime);
            page.videoRef.current.seek(seekTime);
          }
        } else if (evt && evt.eventType === 'swipeLeft') {
          if (page.videoRef.current && progress) {
            let seekTime = progress.currentTime - 30;
            console.log('Seek back ', seekTime);
            page.videoRef.current.seek(seekTime);
          }
        } else if (evt && evt.eventType === 'up') {
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
        } else if (evt && evt.eventType === 'playPause') {
        } else if (evt && evt.eventType === 'select') {
          let newPlaypause = !playPause;
          console.log('playPause ' + newPlaypause);
          page.setState({playPause: newPlaypause});
        }
      } catch (e) {
        console.error('PlayerPage remoteEvent: ' + e);
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  showControls = async () => {
    const {platform, site, fabric, setState} = this.context;
    let {
      channelHash,
      offering,
      isShowingControls,
      sid,
      currentViewIndex,
    } = this.state;
    console.log('Player page Show controls ', sid, offering, isShowingControls);

    if (isShowingControls || !sid) {
      return;
    }
    let views = [];
    try {
      console.log('Getting channel views. ');
      let currentViews = await fabric.getChannelViews({
        channelHash,
        offering,
        sid,
      });
      console.log('views response: ' + JQ(currentViews));
      if (!currentViews.errors) {
        for (index in currentViews) {
          let view = currentViews[index];
          console.log('Found view: ' + JQ(view));
          if (!isEmpty(view.image_uri)) {
            let uri = new URI(platform.getCurrentHost() + '' + view.image_uri);
            uri.addSearch('width', THUMBWIDTH);
            view.image = uri.toString();
          }
          view.title = view.view_display_label;
          view.isAvailable = true;
          console.log('Created image uri with width: ' + view.image_uri);
          if (view.currently_selected) {
            currentViewIndex = index;
          }
          views.push(view);
        }
      }
      isShowingControls = true;
      this.setState({currentViewIndex, views, isShowingControls});
    } catch (error) {
      console.log('error: ' + JQ(error));
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
  };

  hideControls = () => {
    //console.log("playerpage hide controls");
    this.setState({isShowingControls: false});
  };

  next() {
    const {isActive} = this.props;
    //console.log("next()");
    if (!isActive) {
      return;
    }

    let {currentViewIndex, views, isShowingControls} = this.state;
    //console.log("Views: " + views.length);

    if (!isShowingControls) {
      //console.log("Not showing controls");
      return;
    }

    if (!views || views.length == 0) {
      //console.log("No views for next()");
      return;
    }

    if (currentViewIndex >= views.length - 1) {
      //console.log("Not showing controls");
      return;
    }

    currentViewIndex++;
    //console.log("next " + currentViewIndex + " views: " + views.length);
    this.setState({currentViewIndex});
    if (this.controlsTimer) {
      this.controlsTimer.start();
    }
  }

  previous() {
    const {isActive} = this.props;
    if (!isActive) {
      return;
    }

    let {currentViewIndex, views, isShowingControls} = this.state;

    if (!isShowingControls) {
      return;
    }

    if (!views || views.length == 0) {
      //console.log("No views for previous()");
      return;
    }

    if (this.controlsTimer) {
      this.controlsTimer.start();
    }
  }

  async select({item, index}) {
    const {isActive} = this.props;
    //console.log("Player select " + index);
    if (!isActive) {
      return;
    }

    const {fabric} = this.context;
    if (!fabric) {
      return;
    }

    let {views, channelHash, offering, sid} = this.state;

    if (!views || views.length == 0) {
      //console.log("No views for select()");
      return;
    }

    //console.log("player channel select " + index);
    try {
      await fabric.switchChannelView({channelHash, offering, sid, view: index});
    } catch (e) {
      console.error(e);
    }
  }

  async reload() {
    const {appReload} = this.context;
    const {isActive} = this.props;
    if (!isActive) {
      return;
    }

    try {
      if (this.reloadTimer) {
        this.reloadTimer.stop();
        this.reloadTimer = null;
      }
      this.disableTVEventHandler();
      await appReload();
      await this.handleSetState(this.defaultState);
      this.enableTVEventHandler();
      await this.init();
      this.forceUpdate();
    } catch (e) {
      console.error('Player Error reloading: ' + JQ(e));
    }
  }

  async componentDidMount() {
    console.log('<<<<<<<<< Player componentDidMount');
    await this.init();
    this.enableTVEventHandler();
  }

  componentWillUnmount() {
    console.log('Player ' + this.state.title + ' componentWillUnmount');
    this.disableTVEventHandler();
    if (this.reloadTimer) {
      this.reloadTimer.stop();
      this.reloadTimer = null;
    }
  }

  async init() {
    const {site, fabric, getQueryParams} = this.context;
    if (!this.props.isActive) {
      return;
    }

    // console.log("Playerpage init()");
    try {
      console.log('Player site: ' + site.versionHash);
      let channels = await site.getLatestChannels();
      console.log('Channels response: ', JQ(channels));

      if (isEmpty(channels)) {
        console.warn(
          'Could not get latest channels, attempting existing one.',
          site.channels,
        );
        channels = site.channels;
      }

      let channel = channels.default;
      if (!channel) {
        channel = channels[Object.keys(channels)[0]];
      }

      console.log('Channel: ', JQ(channel));

      let channelHash = channel['.'].source;
      console.log('Channel hash:', channelHash);

      let info = await fabric.getChannelPlayoutInfo({channelHash});
      console.log('PlayerPage getPlayoutInfo response: ' + JQ(info));
      let sid = null;
      try {
        sid = info.sessionId;
      } catch (e) {}

      let offering = 'default';
      try {
        if (info.offering) {
          offering = info.offering;
        }
      } catch (e) {}

      let videoUrl = null;
      if (info.playlistUrl) {
        videoUrl = info.playlistUrl + getQueryParams();
      }
      let multiview = null;
      if (info.multiview) {
        multiview = info.multiview;
      }

      let showMultiview = multiview != null && multiview != undefined;

      if (!videoUrl) {
        await this.handleSetState({error: 'Error occured.'});
        return;
      }
      //console.log(`player: channelHash ${channelHash}  videoUrl ${videoUrl} offering ${offering} sid ${sid} `);
      await this.handleSetState({
        title: site.title,
        channelHash,
        offering,
        videoUrl,
        sid,
        showMultiview,
        error: null,
      });
    } catch (e) {
      await this.handleSetState({error: 'Could not get video uri. ' + e});
    }
  }

  handleSetState = (state) => {
    return new Promise((resolve) => {
      //console.log("handleSetState: " + JQ(state.showDebug));
      this.setState(state, resolve);
    });
  };

  videoError = (error) => {
    console.log('VideoError: ' + JQ(error));
    this.setState({error});
  };

  onBuffer = (buffer) => {
    console.log('Playerpage onBuffer ' + JQ(buffer));
  };

  onProgress = (progress) => {
    //console.log("Playerpage onProgress " + JQ(progress))
    this.setState({progress});
  };

  RenderHints = (props) => {
    let isVisible = props.visible;
    if (!isVisible) {
      return null;
    }

    return null; ///XXX: Not implemented yet until later release.
    /*
    return(
      <FadeInView style={styles.hints} fadeOut={true}>
        <Text style={styles.hintsText}>Swipe up for views</Text>
      </FadeInView>
    );
*/
  };

  render() {
    let {
      videoUrl,
      views,
      error,
      isShowingControls,
      showMultiview,
      playPause,
      message,
    } = this.state;
    const {isActive, navigation} = this.props;
    //console.log("PlayerPage render: videoUrl " + videoUrl + " error: " +  JQ(error) + " isActive " + isActive + " isShowingControls: " + isShowingControls);

    //TESTING LIVE:
    //error = "e";
    //videoUrl = "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
    //VOD
    //videoUrl = "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8";
    //videoUrl = "https://storage.googleapis.com/gaetan/hls.js/master-fmp4-bug.m3u8";

    if (error != null) {
      console.log('Error loading video: ' + JQ(error));

      if (!this.reloadTimer) {
        this.reloadTimer = Timer(async () => {
          await this.reload();
        }, 5000);
        this.reloadTimer.start();
      }
      return (
        <FadeInView style={styles.container}>
          <Image
            source={EluvioLiveLogo}
            style={{
              width: '100%',
              height: 300,
              marginTop: -50,
              marginBottom: 50,
            }}
          />
        </FadeInView>
      );
    }

    if (this.reloadTimer) {
      this.reloadTimer.stop();
      this.reloadTimer = null;
    }

    if (!videoUrl) {
      return <View style={styles.container} />;
    }

    try {
      videoUrl = URI(videoUrl).toString();
      if (videoUrl) {
        return (
          <View style={styles.container}>
            <Video
              source={{uri: videoUrl}} // Can be a URL or a local file.
              ref={this.videoRef} // Store reference
              onBuffer={this.onBuffer} // Callback when remote video is buffering
              onError={this.videoError} // Callback when video cannot be loaded
              style={styles.video}
              controls={true}
              //volume={volume}
              onEnd={() => {
                console.log('player onEnd received...exiting...');
                navigation.goBack();
              }}
              onBandwidthUpdate={(bitrate) => {
                console.log('Video onBandwidthUpdate: ', bitrate);
              }}
              onLoad={(load) => {
                console.log('Video onLoad: ', load);
              }}
              paused={playPause}
              /*
              bufferConfig={{
                minBufferMs: 500,
                maxBufferMs: 1000,
                bufferForPlaybackMs: 1000,
                bufferForPlaybackAfterRebufferMs: 1000
              }}*/
              minLoadRetryCount={5} //default 3
              onProgress={this.onProgress}
              progressUpdateInterval={1000}
            />
            <ThumbGallery
              isActive={isActive}
              data={views}
              showBackground={false}
              select={this.select}
              onShowControls={this.showControls}
              showProgress={true}
            />
            <this.RenderHints visible={showMultiview && !isShowingControls} />
          </View>
        );
      }
    } catch (e) {
      console.error('Error rendering video: ' + e);
      this.setState({error: 'Error loading video.'});
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    color: 'white',
    flexDirection: 'column',
  },
  video: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  hints: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 200,
    flexDirection: 'row',
  },
  hintsIcon: {
    marginRight: 5,
    marginLeft: 5,
    resizeMode: 'cover',
    width: THUMBWIDTH * 0.8,
    height: ((THUMBWIDTH * 9) / 16) * 0.8,
  },
  hintsText: {
    fontFamily: 'Helvetica',
    textAlign: 'center',
    margin: 60,
    color: '#fff',
    fontSize: 36,
    fontWeight: '500',
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'white',
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'normal',
    alignSelf: 'center',
    textShadowColor: 'gray',
    fontFamily: 'HelveticaNeue',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },
  text: {
    fontFamily: 'Helvetica',
    textAlign: 'center',
    margin: 60,
    color: '#fff',
    fontSize: 36,
    fontWeight: '500',
  },
});

export default PlayerPage;
