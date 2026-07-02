import 'package:flutter/material.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isExecMode = false;
  bool get isExecMode => _isExecMode;

  void setExecMode(bool value) {
    if (_isExecMode != value) {
      _isExecMode = value;
      notifyListeners();
    }
  }
}
