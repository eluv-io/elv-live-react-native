import { intervalToDuration,formatDuration, format, isAfter } from "date-fns";
var add = require('date-fns/add');
var getSeconds = require('date-fns/getSeconds')

export default function Timer(callback,defaultInterval,repeat=false){
   var interval = defaultInterval;
   var timer = null;
   var running = false;
   var endTime = null;
   var repeated = repeat;
   function run(){
     if(!running){
        if(!repeated){
            timer = setTimeout(function(){
               callback();
               running = false;
            }, interval);
        }else{
            timer = setInterval(function(){
               callback();
            }, interval);
        }
        running = true;
     }
   }

   return {
     setInterval: function(newInterval){
        interval = newInterval;
     },
     stop: function(){
        repeated? clearInterval(timer): clearTimeout(timer);
        running = false;
     },
     start: function(){
         if(running==false){
            let seconds = Math.trunc(interval/1000);
            endTime = add(new Date(),{seconds});
            run();
         }else{
            this.stop();
            this.start();
         }
     },
     add: function(milliToAdd){
          interval += milliToAdd*1;
     },
     timeLeft: function(){
      if(!running){return "";}

      try{
         //console.log("timeLeft called " + running);
         const start = Date.now();

         let duration = intervalToDuration({
            start: endTime,
            end: start
         });
         return formatDuration(duration);
      }catch(e){}
      return "";
     }

   }
}