var {isEmpty, JQ, decodeVersionHash} = require('../utils');
var URI = require("urijs");
var UrlJoin = require("url-join");

class ElvPlatform {
  constructor({fabric, libraryId, siteId}) {
    this.fabric = fabric;
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
  }

  load = async () =>{
    let subtree = "/public";
    let select=[];

    try {
      console.time("* Platform load *");
      console.log("siteLibraryId: " + this.siteLibraryId);
   
      this.siteParams = {
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
      };

      let eventsKey = "featured_events";

      if(!select){
        select = [
          eventsKey,
        ];
      }

      this.siteInfo = await this.fabric.getContent({
        ...this.siteParams
      });

      //console.log("Platform info: "+ JQ(this.siteInfo.asset_metadata[eventsKey]));

      this.siteInfo.baseLinkUrl = await this.fabric.baseUrl({...this.siteParams});
      let baseURI = URI(this.siteInfo.baseLinkUrl);
      this.currentHost = baseURI.protocol() + "://" + baseURI.host();
      
      console.log("Platform base current host: " + this.currentHost);

      this.eluvioLogo = this.fabric.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/public/asset_metadata/info/site_images/eluvio_live_logo_light"
      );

      console.log("Eluvio Logo: " + this.eluvioLogo);

      let sites = this.siteInfo.asset_metadata[eventsKey] || {};
      //console.log("Site: " + JQ(sites));
      this.availableSites = [];
      for (const index in sites) {
        try {
          let item = sites[index];
          let key = Object.keys(item)[0]
          let site = sites[index][key];
          site.metaDataPath = `public/asset_metadata/${eventsKey}/${index}/${key}`;
          site = await this.resolveSite(site,key);
          site.getLatestChannels = async()=>{
          console.log("site getLatestChannels " + site.versionHash);
          /*
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
            */
            let siteInfo = await this.fabric.getContent({
              versionHash:site.versionHash,
              path:"/meta/public/asset_metadata"
            });

            //console.log("Site refreshed: "+ JQ(siteInfo));
            return siteInfo["channels"];
          }
          //console.log("Featured site extras: " + JQ(site.info.extras));
          this.availableSites.push(site);
        } catch(error){
          console.error("Failed to load site: ");
          console.error(error);
        }
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load platform:");
      // eslint-disable-next-line no-console
      console.error(error);
    }finally{
      console.timeEnd("* Platform load *");
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
    site.objectId = decodeVersionHash(site.versionHash).objectId;
    //Expensive:
    //site.libraryId = await this.client.ContentObjectLibraryId({objectId:site.objectId});
    site.slug = key;
    site.tv_main_background = this.fabric.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_background"
    );
    //console.log("resolveSite tv_main_background: " + site.tv_main_background);
    
    site.tv_main_logo = this.fabric.createLink(
        this.siteInfo.baseLinkUrl,
        "/meta/" + site.metaDataPath+"/info/event_images/tv_main_logo"
    );
    //console.log("resolveSite tv_main_logo: " + site.tv_main_logo);

    site.getTicketInfo = (otpId)=>{
      console.log("site: getTicketDate " + otpId);
        //console.log("site tickets: " + JQ(site.info.tickets));
        for(var index in site.info.tickets){
          //try{
            let ticket = site.info.tickets[index];
            console.log("site ticket: " + JQ(ticket));
            
            for(var index2 in ticket.skus){
              let sku = ticket.skus[index2];
              console.log("sku: " + JQ(sku));
              if(sku.otp_id && sku.otp_id != "" && sku.otp_id === otpId){
                console.log("Found ticket info!");
                return sku;
              }
            }
          //}catch(e){
          //  console.error("Could not find ticket date for otpId " + otpId + " " +e);
          //}
        }
      return null;
    }

    //console.log("resolving extras: " + JQ(site.info.extras));
    for(const index in site.info.extras){
        let extra = site.info.extras[index];
        extra.basePath = UrlJoin(site.metaDataPath,`/info/extras/${index}`);
        //console.log("Extra basepath: ",extra.basePath);
        let packageLink = extra["package"];
        if(packageLink["info"] != undefined){
          extra.isAvailable = true;
          //console.log("package available.");
          try{
            //Trying to get the video urls for all extras with videos
            //extra.videoUrl = extra.package.video
            let gallery = extra.package.info.gallery;
            //console.log("gallery: " + JQ(gallery));
            for(let itemIndex in gallery){
              let item = gallery[itemIndex];
              if(!isEmpty(item.image)){
                item.image.url = this.fabric.createLink(
                UrlJoin(this.siteInfo.baseLinkUrl,"/meta/",site.metaDataPath,`/info/extras/${index}`),
                  `/package/info/gallery/${itemIndex}/image`
                );
              }

              item.createVideoUrl = async()=>{
                try{
                  console.log("item createVideoUrl: " + JQ(item.video));
                  let fabricLink = item.video.sources.default;
                  if(fabricLink){
                    console.log("videoLink " + JQ(fabricLink));
                    //let linkPath =  UrlJoin(extra.basePath, `/package/info/gallery/${itemIndex}/video/sources/default`);
                    //console.log("PlayoutOptions linkPath: " + JQ(linkPath));

                    //TODO:

                    /*
                    let playoutOptions = await this.client.PlayoutOptions({
                      libraryId: this.siteLibraryId,
                      objectId: this.siteId,
                      linkPath,
                      protocols: ["hls", "dash"],
                      drms: ["aes-128","sample-aes", "clear"],
                      offering: "default"
                    });
                    */

                    let {playoutOptions,videoUrl} = await this.fabric.getVideoPlayoutInfo({
                      fabricLink
                    });

                    console.log("PlayoutOptions response: " + JQ(playoutOptions));
                    item.videoUrl = videoUrl;
                    console.log("VideoUrl: " + item.videoUrl);
                    return videoUrl;
                  }
                  console.log("No video link found.");
                  return null;
                }catch(e){
                  console.log("No video link found.");
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
          extra.image = this.fabric.createLink(
          this.siteInfo.baseLinkUrl,
            "/meta/" + site.metaDataPath+`/info/extras/${index}/image`
          );
        }
    }

    return site;
  }
}

module.exports = {
  ElvPlatform,
}