class Project {
  final String id;
  final String title;
  final String description;
  final String role;
  final String duration;
  final String category;
  final String status;
  final DateTime createdAt;
  final String? profileId;

  Project({
    required this.id,
    required this.title,
    required this.description,
    required this.role,
    required this.duration,
    required this.category,
    required this.status,
    required this.createdAt,
    this.profileId,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      role: json['role'] ?? '',
      duration: json['duration'] ?? '',
      category: json['category'] ?? 'General',
      status: json['status'] ?? 'open',
      createdAt: DateTime.parse(json['created_at']),
      profileId: json['profile_id'],
    );
  }
}

class ProjectApplication {
  final String id;
  final String projectId;
  final String profileId;
  final String cvUrl;
  final String status;
  final DateTime createdAt;

  ProjectApplication({
    required this.id,
    required this.projectId,
    required this.profileId,
    required this.cvUrl,
    required this.status,
    required this.createdAt,
  });

  factory ProjectApplication.fromJson(Map<String, dynamic> json) {
    return ProjectApplication(
      id: json['id'],
      projectId: json['project_id'],
      profileId: json['profile_id'],
      cvUrl: json['cv_url'],
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
