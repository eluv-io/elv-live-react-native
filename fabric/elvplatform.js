var {isEmpty, JQ} = require('../utils');
var URI = require("urijs");
var UrlJoin = require("url-join");
var dateFormat = require('dateformat');
import testSite from "../testdata/testsite";
import testExtras from "../testdata/extras";
import {ElvClient} from '../ElvClient-min';
import extras from "../testdata/extras";

class ElvPlatform {
  constructor({fabric, libraryId, siteId}) {
    this.fabric = fabric;
    this.client = fabric.client;
    this.siteId = siteId;
    this.siteLibraryId = libraryId;
    this.eventSites={};
    this.availableSites=[];
    this.currentHost = "";
    this.load = this.load.bind(this);
    this.setFabric = this.setFabric.bind(this);
    this.resolveSite = this.resolveSite.bind(this);
  }

  setFabric = (fabric)=>{
    console.log("ElvPlatform setFabric");
    this.fabric = fabric;
    this.client = fabric.client;
  }

  load = async () =>{
    let subtree = "/public";
    let select=[];

    try {
      console.log("Platform load");
      if(!this.siteLibraryId){
        this.siteLibraryId = await this.client.ContentObjectLibraryId({objectId: this.siteId});
      }
      console.log("siteLibraryId: " + this.siteLibraryId);
      //const versionHash = await this.client.LatestVersionHash({objectId: this.siteId});
      //console.log("versionHash: " + versionHash);
      
      this.siteParams = {
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
        //versionHash
      };

      let eventsKey = "featured_events";

      if(!select){
        select = [
          eventsKey,
        ];
      }

      this.siteInfo = await this.client.ContentObjectMetadata({
        ...this.siteParams,
        metadataSubtree: subtree,
        resolveLinks: true,
        resolveIncludeSource: true,
        resolveIgnoreErrors: true,
        produceLinkUrls: true,
        linkDepthLimit: 10,
        select,
        noCache:true
      });

      //console.log("Platform asset_metadata: " + JQ(this.siteInfo["asset_metadata"]["featured_events"][0]["ritaora"]["info"]["extras"][1]));

      /*this.siteInfo.baseLinkUrl = await this.client.LinkUrl({
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
        linkPath: "public/asset_metadata"
      }); */

      this.siteInfo.baseLinkUrl = await this.client.FabricUrl({...this.siteParams});
      let baseURI = URI(this.siteInfo.baseLinkUrl);
      this.currentHost = baseURI.protocol() + "://" + baseURI.host();
      
      console.log("Platform base current host: " + this.currentHost);

      this.eluvioLogo = this.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/public/asset_metadata/info/site_images/eluvio_live_logo_white"
      );

      let sites = this.siteInfo.asset_metadata[eventsKey] || {};
      this.availableSites = [];
      //console.log(JQ(this.availableSites));
      for (const index in sites) {
        try {
          let item = sites[index];
          let key = Object.keys(item)[0]
          let site = sites[index][key];
          site.getLatestChannels = async()=>{
            let siteInfo = await this.client.ContentObjectMetadata({
              libraryId:site.libraryId,
              objectId:site.objectId,
              metadataSubtree: "public/asset_metadata",
              resolveLinks: true,
              resolveIncludeSource: true,
              resolveIgnoreErrors: true,
              produceLinkUrls: true,
              linkDepthLimit: 5,
              select:"channels",
              noCache:true
            });
            console.log("Site refreshed: "+ JQ(siteInfo));
            return siteInfo["channels"];
          }
          //console.log("Featured site extras: " + JQ(site.info.extras));
          site.metaDataPath = `public/asset_metadata/${eventsKey}/${index}/${key}`;
          this.availableSites.push(await this.resolveSite(site,key));
        } catch(error){
          console.error("Failed to load site: ");
          console.error(error);
        }
      }
      
      //XXX: test site
      //this.availableSites.push(testSite);
      //console.log(JQ(testSite));

      console.log("Platform loaded. ");
      console.log("Length: " + this.availableSites.length);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load platform:");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  getCurrentHost = ()=>{
    return this.currentHost;
  }

  getSites = ()=>{
    //console.log("Platform getSites " + this.availableSites.length);
    return this.availableSites;
  }

  resolveSite = async (site,key) =>{
    site.versionHash = site["."].source;
    site.objectId = await this.client.utils.DecodeVersionHash(site.versionHash ).objectId;
    site.libraryId = await this.client.ContentObjectLibraryId({objectId:site.objectId});
    site.slug = key;
    site.tv_main_background = this.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_background"
    );
    
