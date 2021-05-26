import {StyleSheet, View, Text, Image} from 'react-native';
import React from 'react';

const Header = (props) => {
  try {
    const {logo, network} = props;
    return (
      <View style={styles.topRow}>
        <Image
          style={styles.logo}
          source={{
            uri: logo,
          }}
          resizeMode="contain"
        />
        {network && network !== 'production' ? (
          <Text style={styles.networkText}>{network.toUpperCase()}</Text>
        ) : null}
      </View>
    );
  } catch (e) {
    console.error('Header error: ', e);
    return null;
  }
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
  },
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
  logo: {
    padding: 10,
    width: 191,
    height: 40,
    resizeMode: 'contain',
  },
});

export default Header;
