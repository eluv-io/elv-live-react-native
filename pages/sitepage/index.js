import React, {useState} from 'react';
import {
  Text, 
  StyleSheet, 
  View, 
  Image,
  TouchableOpacity,
  Button,
  TVFocusGuideView,
  TVEventHandler
} 
from 'react-native';
import AppContext from '../../AppContext'
import { isEmpty, JQ, dateCountdown, dateStarted} from '../../utils';
import Gallery from '../../components/gallery'

const BLUR_OPACITY = 0.3;

class SitePage extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    let currentViewIndex = 0;
    this.state = {
      currentViewIndex,
      extras: []
    }
    this.tvEventHandler = null;
    this.swiperRef = React.createRef();
    this.galleryRef = React.createRef();
    this.subscribed = false;

    this.select = this.select.bind(this);
    this.updateInterval = setInterval(this.onUpdate,
      1000);
  }

  onUpdate = async ()=>{
    //console.log("Sitepage timer.");
    if(this.props.isActive){
      //console.log("update!");
      let extras = await this.getExtras();
      this.setState({extras});
    }
  }

  async componentDidMount() {
    console.log("Sitepage componentDidMount");
    let extras = await this.getExtras();
    this.setState({extras});
  }

  getExtras = async () => {
    const {site} = this.context;
    const {data,navigation,isActive} = this.props;
    const {redeemItems} = this.context;
    if(!isActive){
      return[];
    }

    let siteIsRedeemed = site.objectId in redeemItems;
    //console.log("getExtras isRedeemed: " + siteIsRedeemed);
    let extras = [];

    try{
      //Push the main event site as the first extra
      let main = {};
      main.title = site.info.event_info.event_title;
      main.description = site.info.event_info.event_subheader;
      main.image = site.tv_main_background;
      main.logo = site.tv_main_logo;
      main.objectId = site.objectId;
      main.isAccessible = site.info.accessible;
      if(!site.promoVideoUrl){
        main.videoUrl = await site.createPromoUrl();
        site.promoVideoUrl = main.videoUrl;
      }else{
        main.videoUrl=site.promoVideoUrl;
      }

      //console.log("<<<<<<<<<<<<<<<<<<< SitePage loading site: " + JQ(main));
      
      let date = null;
      let dateString = null;
      let isAvailable = false;
      let hasEnded = false;

      try{
        const {redeemItems} = this.context;
        let {otpId} = redeemItems[site.objectId];
        let ticketInfo = site.getTicketInfo(otpId);

        //ticketInfo.start_time = "2021-04-21T02:20:00-04:00";
        //ticketInfo.end_time = "2021-04-20T02:30:00-04:00";
        //console.log("ticketInfo: " + JQ(ticketInfo));

        if(ticketInfo != null){
          if(!isEmpty(ticketInfo.start_time)){
            date = ticketInfo.start_time;
            //console.log("setting start date: " + date);

            //We are before the start date
            if(!dateStarted(date)){
              //console.log("Date has not started.");
              dateString = dateCountdown(date);
              if(isEmpty(dateString)){
                dateString = "Starting shortly...";
              }
              isAvailable = false;
            }else{
              //console.log("Date has started.");
              let endtime = ticketInfo.end_time;
              //console.log("Endtime: " + endtime);
              isAvailable = true;
              if(!dateStarted(endtime)){
                //console.log("Endtime has NOT passed");
                dateString = "Currently in progress";
                navigation.navigate("player");
                clearInterval(this.updateInterval);
              }else{
                //console.log("Endtime has passed.");
                hasEnded = true;
                let channels = site.channels;
                let channel = channels["default"];
                //console.log("SITE Channel: ", JQ(channel));

                isAvailable = !channel["."].resolution_error;
                if(isAvailable){
                }else{
                  dateString = "Event has ended";
                }
                //console.log("isAvailable: " + isAvailable);
              }
            }
          }
        }
      }catch(e){console.error(e);}

      if(isEmpty(dateString)){
        //console.log("Could not determine ticket date.");
        dateString = site.info.event_info.date;
        isAvailable = true;
      }

      //console.log("date string: " + dateString);

      main.release_date = dateString;
      main.channels = site.channels;
      //XXX: TODO - find a way to check if the channel is available to play
      main.isAvailable = isAvailable;
      main.isRedeemed = siteIsRedeemed;
      main.hasEnded = hasEnded;
      extras.push(main);
    }catch(e){
      console.log(e);
    }
    try{
      for(index in site.info.extras){
        let extra = site.info.extras[index];
        extras.push(extra);
      }

      if(data && this.galleryRef.current && !isNaN(data.extra)){
        //Add one to account for the main event inserted at the beginning.
        let currentViewIndex = parseInt(data.extra) + 1;
        console.log("SitePage select: " + currentViewIndex);
        this.galleryRef.current.setIndex(currentViewIndex);
      }
    }catch(e){
      console.log(e);
    }

    return extras;
  }

  componentWillUnmount(){
    clearInterval(this.updateInterval);
  }

  select(item){
    const {isActive} = this.props;
    if(!isActive){
      return;
    }


    const {setAppState} = this.context;
    const {navigation} = this.props;

    let {extras,currentViewIndex, isPackagesVisible} = this.state;
    try{
      if(item.channels != undefined){
        navigation.navigate('player');
      }
    }catch(e){
      console.error(e);
    }

    try{
      if(item.package != undefined){
        let data = [];
        for(const index in item.package.info.gallery){
          let galleryItem = {...item.package.info.gallery[index]};
          if(galleryItem.image.url != undefined){
            galleryItem.image = galleryItem.image.url;
          }
          data.push(galleryItem);
          console.log("push data: " + JQ(galleryItem));
        }
        navigation.navigate('gallery', data);
      }
    }catch(e){
      console.error(e);
    }
  }

  render() {
    const {platform,setAppState} = this.context;
    const {navigation, isActive} = this.props;
    const {currentViewIndex,extras} = this.state;

    const views = [];

    let data = extras;
    //console.log("SitePage render() ");
    return (
      <View style={styles.container}>
        <Gallery
          ref={this.galleryRef}
          isActive={isActive}
          layout={0} data={data}
          firstLayout={1}
          select={this.select}
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
    backgroundColor: 'black',
  },
  background: {
    position: "absolute",
    alignItems: 'center',
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

export default SitePage;