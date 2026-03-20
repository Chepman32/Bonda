#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BondaExportModule, NSObject)

RCT_EXTERN_METHOD(createPdfFromImage:(NSString *)imagePath
                  title:(NSString *)title
                  summaryJson:(NSString *)summaryJson
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createLoopFromImage:(NSString *)imagePath
                  title:(NSString *)title
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
