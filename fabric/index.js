var URI = require("urijs")
import {JQ,isEmpty,normalizeUrl} from '../utils'
import base64 from 'react-native-base64'
var UrlJoin = require("url-join");

export default class Fabric {
  constructor(){
    //Standard url query params
    this.commonQuery = {
      link_depth:10,
      resolve_ignore_errors:true,
      resolve_include_source:true,
    }
  }

  // Initializes a new Fabric object using a static token for the given network url. 
  // This client can be used to access public objects and metadata
  async init({configUrl}) {
    try{
      console.time("Fabric Init");
      let response = await fetch(configUrl);
      let config = await response.json();

      this.qfabs = config.network.seed_nodes.fabric_api;
      this.qfabIndex = 0;
      console.log("Fabric API: ", this.qfabs[0]);

      this.asEndpoints = config.network.services.authority_service;
      this.asIndex = 0;

      console.log("AS API: ", this.asEndpoints[0]);

      let token = {"qspace_id":config.qspace.id};
      this.anonymousToken = base64.encode(JSON.stringify(token));
      console.log("Static Token: " + this.anonymousToken);
      this.configUrl = configUrl;
    }finally{
      console.timeEnd("Fabric Init");
    }
  }

  baseUrl = ({versionHash,libraryId, objectId})=>{
    //console.log("baseUrl " + versionHash + " libraryId " + libraryId + " objectId " + objectId);
    if(versionHash){
      return normalizeUrl(this.qfabs[this.qfabIndex] + `/q/${versionHash}`);
    }

    if(libraryId && objectId){
      return normalizeUrl(this.qfabs[this.qfabIndex] + `/qlibs/${libraryId}/q/${objectId}`);
    }

    return normalizeUrl(this.qfabs[this.qfabIndex]);
  }

  //get the current authority service endpoint
  asUrl = ()=>{
    return normalizeUrl(this.asEndpoints[this.asIndex]);
  }

  authToken =()=> {
    if(isEmpty(this.token)){
      return this.anonymousToken;
    }else {
      return this.token
    }
  }

  //returns query parameters in url format
  queryParams = (extra) =>{
    let authorization = {authorization:this.authToken()};
    let params = {...this.commonQuery,...authorization,...extra};
    return params;
  }

