var {isEmpty, JQ} = require('../utils');
var URI = require("urijs");
var UrlJoin = require("url-join");
var dateFormat = require('dateformat');

class ElvPlatform {
  constructor({fabric, libraryId, siteId}) {
    this.fabric = fabric;
    this.client = fabric.client;
    this.siteId = siteId;
    this.siteLibraryId = libraryId;
    this.eventSites={};
    this.availableSite={};
    this.currentHost = "";
  }

  async load(subtree = "/public",select=[]){
    //try {
      console.log("Platform load");
      if(!this.siteLibraryId){
        this.siteLibraryId = await this.client.ContentObjectLibraryId({objectId: this.siteId});
      }
      console.log("siteLibraryId: " + this.siteLibraryId);

      
      const versionHash = await this.client.LatestVersionHash({objectId: this.siteId});
      console.log("versionHash: " + versionHash);
      
      this.siteParams = {
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
        versionHash
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
        select
      });
      console.log("Platform asset_metadata: " + JQ(this.siteInfo));

      /*this.siteInfo.baseLinkUrl = await this.client.LinkUrl({
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
        linkPath: "public/asset_metadata"
      }); */

      this.siteInfo.baseLinkUrl = await this.client.FabricUrl({...this.siteParams});
      let baseURI = URI(this.siteInfo.baseLinkUrl);
      this.currentHost = baseURI.protocol() + "://" + baseURI.host();
      
      console.log("Platform base current host: " + this.currentHost);

      //Background image
      /*
      this.siteInfo.tv_main_background = this.createLink(
        this.siteInfo.baseLinkUrl,
        "info/event_images/tv_main_background/default"
      );
      */

      let sites = this.siteInfo.asset_metadata[eventsKey] || {};
      this.availableSites = {};
      //console.log(JQ(this.availableSites));
      for (const index in sites) {
        try {
          let item = sites[index];
          console.log(JQ(item));
          let key = Object.keys(item)[0]
          let site = sites[index][key];
          site.metaDataPath = `public/asset_metadata/${eventsKey}/${index}/${key}`;
          //if(key != "ro-channel-test"){
            //continue;
          //}
          this.availableSites[key] = await this.resolveSite(site,key);
        } catch(error){
          console.error("Failed to load site: ");
          console.error(error);
        }
      }
      
      console.log("Platform loaded. ");

    /*} catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load platform:");
      // eslint-disable-next-line no-console
      console.error(error);
    }*/
  }

  getCurrentHost = ()=>{
    return this.currentHost;
  }

  getSites(){
    return this.availableSites;
  }

  async resolveSite(site,key){
    site.versionHash = site["."].source;
    site.objectId = this.client.utils.DecodeVersionHash(site.versionHash ).objectId;
    site.tv_main_background = this.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_background"
    );
    
    site.tv_main_logo = this.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_logo"
    );

    let extras = [];
    console.log("resolving extras: " + JQ(site.info.extras));
    for(const index in site.info.extras){
        let extra = site.info.extras[index];
        extra.resolvePackageLink = async ()=>{
          console.log("evaluating extra: " + JQ(extra));
          let packageLink = extra["package"];
          if(packageLink["info"] != undefined){
            return packageLink;
          }

          console.log("Package: ", packageLink);

          let versionHash = packageLink["/"].split("/")[2];
          console.log("Package hash:", versionHash);

          let packageInfo = await this.client.ContentObjectMetadata({
            versionHash,
            metadataSubtree: "/public/asset_metadata",
            resolveLinks: true,
            resolveIncludeSource: true,
            resolveIgnoreErrors: true,
            produceLinkUrls: true,
          });

          console.log("Package Info:", packageInfo);
          return packageInfo;
        }

        extra.image = this.createLink(
        this.siteInfo.baseLinkUrl,
          "/meta/" + site.metaDataPath+`/info/extras/${index}/image`
        );
        console.log(extra.image);
    }

    //site.channels = await this.createChannels(site,key);
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