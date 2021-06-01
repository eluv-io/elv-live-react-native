//
//  ProductRequest.m
//
//  Created by Hans Knöchel on 16.04.17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "RNProductRequest.h"
#import "RNProduct.h"
#import <React/RCTConvert.h>

@implementation RNProductRequest

RCT_EXPORT_MODULE()

- (id)initWithProductIdentifiers:(NSSet *)set callback:(RCTResponseSenderBlock)_callback
{
  if ((self = [super init])) {
    request = [[SKProductsRequest alloc] initWithProductIdentifiers:set];
    request.delegate = self;
    callback = _callback;
    
    [request start];
  }
  return self;
}

#pragma mark Public API

RCT_EXPORT_METHOD(cancel)
{
  if (request != nil) {
    [request cancel];
  }
}

#pragma mark Delegates

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
  if(!products){
    products = [NSMutableArray arrayWithCapacity:[[response products]count]];
  }
  
  if([products count] > 0){
    [products removeAllObjects];
  }
  
  for (SKProduct * product in [response products]) {
    //NSLog(@"Found product: %@ – Product: %@ – Price: %0.2f", product.productIdentifier, product.localizedTitle, product.price.floatValue);
    NSLog(@"Found product: %@", product);
    //RNProduct *p = [[RNProduct alloc] initWithProduct:product];
    
    NSDictionary *p = @{ @"productIdentifier" : product.productIdentifier,
                         @"localizedTitle" : product.localizedTitle,
                         @"price" : [NSNumber numberWithFloat:[product.price floatValue]]
                       };
    [products addObject:p];
  }
  
  NSLog(@"GOOD ARRAY: %@", products);
  
  NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
  
  [event setObject:products forKey:@"products"];
  [event setObject:@YES forKey:@"success"];
  
  NSArray *invalid = [response invalidProductIdentifiers];
  if (invalid != nil && [invalid count] > 0) {
    [event setObject:invalid forKey:@"invalid"];
  }

  callback(@[event]);
}

- (void)request:(SKRequest *)request didFailWithError:(NSError *)error
{
    NSLog(@"[ERROR] received error %@", [error localizedDescription]);
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:@NO, @"success", [error localizedDescription], @"message", nil];

    callback(@[event]);
}

@end
