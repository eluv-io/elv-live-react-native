if (!global.WebAssembly) {
  global.WebAssembly = require('webassemblyjs');
}
import 'react-native-get-random-values';
import '@expo/browser-polyfill';
import {ElvClient} from '../ElvClient-min';
var UrlJoin = require("url-join");
var URI = require("urijs")
import {JQ,isEmpty} from '../utils'
import base64 from 'react-native-base64'

const CreateStaticToken = async ({configUrl,libraryId}) => {
  try{
    let response = await fetch(configUrl);
    let config = await response.json();
    let token = {"qspace_id":config.qspace.id, "qlib_id":libraryId};
    let token64 = base64.encode(JSON.stringify(token));
    console.log("Static Token: " + token64);
    return token64;
  }catch(e){
    console.error("Could not create static token: " + e);
  }
  return null;
}

export default class Fabric {

  // Initializes a new Fabric object using a static token for the given network url. 
  // This client can be used to access public objects and metadata
  async init({configUrl,staticToken}) {
    this.client = await ElvClient.FromConfigurationUrl({
      configUrl,
      staticToken
    });
    //this.client.ToggleLogging(true);
    this.configUrl = configUrl;
  }

    // Initializes a new Fabric object using a static token for the given network url. 
  // This client can be used to access public objects and metadata
  async initWithLib({configUrl,libraryId}) {
    let staticToken = CreateStaticToken({configUrl,libraryId})
    this.client = await ElvClient.FromConfigurationUrl({
      configUrl,
      staticToken
    });
    this.configUrl = configUrl;
  }

  async initFromMnemonic({configUrl, mnemonic}) {
    this.client = await ElvClient.FromConfigurationUrl({
      configUrl,
    });
    const wallet = this.client.GenerateWallet();
    const signer = wallet.AddAccountFromMnemonic({
      mnemonic,
    });
    this.client.SetSigner({signer});
    this.configUrl = configUrl;
  }

  async initFromKey({configUrl, privateKey}) {
    this.client = await ElvClient.FromConfigurationUrl({configUrl});
    //await this.client.UseRegion({region:"na-west-south"});
    this.wallet = this.client.GenerateWallet();
    this.signer = this.wallet.AddAccount({
      privateKey,
    });
    this.client.SetSigner({signer: this.signer});
    this.configUrl = configUrl;
  }

  async initFromEncryptedPrivateKey({
    configUrl,
    encryptedPrivateKey,
    password,
  }) {
    this.client = await ElvClient.FromConfigurationUrl({configUrl});
    this.wallet = this.client.GenerateWallet();
    this.signer = await this.wallet.AddAccountFromEncryptedPK({
      encryptedPrivateKey,
      password,
    });
    this.client.SetSigner({signer: this.signer});
    this.configUrl = configUrl;
  }

  async initFromClient({client}) {
    this.client = client;
    this.configUrl = client.configUrl;
  }

  redeemCode = async (tenantId, code) =>{
    //console.log("RedeemCode tenantId: " + tenantId + " code: " + code);
    try { 
      let siteId = await this.client.RedeemCode({
        tenantId,
        code
      });

      console.log("Redeemed SiteID: ");
      console.log(JQ(siteId));
      return siteId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error redeeming code:");
      // eslint-disable-next-line no-console
      console.error(error);

      return null;
    }
  }
  
  
  //CHANNEL

  //XXX: Use elvclient's channel implementation when available
  async getOfferings(channelHash){
    try {
      let channelOptionsUrl = await this.client.FabricUrl({
        versionHash: channelHash,
        "rep": "channel/options.json"
      });

      console.log("Channel options url: " + channelOptionsUrl);
      let response = await fetch(channelOptionsUrl);
      let json = await response.json();
      return json;
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  async getOfferingOptions({channelHash, offering}) {

    // Step 2 - retrieve playout options for the offering
    //let url = qfab + "/q/" + channelHash + "/rep/channel/" + offering + "/options.json?authorization=" + token + resolveIgnoreErrors;
      
    let url = await this.client.FabricUrl({
      versionHash: channelHash,
      "rep": `channel/${offering}/options.json`
    });

    console.log("Offering Playout URL: ", url);
    let response = await fetch(url);
    let playoutOptions = await response.json();

    return playoutOptions;
  }

  async getChannelVideoUrl({channelHash, offering}) {
    
    let playoutOptions = await this.getOfferingOptions({channelHash, offering});
    console.log("playoutOptions: offering " + offering + " - " + JQ(playoutOptions));
    
    if(!playoutOptions || !offering){
      console.log("No playoutOptions or offering");
      throw {'error':"No playoutOptions or offering"}
    }
    console.log("playoutOptions: error?");

    if(!isEmpty(playoutOptions.errors)){
      console.log("playoutOptions.errors: " + JQ(playoutOptions.errors));
      throw {'error':playoutOptions.errors[0].cause};
    }


    let hlsUri = playoutOptions["hls-clear"]["uri"];
    console.log("playoutOptions uri " + hlsUri);

    // Step 2 - pick 'hls-clear' and retrieve HLS playlist URL
    //let hlsPlaylistUrl = qfab + "/q/" + channelHash + "/rep/channel/" + offering + "/" + playoutOptions["hls-clear"].uri;
 
    let basePath = await this.client.FabricUrl({
      versionHash: channelHash,
      "rep": `channel/${offering}/`,
      noAuth: true,
    });

    //Strip auth
    basePath =  URI(basePath).query("").toString();
    console.log("playoutOptions uri " + basePath);

    let hlsPlaylistUrl = UrlJoin(basePath, hlsUri);

    return hlsPlaylistUrl;
  }

  getSessionId({uri}) {
    // ATTENTION: this session ID will be returned as an individual field in the playout options
    // So this code is temporary - I am just parsing it out of the playlist URL
    let q = require('url').parse(uri, {parseQueryString: true}).query;
    return q.sid
  }

  async getChannelViews({channelHash, offering, sid}){
    console.log("getChannelViews: sid " + sid);
    if(!sid  || !offering || !channelHash){
      throw {error:"Invalid arguments to getChannelViews."};
    }
    let url = await this.client.FabricUrl({
      versionHash: channelHash,
      "rep": `channel/${offering}/views.json`,
      "queryParams": {
        "sid": sid
      }
    });

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

    let url = await this.client.FabricUrl({
      versionHash: channelHash,
      "rep": `channel/${offering}/select_view`,
      "queryParams": {
        "sid": sid
      }
    });


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

    console.log("Response: " + JQ(response));
  }
}
