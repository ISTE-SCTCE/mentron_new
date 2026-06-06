import 'package:flutter/foundation.dart';
import '../services/academic_service.dart';
class AcademicProvider extends ChangeNotifier {
  int currentSemester = 1;
  int currentAcademicYear = 1;
  bool isInitialized = false;

  final AcademicService _academicService = AcademicService();

  void initialize(int admissionYear, int admissionMonth) {
    currentSemester = _academicService.calculateCurrentSemester(admissionYear, admissionMonth);
    currentAcademicYear = _academicService.calculateCurrentYear(admissionYear, admissionMonth);
    isInitialized = true;
    notifyListeners();
  }
}
