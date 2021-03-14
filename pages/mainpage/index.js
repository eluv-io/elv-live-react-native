import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler
} 
from 'react-native';
import Swiper from 'react-native-swiper'
import reactNativeTvosController from "react-native-tvos-controller"
import AppContext from '../../AppContext'
import Gallery from '../../components/gallery'

import { isEmpty, JQ, dateCountdown } from '../../utils';
import { Icon } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient';

//import { subscribeRemoteEvents, cancelRemoteSubscriptions } from '../../utils/tvos';

const BLUR_OPACITY = 0.3;

class MainPage extends React.Component {
  static contextType = AppContext
  constructor(props) {
    super(props);
    this.state = {
      currentViewIndex : 0
    }
    this.tvEventHandler = null;
    this.sites = [];
    this.swiperRef = React.createRef();
    this.subscribed = false;

    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
    this.select = this.select.bind(this);
    setInterval(()=>{if(this.props.isActive)this.forceUpdate()},60000);
  }

  async componentDidMount() {
    console.log("MainPage componentDidMount");
    console.log(" sites: "+ this.sites.length);
    this.enableTVEventHandler();
  }

  componentWillUnmount(){
    console.log("MainPage componentWillUnmount");
    this.disableTVEventHandler();
  }

  enableTVEventHandler() {
    this.tvEventHandler = new TVEventHandler();
    this.tvEventHandler.enable(this, async function (page, evt) {
      const {currentViewIndex, views} = page.state;
      console.log(evt.eventType);

      if (evt && evt.eventType === 'right') {
        page.next();
      } else if (evt && evt.eventType === 'up') {

      } else if (evt && evt.eventType === 'left') {
        page.previous();
      } else if (evt && evt.eventType === 'down') {

      } else if (evt && evt.eventType === 'playPause') {

      } else if (evt && evt.eventType === 'select') {
        page.select();
      }
    });
  }

  disableTVEventHandler() {
    if (this.tvEventHandler) {
      this.tvEventHandler.disable();
      delete this.tvEventHandler;
    }
  }

  next(){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }
    console.log("next() sites: " + this.sites);
    if(!this.sites){
      console.log("No sites for next()");
      return;
    }

    if(!this.swiperRef.current){
      console.log("No swiper ref.")
      return;
    }

    const {currentViewIndex} = this.state;
    if(currentViewIndex >= this.sites.length - 1){
      return;
    }
    
