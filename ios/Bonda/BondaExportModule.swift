import AVFoundation
import CoreVideo
import PDFKit
import React
import UIKit

private enum BondaExportError: LocalizedError {
  case sourceImageMissing
  case exportDirectoryUnavailable
  case pdfWriteFailed
  case videoWriterUnavailable
  case pixelBufferUnavailable

  var errorDescription: String? {
    switch self {
    case .sourceImageMissing:
      return "The export source image could not be loaded."
    case .exportDirectoryUnavailable:
      return "The export directory is unavailable."
    case .pdfWriteFailed:
      return "The PDF export could not be written."
    case .videoWriterUnavailable:
      return "The loop export writer could not be configured."
    case .pixelBufferUnavailable:
      return "The loop export buffer could not be created."
    }
  }
}

@objc(BondaExportModule)
class BondaExportModule: NSObject {
  private let exportQueue = DispatchQueue(label: "com.bonda.export")
  private let backgroundColor = UIColor(red: 0.03, green: 0.04, blue: 0.07, alpha: 1)
  private let accentColor = UIColor(red: 0.32, green: 0.38, blue: 1, alpha: 1)
  private let mutedAccentColor = UIColor(red: 0.6, green: 0.52, blue: 1, alpha: 1)
  private let primaryTextColor = UIColor(red: 0.96, green: 0.97, blue: 1, alpha: 1)
  private let secondaryTextColor = UIColor(red: 0.66, green: 0.71, blue: 0.78, alpha: 1)

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(createPdfFromImage:title:summaryJson:resolve:reject:)
  func createPdfFromImage(
    _ imagePath: String,
    title: String,
    summaryJson: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    exportQueue.async {
      do {
        let outputURL = try self.renderPdf(imagePath: imagePath, title: title, summaryJson: summaryJson)
        resolve(outputURL.path)
      } catch {
        reject("EXPORT_PDF_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc(createLoopFromImage:title:resolve:reject:)
  func createLoopFromImage(
    _ imagePath: String,
    title: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    exportQueue.async {
      do {
        try self.renderLoop(imagePath: imagePath, title: title, resolve: resolve, reject: reject)
      } catch {
        reject("EXPORT_LOOP_FAILED", error.localizedDescription, error)
      }
    }
  }

  private func renderPdf(imagePath: String, title: String, summaryJson: String) throws -> URL {
    guard let image = UIImage(contentsOfFile: imagePath) else {
      throw BondaExportError.sourceImageMissing
    }

    let summaryLines = parseSummaryLines(from: summaryJson)
    let outputURL = try makeExportURL(title: title, fileExtension: "pdf")
    let pageBounds = CGRect(x: 0, y: 0, width: 612, height: 792)
    let renderer = UIGraphicsPDFRenderer(bounds: pageBounds)
    let pdfData = renderer.pdfData { context in
      context.beginPage()

      backgroundColor.setFill()
      context.fill(pageBounds)

      let titleAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 30, weight: .bold),
        .foregroundColor: primaryTextColor,
      ]
      let captionAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 13, weight: .medium),
        .foregroundColor: secondaryTextColor,
      ]
      let bodyAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 14, weight: .regular),
        .foregroundColor: primaryTextColor,
      ]

      let haloRect = CGRect(x: 402, y: 42, width: 138, height: 138)
      accentColor.withAlphaComponent(0.32).setFill()
      UIBezierPath(ovalIn: haloRect).fill()

      let titleRect = CGRect(x: 48, y: 52, width: 320, height: 40)
      title.draw(in: titleRect, withAttributes: titleAttributes)

      let subtitle = "Private relationship snapshot"
      subtitle.draw(
        in: CGRect(x: 48, y: 96, width: 240, height: 20),
        withAttributes: captionAttributes
      )

      let imageRect = aspectFitRect(
        for: image.size,
        inside: CGRect(x: 48, y: 144, width: 516, height: 340)
      )
      image.draw(in: imageRect)

      var currentY: CGFloat = 522
      let summaryTitle = "Summary signals"
      summaryTitle.draw(
        in: CGRect(x: 48, y: currentY, width: 240, height: 22),
        withAttributes: [
          .font: UIFont.systemFont(ofSize: 18, weight: .semibold),
          .foregroundColor: primaryTextColor,
        ]
      )
      currentY += 34

