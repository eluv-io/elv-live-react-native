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
        <View style={[styles.row, styles.itemBuy]}>
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
    const {platform, network} = this.context;
    const {isActive, navigation} = this.props;
    const {products, currentIndex} = this.state;

    const renderItem = ({item, index, separator}) => (
      <Item
        item={item}
        index={index}
        separator={separator}
        onPress={async () => {
          console.log('Ticket Button pressed: ' + JQ(item));
          try {
            navigation.navigate('buyconfirm', item);
          } catch (e) {
            console.error('Ticket button error: ', e);
          }
        }}
        onFocus={(focus) => {
          console.log('OnFocus ', focus);
          this.setState({currentIndex: index});
        }}
        isFocused={index === currentIndex}
        isActive={isActive}
      />
    );

    return (
      <View style={styles.container}>
        <Header logo={platform.eluvioLogo} network={platform.network} />
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
