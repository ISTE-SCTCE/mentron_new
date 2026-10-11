import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Checks if byte stream is readable HTML text (as opposed to binary data or image/pdf bytes)
bool isHtmlContent(List<int> bytes) {
  if (bytes.isEmpty) return false;
  // Check for binary image or PDF magic bytes first
  if (bytes.length >= 4 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46) return false; // PDF %PDF
  if (bytes.length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) return false; // JPEG
  if (bytes.length >= 4 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) return false; // PNG
  if (bytes.length >= 12 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46) return false; // WEBP

  int nonPrintable = 0;
  final sampleSize = bytes.length > 512 ? 512 : bytes.length;
  for (int i = 0; i < sampleSize; i++) {
    final b = bytes[i];
    if (b < 9 || (b > 13 && b < 32) || b == 127) {
      nonPrintable++;
    }
  }
  return (nonPrintable / sampleSize) < 0.02;
}

/// Builds an A4 Landscape PDF certificate from a raw background image (JPEG/PNG/WEBP)
/// overlaid with text fields based on `certificate_field_positions` calibrated by admin.
Future<Uint8List> buildImageCertificatePdf({
  required List<int> imageBytes,
  required String studentName,
  required String eventTitle,
  required String dateStr,
  required String certId,
  String coordinatorName = '',
  String chairName = '',
  Map<String, dynamic>? fieldPositions,
}) async {
  final pdf = pw.Document();
  final image = pw.MemoryImage(Uint8List.fromList(imageBytes));

  // Determine exact natural dimensions of template image
  final double imgW = image.width?.toDouble() ?? 841.89;
  final double imgH = image.height?.toDouble() ?? 595.28;

  final fieldValues = <String, String>{
    'student_name': studentName,
    'event_name': eventTitle,
    'event_date': dateStr,
    'certificate_id': certId,
    'coordinator_name': coordinatorName,
    'chair_name': chairName,
  };

  pdf.addPage(
    pw.Page(
      pageFormat: PdfPageFormat(imgW, imgH),
      margin: pw.EdgeInsets.zero,
      build: (pw.Context context) {
        final children = <pw.Widget>[
          pw.FullPage(
            ignoreMargins: true,
            child: pw.Image(image, fit: pw.BoxFit.fill),
          ),
        ];

        if (fieldPositions != null && fieldPositions.isNotEmpty) {
          final double scale = imgW / 841.89;

          fieldPositions.forEach((key, config) {
            final val = fieldValues[key];
            if (val != null && val.isNotEmpty && config is Map) {
              final double rawX = (config['x'] as num?)?.toDouble() ?? (imgW / 2);
              final double rawY = (config['y'] as num?)?.toDouble() ?? (imgH / 2);
              final double fontSize = (config['size'] as num?)?.toDouble() ?? 22.0;
              final String align = (config['align'] as String?) ?? 'center';
              final String colorHex = (config['color'] as String?) ?? '#1B2A4A';

              final double effectiveFontSize = fontSize * (scale > 1.0 ? scale : 1.0);
              final double boxWidth = imgW * 0.75;

              PdfColor pdfColor = PdfColors.black;
              if (colorHex.startsWith('#') && colorHex.length >= 7) {
                final r = int.parse(colorHex.substring(1, 3), radix: 16);
                final g = int.parse(colorHex.substring(3, 5), radix: 16);
                final b = int.parse(colorHex.substring(5, 7), radix: 16);
                pdfColor = PdfColor.fromInt((0xFF << 24) | (r << 16) | (g << 8) | b);
              }

              pw.TextAlign textAlign = pw.TextAlign.center;
              if (align == 'left') textAlign = pw.TextAlign.left;
              if (align == 'right') textAlign = pw.TextAlign.right;

              double leftPos = rawX - (boxWidth / 2);
              if (align == 'left') leftPos = rawX;
              if (align == 'right') leftPos = rawX - boxWidth;

              children.add(
                pw.Positioned(
                  left: leftPos,
                  bottom: rawY,
                  child: pw.SizedBox(
                    width: boxWidth,
                    child: pw.Text(
                      val,
                      textAlign: textAlign,
                      style: pw.TextStyle(
                        fontSize: effectiveFontSize,
                        fontWeight: pw.FontWeight.bold,
                        color: pdfColor,
                      ),
                    ),
                  ),
                ),
              );
            }
          });
        } else {
          // Default positions if calibrator fieldPositions were not configured
          children.addAll([
            pw.Positioned(
              left: imgW * 0.1,
              right: imgW * 0.1,
              top: imgH * 0.42,
              child: pw.Text(
                studentName,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  fontSize: (imgW / 841.89) * 32,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromHex('#1B2A4A'),
                ),
              ),
            ),
            pw.Positioned(
              left: imgW * 0.1,
              right: imgW * 0.1,
              top: imgH * 0.56,
              child: pw.Text(
                eventTitle,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  fontSize: (imgW / 841.89) * 20,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColor.fromHex('#1B2A4A'),
                ),
              ),
            ),
            pw.Positioned(
              left: imgW * 0.1,
              right: imgW * 0.1,
              top: imgH * 0.66,
              child: pw.Text(
                'Date: $dateStr',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  fontSize: (imgW / 841.89) * 13,
                  color: PdfColor.fromHex('#1B2A4A'),
                ),
              ),
            ),
            pw.Positioned(
              left: imgW * 0.1,
              right: imgW * 0.1,
              bottom: imgH * 0.05,
              child: pw.Text(
                'Certificate ID: $certId',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(
                  fontSize: (imgW / 841.89) * 9,
                  color: PdfColor.fromHex('#666666'),
                ),
              ),
            ),
          ]);
        }

        return pw.Stack(children: children);
      },
    ),
  );

  return pdf.save();
}
