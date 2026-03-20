package com.bonda.export

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BondaExportModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "BondaExportModule"

  @ReactMethod
  fun createPdfFromImage(imagePath: String, title: String, summaryJson: String, promise: Promise) {
    promise.reject(
      "EXPORT_UNSUPPORTED",
      "Advanced PDF exports are currently available on iOS only.",
    )
  }

  @ReactMethod
  fun createLoopFromImage(imagePath: String, title: String, promise: Promise) {
    promise.reject(
      "EXPORT_UNSUPPORTED",
      "Animated loop exports are currently available on iOS only.",
    )
  }
}
