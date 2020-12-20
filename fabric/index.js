if (!global.WebAssembly) {
  global.WebAssembly = require('webassemblyjs');
}
import 'react-native-get-random-values';
import '@expo/browser-polyfill';
import {ElvClient} from '../ElvClient-min';
import {JQ} from '../utils'

const REGEX_EMAIL = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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

  async redeemCode(email, code){
    console.log("Email: " + email + " code: " + code)
    try {
      let client = this.client;

      this.accessCode = await client.RedeemCode({
        email,
        ntpId: "QOTPZsAzK5pU7xe",
        tenantId: "iten3tNEk7iSesexWeD1mGEZLwqHGMjB",
        code
      });

      console.log("this.accessCode: ");
      console.log(JQ(this.accessCode));

      if(!this.accessCode) {
        return false;
      }
      else if (!REGEX_EMAIL.test(String(email).toLowerCase())) {
        return false;
      }

      this.email = email;
      let siteId = this.accessCode;

      return siteId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error redeeming code:");
      // eslint-disable-next-line no-console
      console.error(error);

      return false;
    }
  }
}
