import 'dart:io';
import 'dart:typed_data';
import 'package:archive/archive_io.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';

class CompressionService {
  static final CompressionService _instance = CompressionService._internal();
  factory CompressionService() => _instance;
  CompressionService._internal();

  /// Compresses a file using Gzip.
  /// Matches the 'zlib' Gzip implementation used in the web app.
  Future<Uint8List> gzipCompress(File file) async {
    final bytes = await file.readAsBytes();
    final gzipBytes = GZipEncoder().encode(bytes);
    if (gzipBytes == null) {
      throw Exception('Gzip compression failed');
    }
    return Uint8List.fromList(gzipBytes);
  }

  /// Decompresses a Gzip file.
  Future<Uint8List> gzipDecompress(Uint8List compressedBytes) async {
    final bytes = GZipDecoder().decodeBytes(compressedBytes);
    return Uint8List.fromList(bytes);
  }

  /// Converts an image to WebP format.
  /// Matches the 'sharp' WebP conversion in the web app.
  Future<Uint8List> convertToWebP(File imageFile, {int quality = 80}) async {
    final filePath = imageFile.absolute.path;
    
    // Create a temporary path for the output
    final tempDir = await getTemporaryDirectory();
    final targetPath = '${tempDir.path}/${DateTime.now().millisecondsSinceEpoch}.webp';

    final result = await FlutterImageCompress.compressAndGetFile(
      filePath,
      targetPath,
      format: CompressFormat.webp,
      quality: quality,
    );

    if (result == null) {
      throw Exception('WebP conversion failed');
    }

    final webpBytes = await result.readAsBytes();
    
    // Clean up temporary file
    await File(targetPath).delete();
    
    return webpBytes;
  }

  /// Combined process: Image -> WebP -> Gzip
  /// This mirrors the exact pipeline used for marketplace images on web.
  Future<Uint8List> processImageForMarketplace(File imageFile) async {
    final webpBytes = await convertToWebP(imageFile);
    final gzipBytes = GZipEncoder().encode(webpBytes);
    if (gzipBytes == null) {
      throw Exception('Gzip compression of WebP failed');
    }
    return Uint8List.fromList(gzipBytes);
  }
}
