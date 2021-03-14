export default function Timer(callback,defaultInterval){
   var interval = defaultInterval;
   var timer = null;
   var running = false;
   function run(){
     if(!running){
        timer = setTimeout(function(){
          callback();
        }, interval);
        running = true;
     }
   }

   return {
     setInterval: function(newInterval){
        interval = newInterval;
     },
     stop: function(){
        clearTimeout(timer);
        running = false;
     },
     start: function(){
          if(running===false){
             run();
          }else{
            this.stop();
            this.start();
          }
     },
     add: function(milliToAdd){
          interval += milliToAdd*1;
     }

   }
}