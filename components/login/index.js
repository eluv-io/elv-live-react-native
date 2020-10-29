import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TextInput, 
  Image,
  TouchableOpacity,
  Button
} 
from 'react-native';
import {theme, colorByComponent} from '../../AppTheme'

const LoginInput = (props) => {
    return (
    <TextInput
      {...props}
      style={styles.inputStyle}
      />
    );
};

const LoginButton = ({ onPress, title }) => (
  <TouchableOpacity onPress={onPress} style={styles.submitButton}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);


const Login = (props) => {
  const [value, setValue] = useState(0);
  const {navigation} = props;
  return (
    <View style={styles.container}>
      <Image
        source={require('../../static/images/Logo-Dark.png')}
        style={styles.image}
      />
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}> USERNAME </Text>
          <LoginInput 
            placeholder="ENTER YOUR CHAT NAME" 
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}> EMAIL </Text>
          <LoginInput 
            placeholder="ENTER YOUR EMAIL" 
          />
          </View>
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}> TICKET CODE </Text>
          <LoginInput
            secureTextEntry={true}
            placeholder="REDEEM YOUR TICKET CODE"
          />
        </View>
        <LoginButton
          title="Next"
          onPress={() => { 
            console.log("Submit button")
            navigation.navigate('site')
          }}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width:'40%',
    maxHeight:'70%',
    borderRadius:20
  },
  formLabel: {
    marginTop: 10,
    fontSize: 20,
    color: 'gray',
  },
  image: {
    resizeMode: "contain",
    margin:50,
    maxHeight:150,
    width:"90%"
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '80%',
    margin: 50
  },
  inputContainer: {
    justifyContent: 'center',
    marginTop: 30,
    width: '100%',
  },
  inputStyle: {
    marginTop: 5,
    width: '100%',
    height: 60,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#dddddd',
    fontSize: 20,
    textShadowColor: 'gray'
  },
  formText: {
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 50,
  },
  submitButton: {
    marginTop: 50,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor: colorByComponent("button","backgroundColor"),
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    height: 60,
  },
  buttonText: {
    fontSize: 18,
    color: colorByComponent("button","color"),
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase"
  }
});

export default Login;
