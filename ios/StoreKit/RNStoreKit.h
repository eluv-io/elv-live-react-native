#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "RNProductRequest.h"

@interface RNStoreKit : RCTEventEmitter<RCTBridgeModule, SKRequestDelegate, SKPaymentTransactionObserver> {
    RCTResponseSenderBlock refreshReceiptCallback;
    BOOL transactionObserverSet;
    BOOL autoFinishTransactions;
    BOOL receiptVerificationSandbox;
    NSMutableArray *restoredTransactions;
    NSString *bundleVersion;
    NSString *bundleIdentifier;
    RNProductRequest *request;
}

@end
