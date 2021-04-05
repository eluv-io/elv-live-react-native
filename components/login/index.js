import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TextInput, 
  Image,
  TouchableOpacity,
} 
from 'react-native';
import {theme, colorByComponent} from '../../AppTheme'
import AppContext from '../../AppContext'
import { JQ } from '../../utils';
import {ElvClient} from '../../ElvClient-min';
import { ReloadInstructions } from 'react-native/Libraries/NewAppScreen';

const BLUR_OPACITY = 0.5;

const LoginInput = (props) => {
    const {isActive, onFocus, isFocused} = props;
    const inputRef = React.useRef();
    const onPress = () => {
      if(!isActive) return;
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1.0}
      onFocus={onFocus}
      hasTVPreferredFocus={true}
    >
    <TextInput
      {...props}
      style={isFocused? styles.inputStyle : [styles.inputStyle, styles.unfocused]}
      clearTextOnFocus={true}
      ref = {inputRef}
      >
     </TextInput>
     </TouchableOpacity>
    );
};

const LoginButton = ({ onPress, title,onFocus,isFocused }) => {

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={isFocused ? styles.submitButton : styles.submitButtonUnfocused}
      activeOpacity={1.0}
      onFocus={onFocus}
      >
      <Text style={isFocused ? styles.buttonText : styles.buttonTextUnfocused}>{title}</Text>
    </TouchableOpacity>
  );
}

class Login extends React.Component {
  static contextType = AppContext
  constructor(props) {
    super(props);
    this.state = {
      focused : "",
      code: ""
    }
  }

 render() {
  const {navigation, isActive} = this.props;
  let {code, focused} = this.state;

  //XXX:
  //code = "RLnkQi9";

  const {fabric, platform, site, setAppState,appReload} = this.context;
  try{
  let tenantId = site.info.tenant_id;
  let siteId = site.objectId;
  console.log("RedeemPage site display title: " + site.title);  
  console.log("RedeemPage site Id: " + siteId);  
  console.log("RedeemPage site tenant Id: " + tenantId);
  console.log("focused: " + focused);

  return (
    <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.formText}>Presents</Text>
            <Image
              style={styles.logo}
              source = {{
                uri: site.tv_main_logo
              }}
            />
            <LoginInput
              secureTextEntry={true}
              placeholder="Ticket Code"
              placeholderTextColor="white"
              value = {code}
              isActive = {isActive}
              onChangeText = {text => {
                  if(!isActive) return;
                  this.setState({code:text});
                }
              }
              onFocus={()=>{this.setState({focused:"code"})}}
              isFocused = {focused == "code"}
            />
          </View>
          <LoginButton
            title="ENTER"
            onPress={async()=>{
              if(!isActive) return;
              console.log("New Submit button")
              setAppState({ticketCode:code});
              await appReload();
              navigation.replace('site',{...this.props.data});
            }}

            style={styles.submitButton}
            onFocus={()=>{this.setState({focused:"enter"})}}
            isFocused = {focused == "enter"}
          />
        </View>
      </View>
    );
  }catch(e){
    navigation.navigate("main");
    return(null);
  }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width:'25%',
    maxHeight:'50%',
    borderRadius:5,
  },
  formLabel: {
    marginTop: 10,
    fontSize: 20,
    color: 'gray',
  },
  background: {
    resizeMode: "contain",
    margin:50,
    maxHeight:150,
    width:"90%"
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  logo: {
    justifyContent: 'center',
    alignContent: 'center',
    marginBottom: 20,
    resizeMode: "contain",
    width: "100%",
    height: 225
  },
  inputContainer: {
    justifyContent: 'flex-start',
    width: '100%',
  },
  inputStyle: {
    marginBottom: 20,
    width: '100%',
    height: 50,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,.8)',
    fontSize: 18,
    textShadowColor: 'gray',
    letterSpacing: 3,
    fontFamily: "HelveticaNeue",
    borderRadius:10,
    borderWidth: 2,
    borderColor: "white",
    opacity:1
    //borderWidth: 3,
    //borderColor: '#3E2E02'
  },
  inputText: {
    color:"black"
  },
  formText: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    fontSize: 32,
    fontWeight: "200",
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
    color:"#F4E8D6"
  },
  submitButtonUnfocused: {
    marginTop: 20,
    elevation: 8,
    justifyContent: 'center',
    //backgroundColor: "#afa78e",
    backgroundColor:'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 195,
    height: 60,
    borderWidth: 2,
    borderColor: "white",
    opacity: BLUR_OPACITY,
  },
  submitButton: {
    marginTop: 20,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor:'rgba(255,255,255,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 195,
    height: 60,
    borderWidth: 2,
    borderColor: "white"
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
  },
  buttonTextUnfocused: {
    color: "white",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
  },
  linearGradient: {
    flex: 1,
    resizeMode: "cover",
    alignItems: 'center',
    justifyContent: "center",
    width: "100%",
    height: "100%",
    borderRadius:5
  },
  unfocused: {
    opacity: BLUR_OPACITY
  }
});

export default Login;
