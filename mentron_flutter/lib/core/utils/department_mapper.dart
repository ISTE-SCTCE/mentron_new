class DepartmentMapper {
  static String getDepartmentFromRoll(String? rollNumber) {
    if (rollNumber == null || rollNumber.isEmpty) return 'Other';
    final r = rollNumber.toUpperCase().trim();

    // MEA must come BEFORE ME to avoid false match
    if (r.contains('MEA') || r.contains('AU') || r.contains('AUTO')) return 'MEA';
    if (r.contains('ME') || r.contains('MECH') || r.contains('MECHANICAL')) return 'ME';
    if (r.contains('CSE') || r.contains('CS') || r.contains('COMPUTER')) return 'CSE';
    if (r.contains('ECE') || r.contains('EC') || r.contains('ELECTRONICS')) return 'ECE';
    if (r.contains('BT') || r.contains('BIO') || r.contains('BIOTECH')) return 'BT';

    return 'Other';
  }

  static const List<Map<String, String>> departments = [
    {'code': 'CSE', 'name': 'Computer Science & Engineering'},
    {'code': 'ECE', 'name': 'Electronics & Communication Engg'},
    {'code': 'ME',  'name': 'Mechanical Engineering'},
    {'code': 'MEA', 'name': 'Automobile Engineering'},
    {'code': 'BT',  'name': 'Bio Technology'},
  ];

  static String getName(String code) {
    return departments.firstWhere(
      (d) => d['code'] == code, 
      orElse: () => {'name': code}
    )['name']!;
  }
}
