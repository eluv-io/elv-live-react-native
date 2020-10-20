if (!global.WebAssembly) {
  global.WebAssembly = require('webassemblyjs');
}
import 'react-native-get-random-values';
import '@expo/browser-polyfill';
import {ElvClient} from '../ElvClient-min';

// let loadWebassembly = require('../ElvCrypto');

export default class Fabric {
  async init({configUrl}) {
    /*
    let wasmResult = loadWebassembly();
    wasmResult.onload(() => {
      console.log("ElvCrypto loaded. " + JSON.stringify(wasmResult));
    });

    let wasm = await WebAssembly.instantiate(wasmResult.buffer);
    let ElvCrypto = wasm.instance;
    console.log("ElvCrypto loaded. " + JSON.stringify(ElvCrypto.exports));
*/
    this.client = await ElvClient.FromConfigurationUrl({
      configUrl,
    });

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
}
