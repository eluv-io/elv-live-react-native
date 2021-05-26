import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Image,
  TVEventHandler,
  FlatList,
} from 'react-native';
import AppContext from '../../AppContext';
import {isEmpty, JQ, endsWithList} from '../../utils';
import Header from '../../components/header';
import InApp from '../../providers/inapp';
import AppButton from '../../components/appbutton';
import {format} from 'date-fns';

var URI = require('urijs');

class BuyConfirm extends React.Component {
  static contextType = AppContext;
  constructor(props) {
    super(props);
    this.state = {
      focused: 'buy',
    };
  }

  async componentDidMount() {
    const {site} = this.context;
    this.enableTVEventHandler();
    try {
    } catch (e) {
      console.error('Error getting products: ', e);
    }
  }

  componentWillUnmount() {
    this.disableTVEventHandler();
  }

  enableTVEventHandler = () => {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {navigation} = page.props;
      const {appClearData, showDebug, setAppState} = page.context;

      const {isActive} = page.props;
      if (!isActive || isEmpty(evt)) {
        return;
      }

      if (evt.eventType == 'focus') {
        return;
      }

      if (evt.eventType == 'blur' || evt.eventType == 'focus') {
        return;
      }

      console.log('<<<<<<<< Ticketpage event received: ' + evt.eventType);

      if (evt.eventType === 'swipeUp' || evt.eventType === 'up') {
      }
    });
  };

  disableTVEventHandler = () => {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  };

  render() {
    const {platform, site} = this.context;
    const {isActive, data} = this.props;
    const {focused} = this.state;

    let item = data;
    if (!item) {
      return (
        <View style={styles.container}>
          <Header logo={platform.eluvioLogo} network={platform.network} />
          <Text style={styles.title}>Something Went Wrong</Text>
        </View>
      );
    }

    //XXX:
    let dateString = '';
    let timeString = '';
    try {
      let date = new Date(item.start_time);
      timeString = format(date, 'h:mm aa');
      dateString = format(date, 'MMMM do');
    } catch (e) {
      console.error('Ticket time error: ', e);
    }

    let location = '';
    try {
      location = site.info.event_info.location;
    } catch (e) {
      console.error('Ticket location error: ', e);
    }

    let imageUrl = null;
    try {
      imageUrl = URI(item.image).toString();
    } catch (e) {
      console.error('Ticket image error: ', e);
    }

    let accountId = 'test@email.com';

    return (
      <View style={styles.container}>
        <Image
          style={styles.background}
          blurRadius={80}
          source={{
            uri: site.tv_main_background,
          }}
        />
        <Header logo={platform.eluvioLogo} network={platform.network} />

        <View style={styles.item}>
          <View style={styles.column}>
            <Image
              style={styles.itemImage}
              source={{
                uri: imageUrl,
              }}
            />
            <View style={styles.itemTextColumn}>
              <Text style={styles.message}>You Selected</Text>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.row}>
                <Text style={styles.title}>{timeString}</Text>
                <Text> ' '</Text>
                <Text style={styles.title}>{location}</Text>
              </View>
              <Text style={styles.title}>{dateString}</Text>
            </View>
            <View style={[styles.row]}>
              <AppButton
                style={styles.button}
                hasTVPreferredFocus={true}
                onPress={() => {
                  console.log('Confirm Buy pressed.');
                }}
                onFocus={() => {
                  this.setState({focused: 'buy'});
                }}
                isFocused={focused === 'buy'}
                text="Buy"
                title="Confirm Buy Button"
                isActive={isActive}
              />
              <AppButton
                style={styles.button}
                onPress={() => {
                  console.log('Confirm Cancel pressed.');
                }}
                onFocus={() => {
                  this.setState({focused: 'cancel'});
                }}
                isFocused={focused === 'cancel'}
                text="Cancel"
                title="Confirm Cancel Button"
                isActive={isActive}
              />
            </View>
            <View style={styles.itemTextColumn}>
              <Text style={styles.account}>Account</Text>
              <Text style={styles.account}>{accountId}</Text>
            </View>
          </View>
        </View>
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
  background: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    opacity: 0.7,
    width: '100%',
    height: '100%',
  },
  item: {
    padding: 30,
    paddingBottom: 0,
  },
  itemTextColumn: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 30,
  },
  itemBuy: {
    width: 350,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontFamily: 'Helvetica',
    fontSize: 32,
    color: 'white',
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 32,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 2,
  },
  price: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 1.4,
    lineHeight: 27,
  },
  date: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 2,
  },
  account: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: 'white',
    fontWeight: '400',
  },
  itemImage: {
    resizeMode: 'contain',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 500,
  },
  button: {width: 200, height: 65, margin: 10},
});

export default BuyConfirm;
