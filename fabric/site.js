var {isEmpty, JQ} = require('../utils');
var URI = require("urijs");
var UrlJoin = require("url-join");
var dateFormat = require('dateformat');

const DEFAULT_SITE_CUSTOMIZATION = {
  colors: {
    background: "#000000",
    primary_text: "#FFFFFF"
  }
};

class Site {
  constructor({fabric, siteId}) {
    this.fabric = fabric;
    this.client = fabric.client;
    this.siteId = siteId;
    this.titleStore = {};
  }

  async loadSite() {
    try {
      if(!this.siteLibraryId){
        this.siteLibraryId = await this.client.ContentObjectLibraryId({objectId: this.siteId});
      }
      console.log("siteLibraryId: " + this.siteLibraryId);

      const versionHash = await this.client.LatestVersionHash({objectId: this.siteId});
      console.log("versionHash: " + versionHash);

      this.siteInfo = await this.client.ContentObjectMetadata({
        siteId: this.siteId,
        versionHash,
        metadataSubtree: "public/asset_metadata",
        resolveLinks: true,
        resolveIncludeSource: true,
        resolveIgnoreErrors: true,
        select: [
          "title",
          "display_title",
          "channels",
          //"episodes",
          //"playlists",
          //"seasons",
          //"series",
          "titles"
        ]
      });

      //console.log("asset_metadata: " + JQ(this.siteInfo));

      this.siteInfo.baseLinkUrl = await this.client.LinkUrl({
        libraryId: this.siteLibraryId,
        objectId: this.siteId,
        linkPath: "public/asset_metadata"
      });

      //Top left logo
      this.siteInfo.title_logo = this.createLink(
        this.siteInfo.baseLinkUrl,
        "images/title_logo/thumbnail"
      );

      //Site selection Screen
      this.siteInfo.landscape_logo = this.createLink(
        this.siteInfo.baseLinkUrl,
        "images/landscape/default"
      );

      //Background image
      this.siteInfo.main_background = this.createLink(
        this.siteInfo.baseLinkUrl,
        "images/main_background/default"
      );
      
      this.siteInfo.playlists = await this.loadPlaylists(versionHash, this.siteInfo.playlists);
      //this.siteInfo.series = await this.loadTitles(versionHash, "series", this.siteInfo.series);
      //this.siteInfo.seasons = await this.loadTitles(versionHash, "seasons", this.siteInfo.seasons);
      //this.siteInfo.episodes = await this.loadTitles(versionHash, "episodes", this.siteInfo.episodes);
      this.siteInfo.titles = await this.loadTitles(versionHash, "titles", this.siteInfo.titles);
      this.siteInfo.channels = await this.loadTitles(versionHash, "channels", this.siteInfo.channels);
      //this.siteInfo.customizations = await this.loadCustomization();
      console.log("Site loaded. ");

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load site:");
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  loadTitle = async (params, title, baseLinkPath, client) => {
    if(title["."] && title["."].resolution_error) {
      return;
    }

    title.displayTitle = title.display_title || title.title || "";

    title.versionHash = title["."] ? title["."].source : params.versionHash;
    title.objectId = client.utils.DecodeVersionHash(title.versionHash).objectId;

    title.baseLinkPath = baseLinkPath;
    title.playoutOptionsLinkPath = UrlJoin(title.baseLinkPath, "sources", "default");
    title.baseLinkUrl =
      await client.LinkUrl({...params, linkPath: title.baseLinkPath});

    Object.assign(title, await this.imageLinks({baseLinkUrl: title.baseLinkUrl, versionHash: title.versionHash, images: title.images}));

    return title;
  }


  loadActiveTitle = async (siteParams,title,client) => {
    console.log("loadActiveTitle: " + title.displayTitle);
    title.metadata = await client.ContentObjectMetadata({
      ...(siteParams),
      metadataSubtree: title.baseLinkPath,
      resolveLinks: true,
      resolveIncludeSource: true,
      resolveIgnoreErrors: true
    });

    console.log("metadata loaded: ");

    let params, linkPath;
    if(title.isSearchResult) {
      params = { versionHash: title.versionHash };
    } else {
      params = siteParams;
      linkPath = title.playoutOptionsLinkPath;
    }
    console.log("params ");
    let availableOfferings = await client.AvailableOfferings({...params, linkPath});
    if(Object.keys(availableOfferings).length === 0) {
      availableOfferings = {
        default: {
          display_name: "default"
        }
      };
    }
    const allowedOfferings = this.siteInfo.allowed_offerings;

    if(allowedOfferings) {
      Object.keys(availableOfferings).map(offeringKey => {
        if(!allowedOfferings.includes(offeringKey)) {
          delete availableOfferings[offeringKey];
        }
      });
    }

    title.availableOfferings = availableOfferings;

    const initialOffering = availableOfferings.default ? "default" : Object.keys(availableOfferings)[0];
    if(initialOffering) {
      await this.loadActiveTitleOffering(siteParams,initialOffering, title, client);
      console.log("Set playoutUrl: " + title.playoutUrl)
    }

    return title;
  }

  loadActiveTitleOffering = async (siteParams,offering, title, client) => {
    console.log("loadactivetitleoffering");
    if(title.playoutOptions && title.playoutOptions[offering]) {
      title.currentOffering = offering;
    }

    let params, linkPath;
    if(title.isSearchResult) {
      params = { versionHash: title.versionHash };
    } else {
      params = siteParams;
      linkPath = title.playoutOptionsLinkPath;
    }

    try {
      const playoutOptions = await client.PlayoutOptions({
        ...params,
        offering,
        linkPath,
        protocols: ["hls", "dash"],
        drms: ["aes-128", "widevine", "clear"]
      });

      console.log("playoutoptions " + playoutOptions);

      title.playoutOptions = {
        ...(title.playoutOptions || {}),
        [offering]: playoutOptions
      };

      console.log("playoutoptions " + JQ(title.playoutOptions));

      title.currentOffering = offering;
      let playoutUrl = (playoutOptions.hls.playoutMethods.clear || 
        /*playoutOptions.hls.playoutMethods["sample-aes"] || */ //Crashes app simulator
        playoutOptions.hls.playoutMethods["aes-128"]).playoutUrl;
      
      title.playoutUrl = playoutUrl;

      console.log("playouturl" + JQ(title.playoutUrl));

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading playout options for offering " + offering);
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  async loadPlaylists(versionHash, playlistInfo) {
    if(!playlistInfo || Object.keys(playlistInfo).length === 0) { return []; }
    let playlists = [];

    await Promise.all(
      Object.keys(playlistInfo).map(async playlistSlug => {
        try {
          const {name, order, list} = playlistInfo[playlistSlug];
          let titles = [];
          await Promise.all(
            Object.keys(list || {}).map(async titleSlug => {
              try {
                let title = list[titleSlug];
                title.displayTitle = title.display_title || title.title || "";
                title.versionHash = title["."].source;
                if(!title.versionHash){
                  console.error("Error loading title: " + titleSlug + " " + JQ(title));
                  return;
                }
                title.objectId = this.client.utils.DecodeVersionHash(title.versionHash).objectId;
                const titleLinkPath = `public/asset_metadata/playlists/${playlistSlug}/list/${titleSlug}`;
                title.baseLinkPath = titleLinkPath;
                title.baseLinkUrl =
                  await this.client.LinkUrl({versionHash, linkPath: titleLinkPath});
                title.playoutOptionsLinkPath = UrlJoin(titleLinkPath, "sources", "default");
              
                //For lazy loading the offerings
                title.getAvailableOfferings = async () =>{
                  title.availableOfferings = await this.getAvailableOfferings(title);
                }

                title.getVideoUrl = async (offeringKey) => {
                  if(!title.availableOfferings){
                    await title.getAvailableOfferings();
                  }
      
                  let offering = title.availableOfferings[offeringKey];
                  let videoUrl = offering.videoUrl;
                  if(!videoUrl){
                    videoUrl = await offering.getVideoUrl(offeringKey);
                  }
                  return videoUrl;
                }
      
                Object.assign(title, await this.imageLinks({baseLinkUrl: title.baseLinkUrl, versionHash: title.versionHash, images: title.images}));

                titles[parseInt(title.order)] = title;
                this.titleStore[title.versionHash] = title;
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`Failed to load title ${titleSlug} in playlist ${order} (${name})`);
                // eslint-disable-next-line no-console
                console.error(error);
              }
            })
          );

          playlists[parseInt(order)] = {
            playlistId: Id.next(),
            name,
            titles: titles.filter(title => title),
            order
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load playlist ${playlistSlug}`);
          // eslint-disable-next-line no-console
          console.error(error);
        }
      })
    );

    return playlists.filter(playlist => playlist);
  }

  async loadTitles(versionHash, metadataKey, titleInfo) {
    console.log("loadTitles");
    if(!titleInfo) { return []; }

    // Titles: {[index]: {[title-key]: { ...title }}
    let titles = [];
    await Promise.all(
      Object.keys(titleInfo).map(async index => {
        try {
          const titleKey = Object.keys(titleInfo[index])[0];
          let title = titleInfo[index][titleKey];

          if(title["."].resolution_error) {
            return;
          }

          title.displayTitle = title.display_title || title.title || "";
          title.versionHash = title["."].source;
          title.objectId = this.client.utils.DecodeVersionHash(title.versionHash).objectId;

          const linkPath = UrlJoin("public", "asset_metadata", metadataKey, index, titleKey);
          title.playoutOptionsLinkPath = UrlJoin(linkPath, "sources", "default");
          title.baseLinkPath = linkPath;
          title.baseLinkUrl =
            await this.client.LinkUrl({versionHash, linkPath});

          //For lazy loading the offerings
          title.getAvailableOfferings = async () =>{
            console.log("title.getAvailableOfferings " + title.displayTitle + " getAvaiableOfferings");
            title.availableOfferings = await this.getAvailableOfferings(title);
            return title.availableOfferings;
          }

          title.getVideoUrl = async (offeringKey) => {
            console.log("title.getVideoUrl() ");
            if(isEmpty(offeringKey)){
              offeringKey = "default";
            }

            if(!title.availableOfferings){
              await title.getAvailableOfferings();
            }

            let offering = title.availableOfferings[offeringKey];
            console.log("offering: " + JQ(offering));
            let videoUrl = null;
            
            if(offering){
              videoUrl = offering.videoUrl;
            }

            if(!videoUrl){
              videoUrl = await offering.getVideoUrl(offeringKey);
              console.log("getVideoUrl finished: " + JQ(videoUrl));
            }
            return videoUrl;
          }

          Object.assign(title, await this.imageLinks({baseLinkUrl: title.baseLinkUrl, versionHash: title.versionHash, images: title.images}));

          titles[index] = title;
          this.titleStore[title.versionHash] = title;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load title ${index}`);
          // eslint-disable-next-line no-console
          console.error(error);
        }
      })
    );

    return titles.filter(title => title);
  }

  async getAvailableOfferings(title){
    let allowedOfferings = [];
    var newAvailableOfferings = {};
    let availableOfferings = {};
    try{
      availableOfferings = await this.client.AvailableOfferings({versionHash: title.versionHash});
    }catch(e){
      //This is just a demo api? Will likely throw so don't log.
    }
    console.log("getAvailableOfferings returned:  " + JQ(availableOfferings));

    try {
      if(!isEmpty(this.siteInfo.allowed_offerings)){
        allowedOfferings = this.siteInfo.allowed_offerings;
      }

      if(!allowedOfferings.includes("default")){
        allowedOfferings.push("default");
      }

      console.log("allowedOfferings:  " + JQ(allowedOfferings));

      if(isEmpty(availableOfferings)){
        availableOfferings["default"]={};
        console.log("No availableOfferings, setting to default:  " + JQ(availableOfferings));
      }
      
      for (const key in availableOfferings) {
        console.log("processing offering:  " + JQ(key));
        if(allowedOfferings.length > 0 && !allowedOfferings.includes(key)){
          console.log("skipping:  " + JQ(key));
          continue;
        }

        let offering = availableOfferings[key];
        offering.key = key;

        offering.getVideoUrl = async (key)=>{
          if(isEmpty(key)){
            key = "default";
          }
          let playoutOptions = await this.client.PlayoutOptions({
            libraryId: this.siteLibraryId,
            objectId: this.siteId,
            linkPath: title.playoutOptionsLinkPath,
            protocols: ["hls", "dash"],
            drms: ["aes-128","sample-aes", "clear"],
            offering: key
          });
          console.log("PlayoutOptions: " + JQ(playoutOptions));

          let playoutUrl = (playoutOptions.hls.playoutMethods.clear || 
            playoutOptions.hls.playoutMethods["sample-aes"] || 
            playoutOptions.hls.playoutMethods["aes-128"]).playoutUrl;

          offering.videoUrl = playoutUrl;
          return offering.videoUrl;
        }
        
        if(offering.display_name == "default" || isEmpty(offering.display_name)){
          offering.display_name = "Watch";
        }

        newAvailableOfferings[key] = offering;
      }
      

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to get offerings for ${title.displayTitle}: `);
      // eslint-disable-next-line no-console
      console.error(error);
    }
    if(isEmpty(newAvailableOfferings)){
      newAvailableOfferings = availableOfferings;
    }
    return newAvailableOfferings;
  }

  getTitle({id}) {
    return this.titleStore[id];
  }

  async imageLinks({baseLinkUrl, versionHash, images}) {
    images = images || {};

    let landscapeUrl, portraitUrl, imageUrl, posterUrl;
    if(images.landscape) {
      landscapeUrl = this.createLink(baseLinkUrl, UrlJoin("images", "landscape", "default"));
    } else if(images.main_slider_background_desktop) {
      landscapeUrl = this.createLink(baseLinkUrl, UrlJoin("images", "main_slider_background_desktop", "default"));
    }

    if(images.poster) {
      portraitUrl = this.createLink(baseLinkUrl, UrlJoin("images", "poster", "default"));
    } else if(images.primary_portrait) {
      portraitUrl = this.createLink(baseLinkUrl, UrlJoin("images", "primary_portrait", "default"));
    } else if(images.portrait) {
      portraitUrl = this.createLink(baseLinkUrl, UrlJoin("images", "portrait", "default"));
    }

    posterUrl = landscapeUrl;

    return {
      posterUrl,
      landscapeUrl,
      portraitUrl,
    };
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
  Site,
}