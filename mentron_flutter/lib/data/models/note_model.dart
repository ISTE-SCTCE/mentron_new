class Note {
  final String id;
  final String title;
  final String description;
  final String department;
  final String year;
  final String fileUrl;
  final String? profileId;
  final DateTime createdAt;
  final String? uploaderName;

  Note({
    required this.id,
    required this.title,
    required this.description,
    required this.department,
    required this.year,
    required this.fileUrl,
    required this.profileId,
    required this.createdAt,
    this.uploaderName,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    return Note(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? 'No description.',
      department: json['department'],
      year: json['year'].toString(),
      fileUrl: json['file_url'],
      profileId: json['profile_id'],
      createdAt: DateTime.parse(json['created_at']),
      uploaderName: json['profiles']?['full_name'],
    );
  }
}