    site.tv_main_logo = this.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_logo"
    );

    //console.log("resolving extras: " + JQ(site.info.extras));
    for(const index in site.info.extras){
        let extra = site.info.extras[index];
        extra.basePath = UrlJoin(site.metaDataPath,`/info/extras/${index}`);
        console.log("Extra: ",extra);
        let packageLink = extra["package"];
        if(packageLink["info"] != undefined){
          extra.isAvailable = true;
          console.log("package available.");
          try{
            //Trying to get the video urls for all extras with videos
            //extra.videoUrl = extra.package.video
            let gallery = extra.package.info.gallery;
            //console.log("gallery: " + JQ(gallery));
            for(let itemIndex in gallery){
              let item = gallery[itemIndex];
              item.createVideoUrl=async()=>{
                try{
                  console.log("item video: " + JQ(item.video));
                  if(item.video.sources.default){
                  console.log("item video source default: " + JQ(item.video.sources.default));
                    let linkPath =  UrlJoin(extra.basePath, `/package/info/gallery/${itemIndex}/video/sources/default`);
                    console.log("PlayoutOptions linkPath: " + JQ(linkPath));

                    let playoutOptions = await this.client.PlayoutOptions({
                      libraryId: this.siteLibraryId,
                      objectId: this.siteId,
                      linkPath,
                      protocols: ["hls", "dash"],
                      drms: ["aes-128","sample-aes", "clear"],
                      offering: "default"
                    });
                    console.log("PlayoutOptions response: " + JQ(playoutOptions));

                    let playoutUrl = (playoutOptions.hls.playoutMethods.clear || 
                      playoutOptions.hls.playoutMethods["sample-aes"] || 
                      playoutOptions.hls.playoutMethods["aes-128"]).playoutUrl;

                    item.videoUrl = playoutUrl;
                    console.log("VideoUrl: " + item.videoUrl);
                    return playoutUrl;
                  }
                  return null;
                }catch(e){
                  return null;
                }
              }
            }
          }catch(e){
            console.log("Could not get video url for extra. " + e);
          }
        }else{
          extra.isAvailable = false;
        }

        if(!isEmpty(extra.image)){
          extra.image = this.createLink(
          this.siteInfo.baseLinkUrl,
            "/meta/" + site.metaDataPath+`/info/extras/${index}/image`
          );
        }
    }

    return site;
  }

  async createChannelsback(site,key){
      const titleLinks = await this.client.ContentObjectMetadata({
      ...this.siteParams,
      metadataSubtree: UrlJoin(site.metaDataPath, "streams"),
      resolveLinks: true,
      resolveIgnoreErrors: true,
      resolveIncludeSource: true,
      select: [
        "*/*/title",
        "*/*/display_title",
        "*/*/sources"
      ]
    });

    let newChannels = await Promise.all(
      Object.keys(titleLinks || {}).map(async index => {
        let slug = Object.keys(titleLinks[index])[0];
        const { title, display_title, sources } = titleLinks[index][slug];
        //console.log("createChannel: " + JQ(titleLinks[index]));
        let getVideoUrl = async (key)=>{
            console.log("getVideoUrl: ");
            if(isEmpty(key)){
              key = "default";
            }
            let playoutOptions = await this.client.PlayoutOptions({
              libraryId: this.siteLibraryId,
              objectId: this.siteId,
              linkPath: UrlJoin(site.metaDataPath, "streams", index, slug, "sources", "default"),
              protocols: ["hls", "dash"],
              drms: ["aes-128","sample-aes", "clear"],
              offering: key
            });
            //console.log("PlayoutOptions: " + JQ(playoutOptions));

            let playoutUrl = (playoutOptions.hls.playoutMethods.clear || 
              playoutOptions.hls.playoutMethods["sample-aes"] || 
              playoutOptions.hls.playoutMethods["aes-128"]).playoutUrl;

            return playoutUrl;
          }
        
        let thumbnail = `https://picsum.photos/250/150`;
        return { title, display_title, thumbnail, getVideoUrl }
      })
    );

    return newChannels;

  }

  createLink(baseLink, path, query={}) {
    const basePath = URI(baseLink).path();

    return URI(baseLink)
      .path(UrlJoin(basePath, path))
      .addQuery(query)
      .toString();
  }

}

module.exports = {
  ElvPlatform,
}