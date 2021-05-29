/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
// import 'react-native-gesture-handler';
import React, {useState, useContext} from 'react';

import ReactNative, {
  StyleSheet,
  View,
  Text,
  Image,
  AppState,
  TVEventHandler,
} from 'react-native';

import GalleryPage from './pages/gallerypage';
import Login from './components/login';
import AppButton from './components/appbutton';
import SitePage from './pages/sitepage';
import PlayerPage from './pages/playerpage';
import MainPage from './pages/mainpage';
import PresentsPage from './pages/presentspage';
import ConfigPage from './pages/configpage';
import TicketPage from './pages/buypage/ticketpage';
import BuyConfirm from './pages/buypage/buyconfirm';
import Fabric from './fabric';
import Config from './config.json';
import AppContext, {initialState} from './AppContext';
import {Navigation, Route} from './components/navigation';
import {JQ, isEmpty, endsWithList} from './utils';
import Timer from './utils/timer';
import Video from 'react-native-video';
import BackgroundVideo from './static/videos/EluvioLive.mp4';
import EluvioLiveLogo from './static/images/fulllogo.jpg';
import Spinner from 'react-native-loading-spinner-overlay';
import {LogBox} from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import {ElvPlatform} from './fabric/elvplatform';
import DeviceInfo from 'react-native-device-info';
import uuid from 'react-native-uuid';
import InApp from './providers/inapp';
import {areIntervalsOverlapping} from 'date-fns';

const APP_STORAGE_KEY = '@eluvio_live';
const APP_VERSION = '1.0.43';

const isHermes = () => !!global.HermesInternal;

function LoginPage(props) {
  return (
    <View style={styles.container}>
      <Video
        source={BackgroundVideo}
        style={styles.background}
        //muted = {true}
        resizeMode="cover"
        //repeat = {true}
      />
      <Login {...props} />
    </View>
  );
}

function ErrorPage(props) {
  const {appReload} = useContext(AppContext);

  let text = null;
  if (props.data && props.data.text) {
    text = props.data.text;
  }

  let buttonText = 'Continue';
  if (props.data && props.data.reload) {
    buttonText = 'Reload';
  }

  if (!props.isActive) {
    return null;
  }

  return (
    <View style={styles.background}>
      <Image
        source={EluvioLiveLogo}
        style={{
          width: '100%',
          height: 300,
          marginTop: -50,
          marginBottom: 20,
        }}
      />
      {text ? <Text style={styles.text}>{text}</Text> : null}
      <AppButton
        hasTVPreferredFocus={true}
        onPress={async () => {
          console.log('Errorpage button pressed.');
          try {
            if (props.data) {
              let data = props.data;

              if (data.reload) {
                await appReload();
              }

              if (props.data && props.data.next) {
                props.navigation.replace(
                  props.data.next[0],
                  props.data.next[1],
                );
                return;
              }
            }
            props.navigation.goBack();
          } catch (e) {
            console.error('Errorpage: ', e);
          }
        }}
        isFocused={true}
        isActive={true}
        text={buttonText}
      />
    </View>
  );
}

function ProgressPage(props) {
  return (
    <View style={styles.background}>
      <Spinner
        visible={props.isActive}
        textContent={'Loading...'}
        textStyle={styles.text}
      />
    </View>
  );
}

function initPlatform(network) {
  return new Promise(async (resolve, reject) => {
    console.time('****** App initplatform ******');
    try {
      var configUrl = Config.networks[network].configUrl;
      var libraryId = Config.networks[network].platform.libraryId;
      var siteId = Config.networks[network].platform.objectId;
      var fabric = new Fabric();
      console.log('Loading configUrl: ' + configUrl);
      await fabric.init({configUrl});
      var platform = new ElvPlatform({fabric, libraryId, siteId});
      resolve({fabric, platform});
    } catch (e) {
      reject(e);
    } finally {
      console.timeEnd('****** App initplatform ******');
    }
  });
}

let defaultState = {
  redeemItems: {},
  ticketCode: '',
  error: null,
  site: null,
  platform: null,
  fabric: null,
  reloadFinished: false,
  showDebug: false,
  network: 'production',
  availablePurchases: [],
};