    console.log("next " + currentViewIndex + " sites: " + extras.length);
    currentViewIndex++;
    this.setState({currentViewIndex});

  }
  
  previous(){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }

    if(!this.sites){
      console.log("No sites for previous");
      return;
    }

    if(!this.swiperRef.current){
      console.log("No swiper ref.")
      return;
    }

    const {currentViewIndex} = this.state;
    
    if(currentViewIndex == 0){
      return;
    }
    console.log("previous " + currentViewIndex);
    currentViewIndex--;
    this.setState({currentViewIndex});
  }

  select(){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }

    if(!this.sites){
      console.log("No sites");
      return;
    }

    const {setAppState} = this.context;
    const {navigation} = this.props;
    const {currentViewIndex} = this.state;

    console.log("select " + currentViewIndex);
    try{
      let site = this.sites[currentViewIndex];
      setAppState({site});
      navigation.navigate('redeem')
    }catch(e){
      console.error(e);
    }
  }

  RedeemButton = ({title}) => (
      <View 
        style={[styles.button,styles.buttonFocused]}
        >
        <Text style={styles.buttonText}>{title}</Text>
      </View>
  );

  renderPagination = (index, total, context) => {

    const items = [];
    for (var i = 0; i < total; i++){
      items.push(
        <View key={i} style={i==index ? styles.paginationActive : styles.paginationItem} />
      );
    }

    return (
      <View style={styles.paginationStyle} >
        {items}
      </View>
    )
  }


  render() {
    const {platform,setAppState} = this.context;
    const {navigation, isActive} = this.props;
    const {currentViewIndex} = this.state;
    const sites = platform.getSites();
    if(isEmpty(sites)){
      console.log("no sites");
      return (
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      );
    }

    this.sites = [];

    let index = 0;
    const data = [];
    for (const key in sites){
      let site = sites[key];
      this.sites.push(site);

      let eventTitle = null;
      try{
        eventTitle = site.info.event_info.event_title;
      }catch(e){}

      let eventHeader = null;
      try{
        eventHeader = site.info.event_info.event_header;
      }catch(e){}

      console.log("event_header: " + site.info.event_info.event_header);

      let eventSub = null;
      try{
        eventSub = site.info.event_info.event_subheader;
      }catch(e){}
      console.log("event_subheader: " + site.info.event_info.event_subheader);

      let date = null;
      let countDown = null;
      try{
        date = site.info.event_info.date;
        countDown = dateCountdown(date);
      }catch(e){}

      let releaseDate = null;
      try{
        releaseDate = site.info.event_info.date;
      }catch(e){}

      let item = {};
      item.title = eventTitle;
      item.description = eventSub;
      item.image = site.tv_main_background;
      item.logo = site.tv_main_logo;
      item.release_date = countDown;
      data.push(item);

      index++;
    }

    return (
      <View style={styles.container}>
        <Gallery isActive={isActive} layout={1} data={data}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  background: {
    position: "absolute",
    alignItems: 'center',
    left:'20%',
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0)',
    width: "100%",
    height: "100%"
  },
  linearGradient: {
    position: "absolute",
    left:0,
    top:0,
    alignItems: 'center',
    justifyContent: "center",
    width: "70%",
    height: "100%"
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  formContainer: {
    position: "absolute",
    left:190,
    top:175,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 615,
    height: 718,
    //backgroundColor: "red",
  },
  noborder: {
    borderWidth: 0,
  },
  buttonContainer: {
    position: "absolute",
    left:0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: "40%",
    height: '60%',
    paddingBottom: 300,
    margin: 30,
  },
  controlsContainer: {
    position: "absolute",
    left:0,
    top: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: "100%",
    height: '100%',
  },
  button: {
    marginTop: 66,
    marginBottom: 10,
    margin: 30,
    elevation: 8,
    justifyContent: 'center',
    backgroundColor:'rgba(0,0,0,.8)',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
    height: 60,
    borderWidth: 2,
    borderColor: "white",
    color: "white",
    opacity:BLUR_OPACITY
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
    fontSize: 14,
    textShadowColor: 'gray',
    letterSpacing: 7,
    fontFamily: "HelveticaNeue",
  },
  logo: {
    width:"100%",
    height: 225,
    resizeMode: "contain",
    //backgroundColor: "blue",
    padding:0
  },
  nextContainer: {
    padding:30,
    paddingBottom:150,
    position: "absolute",
    height: "100%",
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nextButton: {
    opacity: BLUR_OPACITY
  },
  buttonFocused: {
    shadowOpacity: .5,
    shadowRadius: 2,
    shadowOffset:{width:4,height:4},
    opacity: 1
  },
  previousButton: {
    opacity: BLUR_OPACITY
  },
  previousContainer: {
    padding:30,
    paddingBottom:150,
    position: "absolute",
    height: "100%",
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
    width: "100%",
    flexDirection: 'row'
  },
  paginationItem: {
    marginRight:5,
    marginLeft:5,
    width:159,
    height: 3,
    backgroundColor: "white",
    opacity: BLUR_OPACITY
  },
  paginationActive: {
    marginRight:5,
    marginLeft:5,
    width:295,
    height: 3,
    backgroundColor: "white",
  },
  noOpacity: {
    opacity:0
  },
  headerText: {
    color: '#fff',
    fontSize: 50,
  },
  subheaderText: {
    fontFamily: "Helvetica",
    letterSpacing: 13,
    textAlign: 'center',
    textTransform: "uppercase",
    lineHeight: 50,
    marginTop:66,
    color: '#fff',
    fontSize: 32,
    fontWeight: "300"
  },
  dateText: {
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textAlign: 'center',
    marginTop:60,
    color: '#fff',
    fontSize: 36,
    fontWeight: "300"
  },
});

export default MainPage;