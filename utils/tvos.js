import reactNativeTvosController from "react-native-tvos-controller"
import { JQ, isEmpty } from './index';
let swipeSubscription = null;
let tapSubscription = null;

//next, previous, select are function callbacks. 
//Remember to bind them to an object if they use 'this' inside of them.
export const subscribeRemoteEvents = (next,previous,select) =>{
  console.log("SubscribedRemote: " + tapSubscription);
  if(tapSubscription != null || swipeSubscription != null)
    return;

  reactNativeTvosController.connect();
  //reactNativeTvosController.enableRecognizeSimultaneously();

  console.log("Subscribed remote next: " + JQ(next));

  tapSubscription = reactNativeTvosController.subscribe('TAP',
    (e) => {
      console.log("mod tapped");
      console.log(JSON.stringify(e));
      /*
      e.type : "PlayPause" || "Menu" || "Select" || "UpArrow" || "DownArrow" || "LeftArrow" || "RightArrow"
      e.code : 0 || 1 || 2 || 3 || 4 || 5 || 6
      */
      if(e.type == "RightArrow"){
        next();
      }

      if(e.type == "LeftArrow"){
        previous();
      }

      if(e.type == "Select"){
        select();
      }
  });

  swipeSubscription = reactNativeTvosController.subscribe('SWIPE',
    (e) => {
      console.log("mod swiped");
      console.log(JSON.stringify(e));
      /*
      e.direction : "Right" || "Down" || "Left" || "Up"
      e.code : 0 || 1 || 2 || 3
      */

      if(e.direction == "Right"){
        next();
      }
      
      if(e.direction == "Left"){
        previous();
      }
  });
}

export const cancelRemoteSubscriptions = () => {
  reactNativeTvosController.disconnect();
  if(tapSubscription){
    console.log("Mod Cancelled tapSubscription subscription");
    tapSubscription();
    tabSubscription = null;
  }

  if(swipeSubscription){
    console.log("Mod Cancelled swipeSubscription subscription");
    swipeSubscription();
    tabSubscription = null;
  }

}