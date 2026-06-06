import 'package:flutter/foundation.dart';

class AcademicService {
  /// Calculates the current semester based on the admission year and month,
  /// assuming the academic year begins in August and follows a KTU-style
  /// 8-semester cycle.
  /// 
  /// - [admissionYear]: The year the student was admitted (e.g., 2025).
  /// - [admissionMonth]: The month the student was admitted (default 8).
  int calculateCurrentSemester(int admissionYear, int admissionMonth) {
    final now = DateTime.now();
    int currentYear = now.year;
    int currentMonth = now.month;

    int yearsDifference = currentYear - admissionYear;
    
    // Base semester for the current academic year cycle starting in August
    int semester = (yearsDifference * 2) + 1;

    // If we are before August, we are in the even semester of the previous academic year
    if (currentMonth < 8) {
      semester -= 1; 
    }

    // Clamp semester between 1 and 8
    if (semester < 1) semester = 1;
    if (semester > 8) semester = 8;
    
    return semester;
  }

  /// Calculates the current academic year (1, 2, 3, or 4) based on admission date.
  int calculateCurrentYear(int admissionYear, int admissionMonth) {
    final sem = calculateCurrentSemester(admissionYear, admissionMonth);
    return ((sem - 1) ~/ 2) + 1;
  }
}
