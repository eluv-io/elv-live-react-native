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
import AppContext from '../../AppContext'
import {Site} from '../../fabric/site'
import { JQ } from '../../utils';

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
  const {navigation} = props;
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const {fabric, setAppState} = React.useContext(AppContext);
  console.log("fabric: " + fabric);
  console.log("code: " + JQ(code));
  console.log("email: " + JQ(email));

  return (
    <View style={styles.container}>
      <Image
        source={require('../../static/images/Logo-Dark.png')}
        style={styles.image}
      />
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}> EMAIL </Text>
          <LoginInput 
            placeholder="ENTER YOUR EMAIL"
            value = {email}
            onChangeText = {text => setEmail(text)}
          />
          </View>
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}> TICKET CODE </Text>
          <LoginInput
            secureTextEntry={true}
            placeholder="REDEEM YOUR TICKET CODE"
            value = {code}
            onChangeText = {text => setCode(text)}
          />
        </View>
        <LoginButton
          title="Next"
          onPress={async () => { 
            console.log("Submit button")
            //TODO: Move onPress to App and pass in
            //try{
              let siteId = await fabric.redeemCode(email,code);
              if(siteId != false){
                console.log("Creating new Site");
                let site = new Site({fabric, siteId});
                console.log("loadSite");
                await site.loadSite();
                setAppState({site});
                navigation.navigate('site');
              }
            //}catch(e){
            //  console.error(JQ(e));
            //}
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
    maxHeight:'55%',
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