export default class App extends React.Component {
  state = initialState;
  constructor(props) {
    super(props);
    this.state = defaultState;
    this.navigationRef = React.createRef();
    this.reload = this.reload.bind(this);
    LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
    LogBox.ignoreAllLogs();
    this.tvEventHandler = null;
    this.appState = null;
    this.sessionTag = uuid.v4();
    console.log('Using Hermes engine? ' + isHermes());
    if (__DEV__) {
      console.log('Running in Debug Mode.');
    } else {
      console.log('Running in Release Mode.');
    }
  }

  onPurchaseUpdated = (purchase) => {
    console.log('******** onPurchaseUpdated ', purchase);
  };

  onPurchaseError = (error) => {
    console.log('******** onPurchaseError ', error);
  };

  componentDidMount = async () => {
    await this.loadState();
    AppState.addEventListener('change', this._handleAppStateChange);
    await InApp.initConnection(this.onPurchaseUpdated, this.onPurchaseError);

    const timerFunc = async () => {
      try {
        if (!this.state.platform) {
          console.log('refresh');
          await this.reload();
        } else {
          let sites = this.state.platform.getSites();
          if (!sites || sites.length == 0) {
            console.log('refresh');
            await this.reload();
          }
        }
      } catch (e) {
        console.error('App refresh timer: ' + e);
        //await this.handleSetState({error:e});
        if (this.navigationRef.current) {
          console.error('App refresh timer showing error page: ');
          this.navigationRef.current.navigate('error', {reload: true});
        }
      }
    };

    const refreshTimer = Timer(timerFunc, 60000);
    refreshTimer.start();
    await timerFunc();
    this.enableTVEventHandler();
    console.log('Session params: ' + this.getQueryParams());
  };

  componentWillUnmount = async () => {
    AppState.removeEventListener('change');
    console.log('App will unmount.');
    this.disableTVEventHandler();
    await InApp.endConnection();
  };

