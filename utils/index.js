import { intervalToDuration,formatDuration, format, isAfter } from "date-fns";
var URI = require("urijs");
const bs58 = require('bs58')
var VarInt = require('varint')
var Buffer = require('buffer/').Buffer

export const JQ =  obj => JSON.stringify(obj, null, 2);

export const isEmpty = obj => {
  const result = obj === null || obj === undefined || obj === '' 
    || (Object.keys(obj).length === 0 && obj.constructor === Object) || (obj.length != undefined && obj.length == 0);
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

  try{
    let date = new Date(str);
    if(isAfter(new Date(),date)){
      return null;
    }
    let duration = intervalToDuration({
      start: new Date(),
      end: date
    });
    return formatDuration(duration,{format:["years","months","days","hours","minutes"]}).replace("minutes","minutes\n");
  }catch(e){
    console.log("dateCountdown: Could not convert date: " + str + " error:" + JQ(e));
  }
  return null;
}

export const dateStarted = (str) => {
  try{
    let date = new Date(str);
    if(isAfter(new Date(),date)){
      return true;
    }
  }catch(e){
    console.log("dateStarted: Could not convert date: " + str + " error:" + JQ(e));
  }
  return false;
}

export const endsWithList = (list1,list2) =>{
  var j= list2.length - 1;
  for (var i = list1.length-1; i >= 0;i--){
    console.log("j: " + j + " list2 " + list2[j] + " : i " + i +" :" + list1[i] + "?");
    if(list2[j].toLowerCase() !== list1[i].toLowerCase()){
      console.log("return false");
      return false;
    }
    j--;
    if(j<0){
      console.log("return true");
      return true;
    }
  }
  console.log("return false end.");
  return false;
}

export const normalizeUrl = (urlString) => {
  let normalized = URI(urlString).toString();
  return normalized;
}

export const B58 = arr => {
  return bs58.encode(Buffer.from(arr));
}

export const fromB58 = str => {
  return bs58.decode(str);
}

/**
  * Decode the specified version hash into its component parts
  *
  * @param versionHash
  *
  * @returns {Object} - Components of the version hash.
  */
export const decodeVersionHash = (versionHash) => {
  if(!(versionHash.startsWith("hq__") || versionHash.startsWith("tq__"))) {
    throw `DecodeVersionHash: Invalid version hash: "${versionHash}"`;
  }

  versionHash = versionHash.slice(4);

  // Decode base58 payload
  let bytes = fromB58(versionHash);

  // Remove 32 byte SHA256 digest
  const digestBytes = bytes.slice(0, 32);
  const digest = digestBytes.toString("hex");
  bytes = bytes.slice(32);

  // Determine size of varint content size
  let sizeLength = 0;
  while(bytes[sizeLength] >= 128) {
    sizeLength++;
  }
  sizeLength++;

  // Remove size
  const sizeBytes = bytes.slice(0, sizeLength);
  const size = VarInt.decode(sizeBytes);
  bytes = bytes.slice(sizeLength);

  // Remaining bytes is object ID
  const objectId = "iq__" + B58(bytes);

  // Part hash is B58 encoded version hash without the ID
  const partHash = "hqp_" + B58(Buffer.concat([digestBytes, sizeBytes]));

  return {
    digest,
    size,
    objectId,
    partHash
  };
}
