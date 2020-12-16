if (!global.WebAssembly) {
  global.WebAssembly = require('webassemblyjs');
}
import 'react-native-get-random-values';
import '@expo/browser-polyfill';
import {ElvClient} from '../ElvClient-min';
import {JQ} from '../utils'

export default class Fabric {
  async init({configUrl}) {
    this.client = await ElvClient.FromConfigurationUrl({
      configUrl,
    });
    this.client.ToggleLogging(true);
    let crypto = JSON.stringify(await this.client.Crypto.GeneratePrimaryConk());
    console.log('crypto: ' + crypto);
    const wallet = this.client.GenerateWallet();
    const mnemonic = wallet.GenerateMnemonic();
    const signer = wallet.AddAccountFromMnemonic({
      mnemonic,
    });
    this.client.SetSigner({signer});
    this.configUrl = configUrl;
    return crypto;
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

  async findSites() {
    let sites = [];
    const contentSpaceLibraryId = this.client.utils.AddressToLibraryId(
      this.client.utils.HashToAddress(await this.client.ContentSpaceId()),
    );

    const groupAddresses = await this.client.Collection({
      collectionType: 'accessGroups',
    });
    await Promise.all(
      groupAddresses.map(async (groupAddress) => {
        try {
          const groupSites = await this.client.ContentObjectMetadata({
            libraryId: contentSpaceLibraryId,
            objectId: this.client.utils.AddressToObjectId(groupAddress),
            metadataSubtree: 'sites',
          });

          if (!groupSites || !groupSites.length) {
            return;
          }

          groupSites.forEach((siteId) => sites.push(siteId));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to retrieve group metadata for ', groupAddress);
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }),
    );

    return sites.filter((value, index, list) => list.indexOf(value) === index);
  }

  async redeemCode(email, Token, name){
    try {
      // HERE: Function to check OTP password

      //let client = yield ElvClient.FromConfigurationUrl({configUrl: "https://demov3.net955210.contentfabric.io/config"});
      let client = this.client;
      /*
      const wallet = client.GenerateWallet();

      const signer = wallet.AddAccount({privateKey: "0x06407eef6fa8c78afb550b4e24a88956f1a07b4a74ff76ffaacdacb4187892d6"});

      client.SetSigner({signer});
      */

      this.accessCode = await client.RedeemCode({
        issuer: "/otp/ntp/iten3Ag8TH7xwjyjkvTRqThtsUSSP1pN/QOTPM59kMU5trgj",
        code: Token
      });

      console.log("this.accessCode: ");
      console.log(JQ(this.accessCode));

      if(!this.accessCode) {
        //this.SetError("Invalid code");
        return false;
      }

      //const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      //if (!re.test(String(email).toLowerCase())) {
        //this.SetError("Invalid email");
      //  return false;
      //}
      const letterNumber = /^[0-9a-zA-Z]+$/;
      if (!(name.match(letterNumber))) {
        //this.SetError("Invalid Chat Name");
        return false;
      }

      this.email = email;
      this.name = name;
      let siteId = this.accessCode; ///iq__uwWvF1Wy9EeqWXiRU9bR3zRSJe1

      return siteId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error redeeming code:");
      // eslint-disable-next-line no-console
      console.error(error);

      this.SetError("Invalid code");
      return false;
    }
  }
}
