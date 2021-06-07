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
import {isEmpty, JQ} from '../../utils';
import Header from '../../components/header';
import InApp from '../../providers/inapp';
import AppButton from '../../components/appbutton';

var URI = require('urijs');

const Item = ({
  item,
  index,
  separator,
  isFocused,
  onFocus,
  onPress,
  isActive,
}) => {
  let imageUrl = null;
  try {
    imageUrl = URI(item.image).toString();
  } catch (e) {
    console.error('Ticket image error: ', e);
  }

  return (
    <View style={styles.item}>
      <View style={[styles.row, styles.itemRow]}>
        <Image
          style={styles.itemImage}
          source={{
            uri: imageUrl,
          }}
        />
        <View style={styles.itemTextColumn}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <View style={[styles.row]}>
          <Text style={styles.price}>${item.price}</Text>
          <AppButton
            hasTVPreferredFocus={isFocused}
            onPress={onPress}
            onFocus={onFocus}
            isFocused={isFocused}
            text="Buy"
            title="Tickets Buy Button"
            isActive={isActive}
          />
        </View>
      </View>
    </View>
  );
};

class TicketPage extends React.Component {
  static contextType = AppContext;
  constructor(props) {
    super(props);
    this.state = {
      currentIndex: 0,
    };
  }

  async componentDidMount() {
    const {site} = this.context;
    this.enableTVEventHandler();
    try {
      let products = await InApp.getAvailableTickets(site);
      //console.log('Ticket page: ', products);
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({products});
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
    const {platform, network} = this.context;
    const {isActive, navigation} = this.props;
    const {products, currentIndex} = this.state;

    const renderItem = ({item, index, separator}) => (
      <Item
        item={item}
        index={index}
        separator={separator}
        isFocused={currentIndex === index}
        onFocus={() => {
          this.setState({currentIndex: index});
        }}
        isActive={isActive}
        onPress={async () => {
          const {
            addPendingPurchase,
            pendingPurchases,
            restorePurchases,
            removePendingPurchase,
            setAppState,
          } = this.context;
          console.log('TicketPage buy pressed.');
          try {
            //This is needed because the OS screens will bring the app back
            // into the forground which triggers a reload. Any ticketCodes in the state will try to redeem
            await setAppState({ticketCode: null});
            if (pendingPurchases.includes(item.id)) {
              console.warn('Purchase already pending.');
              return;
            }

            navigation.navigate('progress');

            await InApp.requestPurchase(item.id);
            console.log('Confirm Buy Purchase succesful!');
            //TODO: set pending state for app
            if (addPendingPurchase) {
              console.log('Buy Confirm adding pending purchase.');
              await addPendingPurchase(item.id);
            }
          } catch (e) {
            console.error('TicketPage Purchase error ', e);
            //unknown error can be thrown if the product has already been purchased.
            this.removePendingPurchase(e.productId);
            navigation.replace('error', {
              text: 'Purchase failed.',
            });
            return;
            /*
            try {
              if (addPendingPurchase) {
                console.log('TicketPage adding pending purchase.');
                await addPendingPurchase(item.id);
              }
              await restorePurchases();
            } catch (err) {
              console.error('TicketPage error restoring purchases: ', err);
              await removePendingPurchase(item.id);
            }
            */
          }
          navigation.goBack(true);
        }}
      />
    );

    return (
      <View style={styles.container}>
        <Header logo={platform.eluvioLogo} network={network} />
        <FlatList
          style={styles.list}
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
    backgroundColor: 'transparent',
  },
  list: {
    margin: 80,
    marginTop: 150,
  },
  item: {
    padding: 30,
    paddingBottom: 0,
  },
  itemRow: {
    backgroundColor: '#232323',
    padding: 30,
    alignItems: 'flex-start',
  },
  itemTextColumn: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: 30,
    maxWidth: 1000,
  },
  itemBuy: {
    width: 230,
    marginLeft: 30,
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
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: 30,
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 32,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 54,
  },
  price: {
    fontFamily: 'Helvetica',
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 1.4,
    lineHeight: 27,
    marginHorizontal: 20,
  },
  description: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
    letterSpacing: 1.4,
    lineHeight: 20,
  },
  itemImage: {
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 300,
  },
});

export default TicketPage;