  redeemCode = async (tenantId, code) =>{
    console.time("Fabric redeemCode");
    try {
      let url = this.asUrl() + "/otp/ntp/" + tenantId;
      console.log("Redeem URL: ", url);

      let res = await fetch(normalizeUrl(url),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "_PASSWORD":code
        })
      });

      let token = await res.text();
      if(isEmpty(token)){
        return null;
      }

      console.log("Redeem response: " + JQ(token));

      let decoded = base64.decode(token);
      let json = JSON.parse(decoded);

      console.log("response decoded: " + json);

      let {oid} = json;

      if(isEmpty(oid)){
        return;
      }

      this.token = token;
      return oid;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error redeeming code:" + error);
      return null;
    } finally{
      console.timeEnd("Fabric redeemCode");
    }
  }

  getContent = async({versionHash,libraryId,objectId,path="/meta/public"}) =>{
    //console.log("Fabric getContent libraryId: " + libraryId + " objectId: " + objectId + " versionHash " + versionHash);
    try{
      let qfab = this.baseUrl({});

      let url = "";

      if(versionHash){
        url = URI(qfab).path(UrlJoin(`/q/${versionHash}`, path)).addQuery(this.queryParams()).toString();
      }else{
        url = URI(qfab).path(UrlJoin(`/qlibs/${libraryId}/q/${objectId}`, path)).addQuery(this.queryParams()).toString();
      }

      //console.log("getContent URL: ", url);
      res = await fetch(normalizeUrl(url));
      return await res.json();
    }catch(e){
      console.error("Fabric getContent error: " + e);
    }
  }

  createLink = (baseLink, path, query={}, onlyAuth=false)=>{
    //console.log("Fabric createLink: " + JQ(baseLink) + " path " + path + " query " + JQ(query));
    const basePath = URI(baseLink).path();
    if(path.startsWith("./")){
      path = path.substring(2);
    }

    if(onlyAuth){
      return URI(baseLink)
        .path(UrlJoin(basePath, path))
        .addQuery({authorization:this.authToken(),...query})
        .toString();
    }
    return URI(baseLink)
      .path(UrlJoin(basePath, path))
      .addQuery(this.queryParams(query))
      .toString();
  }

  //CHANNEL

  async getOfferings(channelHash){
    try {

      let offerings = await this.getContent({
        versionHash: channelHash,
        path: "meta/public/asset_metadata/offerings",
        queryParams:this.queryParams(),
      });
      
      console.log("Channel offerings: " + JQ(offerings));
      return offerings;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  getVideoPlayoutInfo = async({fabricLink}) => {
    console.log("Fabric getVideoPlayoutInfo: " + JQ(fabricLink));
    //Expecting:
    /*
        {
          ".": {
            "container": "hq__Da3H1wfH7bhGQCVz1x5qauviG8Dh4zr5nw4SunqfZQgzbRbLP8izbUuyjJitVmiYioEeyavzKZ"
          },
          "/": "./rep/playout/default/options.json"
        }
    */
    try{
      let versionHash= fabricLink["."].container;
      console.log("Fabric getVideoPlayoutInfo versionHash: " + versionHash);
      let linkUrl = this.createLink(this.baseUrl({versionHash}),fabricLink["/"],{},true);
      console.log("linkUrl: " + linkUrl);
      //BUG: it returns plain text.
      let res = await fetch(normalizeUrl(linkUrl),
        {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          "Content-Type": "text/plain;charset=UTF-8"
        }}
      );
      let playoutOptions = await res.json();
      console.log("linkReponse response: " + JQ(playoutOptions));

      let videoUrl = URI(UrlJoin(this.baseUrl({versionHash}),"/rep/playout/default/",playoutOptions["hls-clear"]["uri"])).toString();
      console.log("video url: " + JQ(videoUrl));

      return {playoutOptions,videoUrl};
    }catch(e){
      console.error("Fabric getVideoPlayoutInfo: " + e);
    }
    return null;
  }

  getPlayoutInfo = async({
      channelHash
    })=>{

    try{
      let endpoint = this.baseUrl({});
      let offerings = await this.getOfferings(channelHash);
      let offering = Object.keys(offerings)[0];
      console.log("Offering: ", offering);

      let multiview = offerings[offering]["properties"]["multiview"];
      console.log("Multiview: ", multiview);

      // Retrieve available formats
      let uri = offerings[offering]["uri"];

      let formatsUrl;
      if (uri[0] != '/') {
        // Expecting a full path
        console.warn("Bad URI: ", uri);
      }

      formatsUrl = UrlJoin(endpoint,uri);
      console.log(formatsUrl);

      res = await fetch(normalizeUrl(formatsUrl));
      let formats = await res.json();

      console.log("Formats: " + JQ(formats));

      // Pick HLS - prefer clear if multiple
      let format = "hls-clear";
      let sessionId = formats[format]["sid"];
      let baseUrl = formatsUrl.substring(0, formatsUrl.lastIndexOf("/"));
      let playlistUrl = baseUrl + "/" + formats[format].uri;

      console.log("Playlist URL: ", playlistUrl);

      let viewsUrl = null;
      if (multiview != null) {
        viewsUrl = baseUrl + "/views.json";
      }
      return {playlistUrl, offering, viewsUrl, baseUrl, sessionId};
    }catch(e){
      console.error("Fabric getPlayoutInfo error: "+e);
    }
    return null;
  }
/*
  async getChannelVideoUrl({channelHash, offerings,offering}) {
    console.log("getChannelVideoUrl");
    let endpoint = await this.baseUrl({versionHash:channelHash});
    console.log("endpoint: " + endpoint);

    let uri = offerings[offering]["uri"];
    let formatsUrl;
    if (uri[0] == '/') {
      // Absolute URL
      formatsUrl = endpoint + uri;
    } else {
      formatsUrl = endpoint + "/q/" + channelHash + "/rep/channel/" + uri;
    }
    console.log("formatsUrl: " + formatsUrl);
    let res = await fetch(formatsUrl);
    let formats = await res.json();
    console.log("formats response: " + JQ(formats));
    
    //TODO: DRM
    let format = "hls-clear";
    let baseUrl = formatsUrl.substring(0, formatsUrl.lastIndexOf("/"));
    let playlistUrl = baseUrl + "/" + formats[format].uri;
    return playlistUrl;
  }
*/
  getSessionId({uri}) {
    // ATTENTION: this session ID will be returned as an individual field in the playout options
    // So this code is temporary - I am just parsing it out of the playlist URL
    let q = require('url').parse(uri, {parseQueryString: true}).query;
    return q.sid
  }

  async getChannelViews({channelHash, offering, sid}){
    console.log(`getChannelViews: channelHash ${channelHash} offering ${offering} sid ${sid} `);
    if(!sid  || !offering || !channelHash){
      throw {error:"Invalid arguments to getChannelViews."};
    }

    console.log("creating link");
    let queryParams = {
      "sid": sid
    };

    let url = this.createLink(this.baseUrl({versionHash:channelHash}),
      `rep/channel/${offering}/views.json`,
      queryParams,
      true
    );

    console.log("Channel views URL: ", url);
    let response = await fetch(url);
    let jsonResponse = await response.json();

    return jsonResponse;
  }

  async switchChannelView({channelHash, offering, sid, view}){
    console.log("setChannelView: sid " + sid + " view: " + view);
    if(!sid  || !offering || !channelHash){
      throw {error:"Invalid arguments to getChannelViews."};
    }

    let queryParams = {
      "sid": sid
    };

    let url = this.createLink(this.baseUrl({versionHash:channelHash}),
      `rep/channel/${offering}/select_view`,
      queryParams,
      true
    );

    //console.log("Switch View: ", url);

    let response = await fetch(url,
      {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({view:view})
      }
    );

    console.log("Switch Response: " + JQ(response));
  }
}
