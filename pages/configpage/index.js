import React from 'react';
import {StyleSheet, View, Text, FlatList, TouchableOpacity} from 'react-native';
//import RNPickerSelect from '@react-native-picker/picker';
import RNPickerSelect from 'react-native-picker-select';
import AppContext from '../../AppContext';
import ListPicker from 'react-native-list-picker';
import Config from '../../config.json';
import AppButton from '../../components/appbutton';
import {Navigation} from '../../components/navigation';

class ConfigPage extends React.Component {
  static contextType = AppContext;
  constructor(props) {
    super(props);

    Config.networks;
    let networks = Object.keys(Config.networks);
    let list = [];
    for (key in networks) {
      list.push({key: networks[key]});
    }

    this.state = {
      focused: '',
      list,
    };
  }

  handleOnChange = (value) => {
    this.setState({pickData: value});
  };

  renderItem2 = ({item}) => {
    return <Text style={styles.itemText}>{item.key}</Text>;
  };

  renderItem = (props) => {
    let {
      item,
      index,
      separator,
      onFocus,
      onPress,
      isFocused,
      network,
      otherProps,
    } = props;
    let buttonStyle = isFocused ? [styles.item, styles.itemFocus] : styles.item;
    console.log('Config render item: ' + item.key + ' network: ' + network);
    let isSelected = network == item.key;
    return (
      <TouchableOpacity
        style={buttonStyle}
        activeOpacity={1}
        onFocus={onFocus}
        onPress={onPress}
        {...otherProps}
        hasTVPreferredFocus={isSelected}>
        <Text
          style={
            isSelected ? [styles.itemText, styles.selected] : styles.itemText
          }>
          {item.key}
        </Text>
      </TouchableOpacity>
    );
  };

  render() {
    if (!this.props.isActive) {
      return null;
    }
    try {
      let {focused, list} = this.state;
      let {switchNetwork, network} = this.context;
      const {navigation} = this.props;

      console.log('SwitchConfiguration render');

      return (
        <View style={styles.container}>
          <Text style={styles.header}>{'Choose Network Configuration'}</Text>
          <FlatList
            data={list}
            renderItem={({item}) =>
              this.renderItem({
                item,
                network,
                isFocused: focused == item.key,
                onFocus: () => {
                  console.log('focused: ' + item.key);
                  this.setState({focused: item.key});
                },
                onPress: async () => {
                  console.log('pressed: ' + item.key);
                  try {
                    if (switchNetwork) {
                      navigation.goBack();
                      if (await switchNetwork(item.key)) {
                      }
                    }
                  } catch (e) {
                    console.error('ConfigPage: ' + e);
                    navigation.loadDefault();
                  }
                },
              })
            }
          />
          <AppButton
            style={styles.buttonStyle}
            onPress={() => {
              console.log('Cancel!');
              navigation.goBack();
            }}
            text={'Cancel'}
            title={'Cancel'}
            onFocus={() => {
              console.log('focused: cancel');
              this.setState({focused: 'cancel'});
            }}
            isFocused={focused == 'cancel'}
          />
        </View>
      );
    } catch (e) {
      console.error('ConfigPage render: ' + e);
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    flex: 1,
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
  },
  header: {
    padding: 10,
    marginTop: 50,
    color: 'white',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    fontSize: 50,
    fontWeight: '500',
    height: 200,
    width: 500,
  },
  itemText: {
    padding: 10,
    color: 'white',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    margin: 10,
    fontSize: 36,
    fontWeight: '300',
  },
  selected: {
    color: '#ca00a7',
    fontSize: 36,
    fontWeight: '500',
  },
  item: {
    padding: 10,
    margin: 10,
    opacity: 0.6,
    width: 500,
    height: 100,
    opacity: 0.6,
    borderRadius: 5,
  },
  itemFocus: {
    backgroundColor: 'rgba(100,100,100,.3)',
    opacity: 1.0,
  },
  buttonStyle: {
    marginTop: 20,
    marginBottom: 200,
    elevation: 8,
    justifyContent: 'center',
    //backgroundColor:'rgba(255,255,255,.8)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: 'white',
  },
});

export default ConfigPage;
