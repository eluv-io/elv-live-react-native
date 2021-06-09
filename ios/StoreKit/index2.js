import {NativeModules} from 'react-native';
const {RNStoreKit} = NativeModules;

/* RequestProducts - returns the products to purchase if available from the AppStore

 */
const RequestProducts = async (productIds) => {
  return new Promise((resolve, reject) => {
    console.log('From new RequestProducts!');
    try {
      const onProductsReceived = (evt) => {
        console.log('onProductsReceived');
        if (!evt.success) {
          reject(new Error(evt.message));
        } else {
          resolve(evt.products);
        }
      };
      RNStoreKit.requestProducts(productIds, onProductsReceived);
    } catch (e) {
      reject(e);
    }
  });
};

const RequestPurchase = async (productIds) => {
  return new Promise((resolve, reject) => {
    console.log('From new RequestProducts!');
    try {
      const onProductsReceived = (evt) => {
        console.log('onProductsReceived');
        if (!evt.success) {
          reject(new Error(evt.message));
        } else {
          resolve(evt.products);
        }
      };
      RNStoreKit.requestProducts(productIds, onProductsReceived);
    } catch (e) {
      reject(e);
    }
  });
};

export default {
  RequestProducts,
};

