//import products from '../testdata/products';
import {JQ} from '../utils';
//import * as RNIap from 'react-native-iap';
import {NativeModules} from 'react-native';
const {InAppUtils} = NativeModules;

//import StoreKit from '../ios/StoreKit/index';

let _purchaseListener = null;
let _purchaseErrorListener = null;
export const initConnection = async (
  purchaseListener,
  purchaseErrorListener,
) => {
  _purchaseListener = purchaseListener;
  _purchaseErrorListener = purchaseErrorListener;
  console.log('InAppUtils: ', InAppUtils);
};

export const endConnection = async () => {
  /*
  try {
    if (purchaseEmitter) {
      purchaseEmitter.remove();
    }
    if (purchaseErrorEmitter) {
      purchaseErrorEmitter.remove();
    }
    await RNIap.endConnection();
  } catch (e) {
    console.error('InApp purchase endConnection error: ', e);
  }
  */
};

export const loadInAppPurchases = async (productIds) => {
  console.log('Loading InApp Purchases, ', productIds);

  return new Promise((resolve, reject) => {
    InAppUtils.loadProducts(productIds, (error, products) => {
      //update store here.
      if (error) {
        return reject(error);
      }

      resolve(products);
    });
  });

  /*let products = await StoreKit.RequestProducts(productIds);
  console.log('Products returned: ', products);
  return products; */
};

// returns list of available tickets based on the skus per platform
export const getAvailableTickets = async (site, purchases = null) => {
  //console.log('Site Tickets: ' + JQ(site.info.tickets));

  let productIdToInfo = getAllSiteProductUUIDs(site);
  let products = [];

  if (!purchases) {
    purchases = await loadInAppPurchases(Object.keys(productIdToInfo));
  }

  console.log('getAvailableTickets products: ', products);

  for (var index = 0; index < purchases.length; index++) {
    //console.log('index: ', index);
    var purchase = purchases[index];
    console.log('purchase: ', purchase);
    var info = productIdToInfo[purchase.identifier];
    console.log('info: ', info);
    if (!info) {
      continue;
    }
    if (purchase.price !== undefined && purchase.price !== null) {
      info.price = purchase.priceString;
    }

    products.push(info);
  }
  return products;
};

export const getAllSiteProductUUIDs = (site) => {
  console.log('getAllSiteProductUUIDs');

  let productIds = {};
  try {
    for (var i1 in site.info.tickets) {
      //console.log('tickets index ', i1);
      var ticket = site.info.tickets[i1];
      console.log('ticket ', ticket);

      for (var i2 in ticket.skus) {
        var sku = ticket.skus[i2];
        var info = {};
        info.title = ticket.name;
        info.description = ticket.description;
        info.image = ticket.image;
        info.price = sku.price.USD;
        info.start_time = sku.start_time;
        info.id = sku.uuid;
        productIds[info.id] = info;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return productIds;
};

export const getAvailablePurchases = async () => {
  return new Promise((resolve, reject) => {
    InAppUtils.restorePurchases((error, response) => {
      console.log('IAP restorePurchases called error', error);
      console.log('IAP restorePurchases called response', response);
      if (error) {
        return reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

//Could throw an error.
export const requestPurchase = async (productId) => {
  console.log('RequestPurchase: ', productId);
  //await RNIap.requestPurchase(productId, false);

  return new Promise((resolve, reject) => {
    InAppUtils.canMakePayments((canMakePayments) => {
      if (!canMakePayments) {
        return reject(
          'This device is not allowed to make purchases. Please check restrictions on device',
        );
      }

      InAppUtils.purchaseProduct(productId, (error, response) => {
        // NOTE for v3.0: User can cancel the payment which will be available as error object here.
        console.log('purchaseProduct response ', error);
        if (error) {
          if (_purchaseErrorListener) {
            _purchaseErrorListener(error);
          }
          return;
        }
        if (response && response.productIdentifier) {
          if (_purchaseListener) {
            _purchaseListener(response);
          }
        }
      });
    });
    resolve();
  });
};

export default {
  getAvailableTickets,
  getAllSiteProductUUIDs,
  getAvailablePurchases,
  requestPurchase,
  initConnection,
  endConnection,
};
