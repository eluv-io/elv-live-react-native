//import products from '../testdata/products';
import {JQ} from '../utils';
import * as RNIap from 'react-native-iap';
//import {NativeModules} from 'react-native';
//const {RNStoreKit} = NativeModules;
import * as StoreKit from '../ios/StoreKit';

let purchaseEmitter = null;
let purchaseErrorEmitter = null;
export const initConnection = async (
  purchaseListener,
  purchaseErrorListener,
) => {
  try {
    console.log('InApp initConnection');
    await RNIap.initConnection();
    purchaseEmitter = RNIap.purchaseUpdatedListener(purchaseListener);
    purchaseErrorEmitter = RNIap.purchaseErrorListener(purchaseErrorListener);
    //console.log('******* NATIVEMODULES ', Object.keys(NativeModules));
    //console.log('testing storekit ', RNStoreKit);
    //StoreKit.setBundleIdentifier('live.eluv.io');
  } catch (e) {
    console.error('InApp purchase initConnection error: ', e);
  }
};

export const endConnection = async () => {
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
};

export const loadInAppPurchases = async (productIds) => {
  try {
    console.log('Loading InApp Purchases, ', productIds);

    // Retrieve product details
    let products = await RNIap.getProducts(productIds);
    //console.log('InApp Products: ', products);
    //let products2 = await StoreKit.RequestProducts(productIds);
    //console.log('Products2: ', products2);

    return products;
  } catch (e) {
    console.error('Error loading InApp Purchases', e);
  }
  return null;
};

// returns list of available tickets based on the skus per platform
export const getAvailableTickets = async (site, purchases = null) => {
  //console.log('Site Tickets: ' + JQ(site.info.tickets));

  let productIdToInfo = getAllSiteProductUUIDs(site);
  let products = [];

  if (!purchases) {
    purchases = await loadInAppPurchases(Object.keys(productIdToInfo));
  }

  for (var index in purchases) {
    //console.log('index: ', index);
    var purchase = purchases[index];
    var info = productIdToInfo[purchase.productId];
    //console.log('info: ', info);
    if (!info) {
      continue;
    }
    products.push(info);
  }
  return products;
};

export const getAllSiteProductUUIDs = (site) => {
  //let productIds = ['5SysrEw4RLqkaCwDD7krAz', 'WrS3eNnVwX5Wpf2dPpDk8D'];
  console.log('getAllSiteProductUUIDs');

  let productIds = {};
  try {
    for (var i1 in site.info.tickets) {
      //console.log('tickets index ', i1);
      var ticket = site.info.tickets[i1];
      //console.log('ticket ', ticket);

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
  try {
    console.log('******* InApp.getAvailablePurchases');
    const purchases = await RNIap.getAvailablePurchases();
    //var purchases = null;
    //console.log('Available purchases => ', purchases);
    if (purchases && purchases.length > 0) {
      return purchases;
    }
  } catch (err) {
    console.warn(err.code, err.message);
    console.log('getAvailablePurchases error => ', err);
  }
  return null;
};

//Could throw an error.
export const requestPurchase = async (productId) => {
  console.log('RequestPurchase: ', productId);
  await RNIap.requestPurchase(productId);
};

export default {
  getAvailableTickets,
  getAllSiteProductUUIDs,
  getAvailablePurchases,
  requestPurchase,
  initConnection,
  endConnection,
};
