import React from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TextInput, 
  Image,
  TouchableOpacity,
  Keyboard
} 
from 'react-native';
import AppContext from '../../AppContext'
import { isEmpty, JQ } from '../../utils';
import Timer from '../../utils/timer';
import AppButton from '../appbutton'


const BLUR_OPACITY = 0.5;

const LoginInput = (props) => {
    const {isActive, onFocus, isFocused,onKeyboardDidShow,onKeyboardDidHide} = props;
    const inputRef = React.useRef();
    
    const onPress = () => {
      if(!isActive) return;
      if (inputRef.current) {
        inputRef.current.focus();
        if(onKeyboardDidShow){
          onKeyboardDidShow();
        }
      }
    };

    return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1.0}
      onFocus={onFocus}
      hasTVPreferredFocus={isFocused}
    >
    <TextInput
      {...props}
      style={isFocused? styles.inputStyle : [styles.inputStyle, styles.unfocused]}
      clearTextOnFocus={true}
      //BUG: the placeholder color changes to black once you enter something: RN tvos 6.4
      placeholderTextColor = "white"
      ref = {inputRef}
      keyboardAppearance='dark'
      onSubmitEditing={()=>{
          if(onKeyboardDidHide){
            onKeyboardDidHide();
          }
        }
      }
      >
     </TextInput>
     </TouchableOpacity>
    );
};

const LoginButton = React.forwardRef(({ onPress, title,onFocus,isFocused,isSelected},ref) => {
  let buttonStyle = isFocused ? styles.submitButton : styles.submitButtonUnfocused;
  if(isSelected){
    buttonStyle = [styles.submitButtonUnfocused,styles.submitButtonSelected];
  }
  
  return (
    <AppButton
      ref={ref}
      style={buttonStyle}
      onPress={onPress}
      onFocus={onFocus}
      text={title}
      isFocused={isFocused}
      title="Redeem"
    />
  );
});

class Login extends React.Component {
  static contextType = AppContext
  constructor(props) {
    super(props);
    this.state = {
      focused : "code",
      code: ""
    }
    this.buttonRef = React.createRef();
  }

  async componentDidMount() {
    Keyboard.addListener("keyboardDidShow", this.onKeyboardDidShow);
    Keyboard.addListener("keyboardDidHide", this.onKeyboardDidHide);
  }

  componentWillUnmount=()=>{
    Keyboard.removeListener("keyboardDidShow", this.onKeyboardDidShow);
    Keyboard.removeListener("keyboardDidHide", this.onKeyboardDidHide);
  }

  onKeyboardDidShow = ()=>{
    console.log("KeyboardDidShow ");
    this.setState({showingKeyboard:true});
  }
  
  onKeyboardDidHide = ()=>{
    console.log("KeyboardDidHide");
    try{
      if(this.buttonRef.current){
        console.log("Switching focus:");
        this.buttonRef.current.focus();
        //this.setState({focused:"enter"});
      }
    }catch(e){console.error("Error switching focus to login button: "+e)}
    this.setState({showingKeyboard:false});
  }

  render() {
    const {navigation, isActive} = this.props;
    let {code, focused,showingKeyboard} = this.state;

    //XXX:
    //code = "RLnkQi9";

    const {fabric, platform, site, setAppState,appReload} = this.context;
    try{
    let tenantId = site.info.tenant_id;
    let siteId = site.objectId;
    //console.log("RedeemPage site display title: " + site.title);  
    //console.log("RedeemPage site Id: " + siteId);  
    //console.log("RedeemPage site tenant Id: " + tenantId);
    console.log("Login focused: " + focused);

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
                onKeyboardDidShow={this.onKeyboardDidShow}
                onKeyboardDidHide={this.onKeyboardDidHide}
              />
            </View>
            <LoginButton
              title="Enter Event"
              ref = {this.buttonRef}
              onPress={async()=>{
                console.log("Submit:  button onPress" + isActive);
                if(!isActive || isEmpty(code)) return;
                console.log("Submit: Pressing");

                this.setState({selected:"enter"});
                let that = this;
                this.pressedTimer = Timer(() => {
                  that.setState({
                    selected: null
                  });
                }, 300);
                this.pressedTimer.start();
                console.log("Submit: Setting app state: ");
                await setAppState({ticketCode:code});
                try{
                  console.log("Submit: setAppState finished");
                  navigation.navigate("progress");
                  console.log("Submit: reloadingApp");
                  await appReload();
                  if(!this.props.data){
                    //TODO: go directly to playerpage if site is available to play
                    console.log("Submit: navigation to site");
                    navigation.removeUnder();
                    navigation.replace("site");
                  }else{
                    console.log("Submit: navigation to site with data.");
                    navigation.removeUnder();
                    navigation.replace("site",{...this.props.data});
                  }
                }catch(e){
                  console.error("Error redeeming ticket: " + e);
                  navigation.replace("error", {text:"Could not redeem ticket."});
                }
              }}
              onFocus={()=>{this.setState({focused:"enter"})}}
              isFocused = {focused == "enter"}
              isSelected = {this.state.selected === "enter"}
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
    //backgroundColor: 'rgba(200,0,0,1)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width:'100%',
    maxHeight:'100%',
  },
  black:{
    backgroundColor: 'black',
  },
  noOpacity:{
    opacity:0
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
    //backgroundColor: 'rgba(0,0,0,1)',
    justifyContent: 'flex-start',
    marginTop: 330,
    width:'25%',
  },
  logo: {
    justifyContent: 'center',
    alignContent: 'center',
    marginBottom: 50,
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
    height:60,
    paddingLeft:30,
    paddingRight:30,
    paddingTop:20,
    paddingBottom:20,
    paddingHorizontal: 10,
    alignContent:"center",
    textAlign:"center",
    backgroundColor: 'rgba(255,255,255,.8)',
    fontSize: 18,
    fontWeight: "300",
    color: "black",
    //textShadowColor: 'gray',
    letterSpacing: 3,
    fontFamily: "Helvetica",
    fontSize: 24,
    borderRadius:10,
    //borderWidth: 1,
    //borderColor: "white",
    opacity:1,
    //borderWidth: 3,
    //borderColor: '#3E2E02'
  },
  inputText: {
    color:"black"
  },
  formText: {
    marginBottom: 50,
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
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: "white",
    opacity: BLUR_OPACITY,
  },
  submitButton: {
    marginTop: 20,
    elevation: 8,
    justifyContent: 'center',
    //backgroundColor:'rgba(255,255,255,.8)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: "white"
  },
  submitButtonSelected: {
    shadowOpacity: .5,
    shadowRadius: 2,
    shadowOffset:{width:4,height:4},
    opacity: 1,
    borderWidth: 0,
    elevation:0,
    backgroundColor: 'rgba(100,100,100,1.0)'
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
    opacity: BLUR_OPACITY,
    backgroundColor: 'rgba(200,200,200,.5)'
  }
});

export default Login;
