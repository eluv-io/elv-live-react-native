import { intervalToDuration,formatDuration, format, isAfter } from "date-fns";

export const JQ =  obj => JSON.stringify(obj, null, 2);

export const isEmpty = obj => {
  const result = obj === null || obj === undefined || obj === '' 
    || (Object.keys(obj).length === 0 && obj.constructor === Object);
  return result;
};

export const CreateID = num => {
  var id = crypto.randomBytes(num / 2).toString('hex');
  return id;
};

export const RandomInt = (min,max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const dateCountdown = (str) =>{

  //try{
    let date = new Date(str);
    if(isAfter(new Date(),date)){
      return null;
    }

    console.log("Date: " + JQ(date));
    let duration = intervalToDuration({
      start: new Date(),
      end: date
    });
    return formatDuration(duration,{format:["years","months","days","hours","minutes"]}).replace("minutes","minutes\n");
  //}catch(e){
  //  console.log("Could not convert date: " + str + " error:" + JQ(e));
  //}
  return null;
}