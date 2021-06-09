import {NativeModules} from 'react-native';
const {InAppUtils} = NativeModules;

/* RequestProducts - returns the products to purchase if available from the AppStore

 */
const RequestProducts = async (productIds) => {
  return new Promise((resolve, reject) => {
    console.log('From new RequestProducts!');
    try {
      InAppUtils.loadProducts(productIds, (error, products) => {
          console.log(products);
          //update store here.
          if (error) {
            return reject(error);
          }

          resolve(products);
        });
    } catch (e) {
      reject(e);
    }
  });
};

const RequestPurchase = async (productIds) => {
  return new Promise((resolve, reject) => {
     InAppUtils.canMakePayments((canMakePayments) => {
       if (!canMakePayments) {
         return reject(
                       {error:'This device is not allowed to make purchases. Please check restrictions on device'},
         );
       }

       InAppUtils.purchaseProduct(productId, (error, response) => {
         // NOTE for v3.0: User can cancel the payment which will be available as error object here.
         if (response && response.productIdentifier) {
           if (error) {
             return reject(error);
           }
           resolve(response);
         }
       });
     });
   });
};

export default {
  RequestProducts,
};
