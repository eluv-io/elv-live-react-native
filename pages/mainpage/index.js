import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  TVEventHandler,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import AppContext from '../../AppContext';
import Header from '../../components/header';
import Gallery from '../../components/gallery';
import ThumbSelector from '../../components/thumbselector';
import {isEmpty, JQ, endsWithList} from '../../utils';
import MenuDrawer from 'react-native-side-drawer';
import AppButton from '../../components/appbutton';
import restoreIcon from '../../static/icons/restore_purchase.png';

const BLUR_OPACITY = 0.3;

class MainPage extends React.Component {
  static contextType = AppContext;
  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex: 0,
      isShowingExtras: false,
      openDrawer: false,
    };
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.extrasRef = React.createRef();
    this.subscribed = false;

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.select = this.select.bind(this);
    this.onExtrasVisible = this.onExtrasVisible.bind(this);
    this.onSelectExtra = this.onSelectExtra.bind(this);
  }

  async componentDidMount() {
    console.log('MainPage componentDidMount');
    this.enableTVEventHandler();
  }

  loadSiteData = () => {
    console.log('MainPage loadSiteData');
    const {platform, redeemItems, isSitePending} = this.context;
    console.log('$$$$$$ REDEEMITEMS ', redeemItems);
    const {isActive} = this.props;
    if (!platform || !isActive) {
      console.log('exiting, not active.');
      return [];
    }

    let sites = platform.getSites();
    let siteData = [];

    for (const key in sites) {
      try {
        let site = sites[key];
        if (!site) {
          console.error('Mainpage, site is null');
          continue;
        }
        let eventTitle = null;
        try {
          eventTitle = site.info.event_info.event_title;
        } catch (e) {}

        let eventHeader = null;
        try {
          eventHeader = site.info.event_info.event_header;
        } catch (e) {}

        let eventSub = null;
        try {
          eventSub = site.info.event_info.event_subheader;
        } catch (e) {}

        console.log(
          'MainPage loadSiteData Site: ' +
            site.title +
            ' accessible ' +
            site.info.state,
        );
        let item = {};
        item.title = eventTitle;
        item.description = eventSub;
        item.image = site.tv_main_background;
        item.logo = site.tv_main_logo;
        item.release_date = site.info.event_info.date;
        item.ticket = site.currentTicket;
        item.isAvailable = true;
        item.isAccessible =
          (site.info.state && site.info.state !== 'Inaccessible') ||
          site.info.accessible;

        item.isPending = isSitePending(site);
        /*console.log(
          'MainPage loadSiteData Site: ' +
            site.title +
            ' isPending ' +
            item.isPending,
        );*/

        if (site.objectId && !isEmpty(redeemItems)) {
          item.isRedeemed = Object.keys(redeemItems).includes(site.objectId);
        } else {
          item.isRedeemed = false;
        }
        siteData.push(item);
      } catch (e) {
        console.error('Error parsing site info: ' + e);
      }
    }

    return siteData;
  };

  loadSiteExtras = (index) => {
    console.log('MainPage loadSiteExtras ' + index);
    let extras = [];
    try {
      const {platform} = this.context;
      const {isActive} = this.props;
      if (!platform || !isActive) {
        console.log('exiting, not active.');
        return [];
      }

      let sites = platform.getSites();
      if (index > sites.length - 1) {
        console.error('Mainpage loadSiteExtras - index out of range. ', index);
        return [];
      }

      let site = sites[index];
      console.log(
        'MainPage finding extras for site ' +
          site.title +
          ' extras length: ' +
          site.info.extras.length,
      );
      for (var i in site.info.extras) {
        let extra = site.info.extras[i];
        extra.index = i;
        extra.id = `${i}`;
        if (!extra.image) {
          continue;
        }
        try {
          if (extra.image.url) {
            extra.image = item.image.url;
          }
        } catch (e) {
          console.error('Error parsing extras for thumbselector: ' + e);
          continue;
        }
        console.log('Extra image ' + extra.image);
        extras.push(extra);
      }
    } catch (e) {
      console.error('MainPage loadSiteExtras: ' + e);
    }
    return extras;
  };

  async componentWillUnmount() {
    console.log('MainPage componentWillUnmount');
    this.disableTVEventHandler();
  }

  toggleOpenDrawer = () => {
    console.log('toggleOpenDrawer ', this.state.openDrawer);
    this.setState({openDrawer: !this.state.openDrawer});
  };

  enableTVEventHandler = () => {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views, isShowingExtras} = page.state;
      const {navigation} = page.props;
      const {site, appClearData, showDebug, setAppState} = page.context;

      const {isActive} = page.props;
      if (!isActive || isEmpty(evt)) {
        return;
      }

      if (evt.eventType === 'focus') {
        return;
      }

      if (evt.eventType === 'blur' || evt.eventType === 'focus') {
        return;
      }

      if (isShowingExtras) {
        return;
      }

      console.log('<<<<<<<< MainPage event received: ' + evt.eventType);

      if (evt.eventType === 'swipeRight' || evt.eventType === 'right') {
        console.log('close drawer');
        if (page.state.openDrawer) {
          page.toggleOpenDrawer();
        }
      }

      if (evt.eventType === 'swipeUp' || evt.eventType === 'up') {
        let siteData = page.loadSiteData();

        if (isEmpty(siteData)) {
          console.log('No siteData for up event.');
          return;
        }

        let extras = null;
        try {
          extras = page.loadSiteExtras(currentViewIndex);
          console.log(
            'Mainpage event handler current site extras: ' + site.extras.length,
          );
        } catch (e) {
          console.log("Couldn't get extras from site ", e);
        }

        if (!isEmpty(extras)) {
          page.setState({isShowingExtras: true});
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

  onExtrasVisible(visible) {
    console.log('Mainpage OnVisible ' + visible);
    this.setState({isShowingExtras: visible});
  }

  next = async (index) => {
    console.log('mainpage next()');
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if (!isActive || isShowingExtras) {
      return;
    }

    try {
      let sites = await this.getSites();

      if (!sites) {
        console.log('No sites for next()');
        return;
      }

      console.log('mainpage next ');

      this.setState({currentViewIndex: index});
    } catch (e) {
      console.error('mainpage next error: ' + e);
    }
  };

  previous = async (index) => {
    console.log('mainpage previous()');
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if (!isActive || isShowingExtras) {
      return;
    }

    try {
      let sites = await this.getSites();
      if (!sites) {
        console.log('No sites for previous');
        return;
      }

      console.log('mainpage previous ' + index);
      this.setState({currentViewIndex: index});
    } catch (e) {
      console.error('mainpage next error: ' + e);
    }
  };

  onLeft = () => {
    console.log('MainPage onLeft');
    this.toggleOpenDrawer();
  };

  getSites = async () => {
    const {platform} = this.context;

    let sites = [];
    try {
      sites = await platform.getSites();
    } catch (e) {
      console.error('Could not get sites for mainpage: ' + e);
    }
    return sites;
  };

  select = async ({index, item}) => {
    console.log('mainpage select() ' + index);
    const {isActive} = this.props;
    const {isShowingExtras} = this.state;
    if (!isActive || isShowingExtras) {
      return;
    }

    let sites = await this.getSites();
    if (!sites) {
      console.log('No sites for mainpage select()');
      return;
    }

    const {setAppState, redeemItems, appReload} = this.context;
    const {navigation} = this.props;
    const {currentViewIndex} = this.state;

    if (index !== currentViewIndex) {
      this.setState({currentViewIndex: index});
    }

    console.log('select site index ' + index);
    try {
      let site = sites[index];
      console.log('select site selected ' + JQ(site.title));
      console.log('select site is free? ' + JQ(site.info.free));
      console.log('select site tv_main_logo ' + JQ(site.tv_main_logo));

      if (site.info.free) {
        try {
          await setAppState({site, ticketCode: null});
          console.log('Site set');
          let logo = site.tv_main_logo;
          let title = site.title;
          console.log('Transitioning to site page.');
          navigation.transition('presents', 'site', {logo, title}, 11000);
        } catch (e) {
          console.error('Error site: ' + e);
          navigation.setNext('error', {text: 'Could not retrieve event info.'});
        }
        return;
      }

      let redeemInfo = redeemItems[site.objectId];
      let ticketCode = redeemInfo ? redeemInfo.ticketCode : site.currentTicket;
      console.log('TICKETCODE: ', ticketCode);

      if (site.info.free || !isEmpty(ticketCode)) {
        await setAppState({site, ticketCode: ticketCode});
        try {
          let {site} = this.context;
          let logo = site.tv_main_logo;
          let title = site.title;
          navigation.transition('presents', 'site', {logo, title}, 11000);
          await appReload();
        } catch (e) {
          console.error('Error loading site info: ' + e);
          navigation.setNext('error', {
            text: 'Could not retrieve event info. Please try again.',
            reload: true,
          });
        }
      } else {
        await setAppState({site});
        navigation.navigate('buy');
      }
    } catch (e) {
      console.error(e);
    }
  };

  //Callback for Thumbselector
  onSelectExtra = async ({item, index}) => {
    let extraIndex = index;
    console.log('\n MainPage onSelectExtra() ' + extraIndex);
    const {setAppState, redeemItems, appReload} = this.context;
    const {isActive, navigation} = this.props;
    const {currentViewIndex, isShowingExtras} = this.state;

    if (!isActive || !isShowingExtras) {
      return;
    }

    const getData = (item) => {
      let data = [];
      try {
        for (const i in item.package.info.gallery) {
          let galleryItem = {...item.package.info.gallery[i]};
          if (galleryItem.image.url != undefined) {
            galleryItem.image = galleryItem.image.url;
          }
          data.push(galleryItem);
        }
      } catch (e) {
        console.log('Could not get extras info: ' + e);
      }
      console.log(data);
      return data;
    };

    try {
      if (item.isAvailable) {
        let data = getData(item);
        navigation.navigate('gallery', data);
      } else {
        console.log('Package not available: ');
        const sites = await this.getSites();
        let site = sites[currentViewIndex];
        console.log('select site is free? ' + site.info.free);

        if (site.info.free) {
          try {
            await setAppState({site, ticketCode: null});
            let {site} = this.context;
            let extra = site.info.extras[extraIndex];
            let data = getData(extra);
            if (!isEmpty(data)) {
              navigation.replace('gallery', data);
            } else {
              navigation.re;
              place('error', {
                text: 'Could not retrieve event info.',
                next: ['redeem', {extra: index}],
              });
            }
          } catch (e) {
            console.error('Error loading extra info: ' + e);
            navigation.replace('error', {
              text: 'Could not retrieve event info.',
              next: ['redeem', {extra: index}],
            });
          }
          return;
        }

        let redeemInfo = redeemItems[site.objectId];
        if (!isEmpty(redeemInfo) && !isEmpty(redeemInfo.ticketCode)) {
          await setAppState({site, ticketCode: redeemInfo.ticketCode});
          try {
            console.log('App state set. selectedIndex ' + extraIndex);
            navigation.navigate('progress');
            await appReload();
            console.log('App reloaded. selectedIndex ' + extraIndex);
            let {site} = this.context;
            let extra = site.info.extras[extraIndex];
            let data = getData(extra);
            if (!isEmpty(data)) {
              navigation.replace('gallery', data);
            } else {
              navigation.replace('error', {
                text: 'Could not retrieve event info.',
                next: ['redeem', {extra: index}],
              });
            }
          } catch (e) {
            console.error('Error loading extra info: ' + e);
            navigation.replace('error', {
              text: 'Could not retrieve event info.',
              next: ['redeem', {extra: index}],
            });
          }
        } else {
          await setAppState({site});
          //Redeem and then go to package view
          navigation.navigate('redeem', {extra: index});
        }
      }
    } catch (e) {
      console.error(e);
      navigation.navigate('error', {text: 'Could not retrieve event info.'});
    }
  };
  /*
  drawerContent = () => {
    const {isActive} = this.props;
    const {restorePurchases} = this.context;
    const {openDrawer} = this.state;
    return (
      <View style={styles.animatedBox}>
        <AppButton
          hasTVPreferredFocus={true}
          onPress={async () => {
            console.log('Restore Purchases button pressed.');
            try {
              await restorePurchases();
              this.toggleOpenDrawer();
            } catch (e) {
              console.error('Restore Purchases: ', e);
            }
          }}
          isActive={isActive && openDrawer}
          isFocused={true}
          textOnly={true}
          fakeButton={true}
          text="Restore Purchases"
        />
      </View>
    );
  };
*/

  drawerContent = () => {
    const {isActive, navigation} = this.props;
    const {restorePurchases} = this.context;
    const {openDrawer} = this.state;
    console.log('drawerContent()');
    let items = [
      {
        text: 'Restore Purchases',
        onPress: async () => {
          console.log('Restore Purchases button pressed.');
          if (!isActive || !openDrawer) {
            return;
          }
          try {
            navigation.navigate('progress');
            await restorePurchases();
            this.toggleOpenDrawer();
            navigation.goBack();
          } catch (e) {
            console.error('Restore Purchases: ', e);
          }
        },
        hasFocus: true,
      },
    ];

    const renderItem = ({item, index, separator}) => {
      let itemStyle =
        index === this.state.menuSelectedIndex
          ? [styles.menuItem, styles.menuItemSelected]
          : styles.menuItem;

      return (
        <TouchableOpacity
          style={itemStyle}
          activeOpacity={1}
          hasTVPreferredFocus={item.hasFocus}
          onFocus={() => this.setState({menuSelectedIndex: index})}
          onPress={item.onPress}>
          <Image
            style={styles.menuItemImage}
            source={restoreIcon}
            resizeMode="cover"
          />
          <Text style={styles.menuText}>{item.text}</Text>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        contentContainerStyle={styles.menu}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.text}
      />
    );
  };

  render() {
    const {platform, network} = this.context;
    const {isActive} = this.props;
    const {currentViewIndex, isShowingExtras, openDrawer} = this.state;
    //console.log("Mainpage>>>render currentViewIndex " + currentViewIndex);
    if (!platform) {
      return <View style={styles.background} />;
    }

    let siteData = this.loadSiteData();
    if (isEmpty(siteData)) {
      //console.log("Mainpage>>>render no siteData ");
      return null;
    }

    if (currentViewIndex > siteData.length - 1) {
      this.setState({currentViewIndex: 0});
      return null;
    }

    let data = siteData;
    let extras = null;
    extras = this.loadSiteExtras(currentViewIndex);

    console.log('<<<<< MainPage render network ' + network);
    let eluvioLogo = platform.eluvioLogo || '';

    return (
      <View style={styles.container}>
        <MenuDrawer
          open={openDrawer}
          drawerContent={this.drawerContent()}
          drawerPercentage={20}
          animationTime={250}
          overlay={true}
          opacity={0.4}
          style={{width: '100%', padding: 0}}>
          <Gallery
            isActive={isActive && !isShowingExtras && !openDrawer}
            layout={1}
            data={data}
            next={this.next}
            previous={this.previous}
            select={this.select}
            onLeft={this.onLeft}
            onIndexChanged={(index) => {
              console.log('MainPage onIndexChanged: ' + index);
              this.setState({currentViewIndex: index});
            }}
            index={currentViewIndex}
          />
          {!isEmpty(extras) ? (
            <ThumbSelector
              isActive={isActive && isShowingExtras && !isEmpty(extras)}
              showBackground={false}
              showText={false}
              showImageLabels={true}
              data={extras}
              onHideControls={() => {
                this.onExtrasVisible(false);
              }}
              onShowControls={() => {
                this.onExtrasVisible(true);
              }}
              select={this.onSelectExtra}
              slide
              ref={this.extrasRef}
            />
          ) : null}
          <Header logo={eluvioLogo} network={network} />
        </MenuDrawer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topRow: {
    position: 'absolute',
    top: 0,
    left: 20,
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    margin: 20,
  },
  eluvioLogo: {
    padding: 10,
    width: 191,
    height: 40,
    resizeMode: 'contain',
  },
  background: {
    position: 'absolute',
    alignItems: 'center',
    left: '20%',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    width: '100%',
    height: '100%',
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
    height: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  formContainer: {
    position: 'absolute',
    left: 190,
    top: 175,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 615,
    height: 718,
  },
  noborder: {
    borderWidth: 0,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '40%',
    height: '60%',
    paddingBottom: 300,
    margin: 30,
  },
  controlsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  button: {
    marginTop: 66,
    marginBottom: 10,
    margin: 30,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
    height: 60,
    borderWidth: 2,
    borderColor: 'white',
    color: 'white',
    opacity: BLUR_OPACITY,
  },
  buttonText: {
    fontFamily: 'Helvetica',
    letterSpacing: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 50,
    marginTop: 66,
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  logo: {
    width: '100%',
    height: 225,
    resizeMode: 'contain',
    padding: 0,
  },
  nextContainer: {
    padding: 30,
    paddingBottom: 150,
    position: 'absolute',
    height: '100%',
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextButton: {
    opacity: BLUR_OPACITY,
  },
  buttonFocused: {
    shadowOpacity: 0.5,
    shadowRadius: 2,
    shadowOffset: {width: 4, height: 4},
    opacity: 1,
  },
  previousButton: {
    opacity: BLUR_OPACITY,
  },
  previousContainer: {
    padding: 30,
    paddingBottom: 150,
    position: 'absolute',
    height: '100%',
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  paginationStyle: {
    position: 'absolute',
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 78,
    width: '100%',
    flexDirection: 'row',
  },
  paginationItem: {
    marginRight: 5,
    marginLeft: 5,
    width: 159,
    height: 3,
    backgroundColor: 'white',
    opacity: BLUR_OPACITY,
  },
  paginationActive: {
    marginRight: 5,
    marginLeft: 5,
    width: 295,
    height: 3,
    backgroundColor: 'white',
  },
  noOpacity: {
    opacity: 0,
  },
  headerText: {
    color: '#fff',
    fontSize: 50,
  },
  subheaderText: {
    fontFamily: 'Helvetica',
    letterSpacing: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 50,
    marginTop: 66,
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  dateText: {
    fontFamily: 'Helvetica',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 60,
    color: '#fff',
    fontSize: 36,
    fontWeight: '300',
  },
  menuList: {
    backgroundColor: 'blue',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    flex: 1,
  },
  menu: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 0,
    flex: 1,
  },
  menuText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'normal',
    alignSelf: 'center',
    textShadowColor: 'gray',
    fontFamily: 'HelveticaNeue',
    marginHorizontal: 10,
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexDirection: 'row',
    width: '100%',
    height: 84,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  menuItemSelected: {
    backgroundColor: '#232323',
  },
  menuItemImage: {
    width: 36,
    height: 36,
    marginHorizontal: 10,
  },
});

export default MainPage;
