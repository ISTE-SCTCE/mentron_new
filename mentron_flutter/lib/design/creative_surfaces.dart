import 'package:flutter/material.dart';

/// A shared folded-paper corner for feature cards, sheets and content panels.
/// Circular avatars, QR quiet zones and input hit areas keep their own geometry.
abstract final class StudioCorners {
  static const card = BorderRadius.only(
    topLeft: Radius.circular(6),
    topRight: Radius.circular(24),
    bottomLeft: Radius.circular(24),
    bottomRight: Radius.circular(6),
  );
}