      for line in summaryLines.prefix(7) {
        line.draw(
          in: CGRect(x: 48, y: currentY, width: 516, height: 18),
          withAttributes: bodyAttributes
        )
        currentY += 22
      }
    }

    let document = PDFDocument(data: pdfData)
    document?.documentAttributes = [
      PDFDocumentAttribute.titleAttribute: title,
      PDFDocumentAttribute.authorAttribute: "Bonda",
      PDFDocumentAttribute.subjectAttribute: "Private relationship export",
    ]

    guard document?.write(to: outputURL) == true else {
      throw BondaExportError.pdfWriteFailed
    }

    try protectExportFile(at: outputURL)
    return outputURL
  }

  private func renderLoop(
    imagePath: String,
    title: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) throws {
    guard let image = UIImage(contentsOfFile: imagePath) else {
      throw BondaExportError.sourceImageMissing
    }

    let outputURL = try makeExportURL(title: title, fileExtension: "mp4")
    let canvasSize = CGSize(width: 1080, height: 1920)
    let frameImage = renderFrameImage(image: image, title: title, canvasSize: canvasSize)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    let settings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: Int(canvasSize.width),
      AVVideoHeightKey: Int(canvasSize.height),
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 6_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      ],
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: input,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
        kCVPixelBufferWidthKey as String: Int(canvasSize.width),
        kCVPixelBufferHeightKey as String: Int(canvasSize.height),
      ]
    )

    guard writer.canAdd(input) else {
      throw BondaExportError.videoWriterUnavailable
    }

    writer.add(input)

    guard writer.startWriting() else {
      throw writer.error ?? BondaExportError.videoWriterUnavailable
    }

    writer.startSession(atSourceTime: .zero)

    let pixelBuffer = try makePixelBuffer(from: frameImage, canvasSize: canvasSize)
    let totalFrames = 90
    let frameDuration = CMTime(value: 1, timescale: 30)
    var frameIndex = 0

    input.requestMediaDataWhenReady(on: exportQueue) {
      while input.isReadyForMoreMediaData && frameIndex < totalFrames {
        let frameTime = CMTimeMultiply(frameDuration, multiplier: Int32(frameIndex))
        if !adaptor.append(pixelBuffer, withPresentationTime: frameTime) {
          writer.cancelWriting()
          reject(
            "EXPORT_LOOP_FAILED",
            writer.error?.localizedDescription ?? BondaExportError.videoWriterUnavailable.localizedDescription,
            writer.error
          )
          return
        }

        frameIndex += 1
      }

      if frameIndex == totalFrames {
        input.markAsFinished()
        writer.finishWriting {
          if writer.status == .completed {
            do {
              try self.protectExportFile(at: outputURL)
              resolve(outputURL.path)
            } catch {
              reject("EXPORT_LOOP_FAILED", error.localizedDescription, error)
            }
          } else {
            reject(
              "EXPORT_LOOP_FAILED",
              writer.error?.localizedDescription ?? BondaExportError.videoWriterUnavailable.localizedDescription,
              writer.error
            )
          }
        }
      }
    }
  }

  private func renderFrameImage(image: UIImage, title: String, canvasSize: CGSize) -> UIImage {
    let renderer = UIGraphicsImageRenderer(size: canvasSize)

    return renderer.image { context in
      backgroundColor.setFill()
      context.fill(CGRect(origin: .zero, size: canvasSize))

      accentColor.withAlphaComponent(0.26).setFill()
      context.cgContext.fillEllipse(in: CGRect(x: 760, y: 104, width: 220, height: 220))

      mutedAccentColor.withAlphaComponent(0.18).setFill()
      context.cgContext.fillEllipse(in: CGRect(x: 84, y: 1320, width: 180, height: 180))

      let titleAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 52, weight: .bold),
        .foregroundColor: primaryTextColor,
      ]
      let subtitleAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 24, weight: .medium),
        .foregroundColor: secondaryTextColor,
      ]
      let footerAttributes: [NSAttributedString.Key: Any] = [
        .font: UIFont.systemFont(ofSize: 24, weight: .medium),
        .foregroundColor: primaryTextColor,
      ]

      title.draw(in: CGRect(x: 88, y: 112, width: 640, height: 62), withAttributes: titleAttributes)
      "Private relationship loop".draw(
        in: CGRect(x: 88, y: 184, width: 420, height: 32),
        withAttributes: subtitleAttributes
      )

      let imageRect = aspectFitRect(
        for: image.size,
        inside: CGRect(x: 88, y: 280, width: 904, height: 1220)
      )
      image.draw(in: imageRect)

      "Generated on device by Bonda".draw(
        in: CGRect(x: 88, y: 1610, width: 440, height: 32),
        withAttributes: footerAttributes
      )
    }
  }

  private func parseSummaryLines(from summaryJson: String) -> [String] {
    guard
      let data = summaryJson.data(using: .utf8),
      let object = try? JSONSerialization.jsonObject(with: data),
      let dictionary = object as? [String: Any]
    else {
      return []
    }

    return dictionary
      .sorted { $0.key < $1.key }
      .map { key, value in
        let cleanedKey = key
          .replacingOccurrences(of: "_", with: " ")
          .capitalized
        return "\(cleanedKey): \(value)"
      }
  }

  private func aspectFitRect(for imageSize: CGSize, inside container: CGRect) -> CGRect {
    guard imageSize.width > 0, imageSize.height > 0 else {
      return container
    }

    let widthRatio = container.width / imageSize.width
    let heightRatio = container.height / imageSize.height
    let ratio = min(widthRatio, heightRatio)
    let fittedSize = CGSize(width: imageSize.width * ratio, height: imageSize.height * ratio)

    return CGRect(
      x: container.origin.x + (container.width - fittedSize.width) / 2,
      y: container.origin.y + (container.height - fittedSize.height) / 2,
      width: fittedSize.width,
      height: fittedSize.height
    )
  }

  private func makePixelBuffer(from image: UIImage, canvasSize: CGSize) throws -> CVPixelBuffer {
    var pixelBuffer: CVPixelBuffer?
    let attributes: [String: Any] = [
      kCVPixelBufferCGImageCompatibilityKey as String: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
      kCVPixelBufferWidthKey as String: Int(canvasSize.width),
      kCVPixelBufferHeightKey as String: Int(canvasSize.height),
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
    ]

    let status = CVPixelBufferCreate(
      kCFAllocatorDefault,
      Int(canvasSize.width),
      Int(canvasSize.height),
      kCVPixelFormatType_32ARGB,
      attributes as CFDictionary,
      &pixelBuffer
    )

    guard status == kCVReturnSuccess, let pixelBuffer else {
      throw BondaExportError.pixelBufferUnavailable
    }

    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

    guard
      let cgImage = image.cgImage,
      let context = CGContext(
        data: CVPixelBufferGetBaseAddress(pixelBuffer),
        width: Int(canvasSize.width),
        height: Int(canvasSize.height),
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
      )
    else {
      throw BondaExportError.pixelBufferUnavailable
    }

    context.draw(cgImage, in: CGRect(origin: .zero, size: canvasSize))
    return pixelBuffer
  }

  private func makeExportURL(title: String, fileExtension: String) throws -> URL {
    guard let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
      throw BondaExportError.exportDirectoryUnavailable
    }

    let exportDirectory = documentsURL.appendingPathComponent("exports", isDirectory: true)
    try FileManager.default.createDirectory(
      at: exportDirectory,
      withIntermediateDirectories: true,
      attributes: nil
    )

    let sanitizedTitle = title
      .lowercased()
      .replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
      .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    let timestamp = Int(Date().timeIntervalSince1970)
    let fileName = "\(sanitizedTitle.isEmpty ? "bonda-export" : sanitizedTitle)-\(timestamp).\(fileExtension)"
    let outputURL = exportDirectory.appendingPathComponent(fileName)

    if FileManager.default.fileExists(atPath: outputURL.path) {
      try FileManager.default.removeItem(at: outputURL)
    }

    return outputURL
  }

  private func protectExportFile(at url: URL) throws {
    try FileManager.default.setAttributes(
      [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
      ofItemAtPath: url.path
    )
  }
}