  enableTVEventHandler = () => {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      if (isEmpty(evt)) {
        return;
      }

      if (evt.eventType == 'blur' || evt.eventType == 'focus') {
        return;
      }

      if (
        typeof evt.eventType === 'string' ||
        evt.eventType instanceof String
      ) {
        if (!page.remoteEvents) {
          page.remoteEvents = [];
        }
        page.remoteEvents.push(evt.eventType.toLowerCase());
        //console.log("Current events: " + JQ(this.remoteEvents));
        if (page.remoteEvents.length > 10) {
          page.remoteEvents.shift();
        }

        let cheatcodeClear = [
          'longSelect',
          'left',
          'right',
          'left',
          'right',
          'longSelect',
        ];
        if (endsWithList(page.remoteEvents, cheatcodeClear)) {
          console.log(
            '!!!!!! Cheatcode cleardata activated! ' + JQ(page.remoteEvents),
          );
          await page.clearData();
          page.forceUpdate();
          return;
        }

        let cheatcodeDebug = [
          'longSelect',
          'up',
          'up',
          'up',
          'up',
          'longSelect',
        ];
        if (endsWithList(page.remoteEvents, cheatcodeDebug)) {
          console.log(
            '!!!!!! Cheatcode debug activated! ' + JQ(page.remoteEvents),
          );
          let showDebug = page.state.showDebug;
          await page.handleSetState({showDebug: !showDebug});
          return;
        }

        let cheatcodeConfig = [
          'longSelect',
          'down',
          'down',
          'down',
          'down',
          'longSelect',
        ];
        if (endsWithList(page.remoteEvents, cheatcodeConfig)) {
          console.log(
            '!!!!!! Cheatcode config activated! ' + JQ(page.remoteEvents),
          );
          page.navigationRef.current.navigate('config');
          return;
        }
      }
    });
  };

  disableTVEventHandler = () => {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  };

  getQueryParams = () => {
    return `&session_id=${encodeURIComponent(
      this.sessionTag,
    )}&app_id=${encodeURIComponent(
      DeviceInfo.getBundleId(),
    )}&app_version=${encodeURIComponent(
      APP_VERSION,
    )}&system_version=${encodeURIComponent(DeviceInfo.getSystemVersion())}`;
  };

  _handleAppStateChange = async (nextAppState) => {
    try {
      console.log('App _handleAppStateChange ' + nextAppState);
      if (
        !this.appState ||
        (this.appState.match(/inactive|background/) &&
          nextAppState === 'active')
      ) {
        console.log('App has come to the foreground!');
        await this.reload();
      }

      this.appState = nextAppState;
      console.log('AppState', this.appState);
    } catch (e) {
      console.error('Error reloading on app open: ' + e);
      if (this.navigationRef.current) {
        this.navigationRef.current.navigate('error', {reload: true});
      }
    }
  };

  saveState = async () => {
    await this.storeData({redeemItems: this.state.redeemItems});
  };

  loadState = async () => {
    console.time('****** App loadState ******');
    let saved = await this.getData();
    console.log('loadState ', saved);
    if (saved != null && !isEmpty(saved.redeemItems != undefined)) {
      this.setState({redeemItems: saved.redeemItems});
    } else {
      console.log('no state found, setting default: ');
      this.setState(defaultState);
    }
    console.timeEnd('****** App loadState ******');
  };

  clearData = async () => {
    console.time('****** App clearData ******');
    try {
      //TODO: Confirmation dialog?
      await DefaultPreference.set(APP_STORAGE_KEY, '');
      await this.loadState();
      await this.switchNetwork();
    } catch (e) {
      console.error('Could not clear app data.' + e);
    } finally {
      console.timeEnd('****** App clearData ******');
    }
  };

  storeData = async (value) => {
    console.time('****** App storeData ******');
    try {
      const jsonValue = JSON.stringify(value);
      await DefaultPreference.set(APP_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Could not save app data.');
    } finally {
      console.timeEnd('****** App storeData ******');
    }
  };

  getData = async () => {
    console.time('****** App getData ******');
    try {
      const jsonValue = await DefaultPreference.get(APP_STORAGE_KEY);
      console.log('retrieved from prefs: ', jsonValue);
      let state = JSON.parse(jsonValue);
      return state;
    } catch (e) {
      console.error('Could not retrieve app data.');
      return null;
    } finally {
      console.timeEnd('****** App getData ******');
    }
  };

  reload = async () => {
    console.time('****** App reload ******');
    let newSite = null;
    let fabric = null;
    let platform = null;
    try {
      await this.handleSetState({error: null, reloadFinished: false});

      let {site, ticketCode, redeemItems, network} = this.state;
      newSite = site;

      console.log('Loading network: ', network);
      if (!network) {
        throw 'No network specified.';
      }
      let res = await initPlatform(network);
      fabric = res.fabric;
      platform = res.platform;
      if (site && platform && fabric && ticketCode) {
        let tenantId = site.info.tenant_id;
        let status = await this.redeemCode(
          fabric,
          site,
          redeemItems,
          tenantId,
          ticketCode,
        );
        if (!status) {
          console.error('Error redeeming site. Invalid code.');
          throw 'Error redeeming site';
        }

        platform.setFabric(fabric);
        await platform.load();

        let sites = platform.getSites();
        for (var index in sites) {
          let test = sites[index];
          if (test.objectId && test.objectId == site.objectId) {
            newSite = test;
            break;
          }
        }
      } else {
        platform.setFabric(fabric);
        await platform.load();
      }

      let purchases = await InApp.getAvailablePurchases();
      console.log('****************** Available Purchases: ', purchases);

      if (this.state.site) {
        console.log('Current Site: ' + this.state.site.title);
      }
      await this.handleSetState({fabric, platform, site: newSite});
    } catch (e) {
      console.error('Error in App reload: ', e);
      //this.handleSetState({error: e});
      throw e;
    } finally {
      console.log('Finished reload');
      await this.handleSetState({reloadFinished: true});
      console.timeEnd('****** App reload ******');
    }
  };

  //Use callback to execute after setState finishes.
  /*
  handleSetState  = (state,callback) => {
    this.setState(state,()=>{if(callback)callback(this.state)});
  }*/

  //You can use async/await now
  handleSetState = (state) => {
    return new Promise((resolve) => {
      if (state.site) {
        console.log('handleSetState: ' + JQ(state.site.versionHash));
      }
      this.setState(state, resolve);
    });
  };

  switchNetwork = async (network) => {
    if (!network) {
      network = 'production';
    }
    console.log('App switchNetwork: ' + network);
    try {
      await this.handleSetState(defaultState);
      if (Object.keys(Config.networks).includes(network)) {
        console.log('Network key is valid. Proceeding...');
        await this.handleSetState({network});
        await this.reload();
        this.navigationRef.current.loadDefault();
        return true;
      }
    } catch (e) {
      console.error('SwitchNetwork: ' + e);
      if (this.navigationRef.current) {
        //console.error("Navigating to error:");
        this.navigationRef.current.replace('error', {
          text:
            'Could not reach Eluvio Live. Check your connection and try again.',
          reload: true,
        });
        return false;
      }
    }
  };

  getRedeemedCodes = () => {
    return this.state.redeemItems;
  };

  //Internal
  redeemCode = async (fabric, site, redeemItems, tenantId, ticketCode) => {
    console.time('* App redeemCode *');
    console.log('RedeemCode ticketCode: ' + ticketCode);
    let otpId = await fabric.redeemCode(tenantId, ticketCode);
    console.log('App redeemCode response: ' + otpId);
    if (otpId != null) {
      let items = {...redeemItems};
      let objectId = site.objectId;
      items[objectId] = {ticketCode, tenantId, otpId};
      console.log('Redeem success. ');
      await this.handleSetState({redeemItems: items});
      await this.saveState();
      console.timeEnd('* App redeemCode *');
      return otpId;
    }
    console.timeEnd('* App redeemCode *');
    return null;
  };

  RenderDebug = () => {
    try {
      let {showDebug, fabric, network} = this.state;

      if (!showDebug) {
        return null;
      }

      let debugText = {
        textAlign: 'right',
        color: 'white',
        fontSize: 20,
      };

      return (
        <View
          style={{
            position: 'absolute',
            padding: 30,
            diplay: 'flex',
            right: 0,
            top: 0,
            color: 'white',
            fontSize: 20,
          }}>
          <Text style={debugText}>
            {'QueryParams: ' + this.getQueryParams()}
          </Text>
          <Text style={debugText}>{'QFab: ' + fabric.baseUrl({})}</Text>
          <Text style={debugText}>{'Network: ' + network}</Text>
        </View>
      );
    } catch (e) {
      console.error('renderDebug: ' + e);
    }
    return null;
  };

  render() {
    const {
      fabric,
      site,
      platform,
      redeemItems,
      showDebug,
      reloadFinished,
      network,
    } = this.state;

    return (
      <AppContext.Provider
        value={{
          fabric,
          site,
          platform,
          redeemItems,
          showDebug,
          network,
          getQueryParams: this.getQueryParams,
          setAppState: this.handleSetState,
          appReload: this.reload,
          appClearData: this.clearData,
          switchNetwork: this.switchNetwork,
          reloadFinished: reloadFinished,
        }}>
        <Navigation ref={this.navigationRef} default="main">
          <Route name="main" component={MainPage} />
          <Route name="buy" component={TicketPage} />
          <Route name="buyconfirm" component={BuyConfirm} />
          <Route name="site" component={SitePage} />
          <Route name="player" component={PlayerPage} />
          <Route name="gallery" component={GalleryPage} />
          <Route name="presents" component={PresentsPage} />
          <Route name="config" component={ConfigPage} />
          <Route name="progress" component={ProgressPage} />
          <Route name="error" component={ErrorPage} />
        </Navigation>
        <this.RenderDebug />
      </AppContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  background: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
  },
  spinnerTextStyle: {
    color: '#FFF',
  },
  errorMessage: {
    color: '#FFF',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    alignSelf: 'center',
    textTransform: 'uppercase',
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: 'HelveticaNeue',
  },
  text: {
    fontFamily: 'Helvetica',
    textAlign: 'center',
    margin: 60,
    color: '#fff',
    fontSize: 36,
    fontWeight: '500',
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
    height: 60,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: 'white',
  },
});
