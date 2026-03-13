class ForumQuestion {
  final String id;
  final String authorId;
  final bool isAnonymous;
  final String title;
  final String content;
  final String topic;
  final DateTime createdAt;
  final bool resolved;

  // Joined fields
  final String? authorName;
  final int answerCount;

  ForumQuestion({
    required this.id,
    required this.authorId,
    required this.isAnonymous,
    required this.title,
    required this.content,
    required this.topic,
    required this.createdAt,
    required this.resolved,
    this.authorName,
    this.answerCount = 0,
  });

  factory ForumQuestion.fromJson(Map<String, dynamic> json) {
    String? name;
    if (json['profiles'] != null && json['profiles'] is Map) {
      name = json['profiles']['full_name'];
    }

    int count = 0;
    if (json['forum_answers'] != null && json['forum_answers'] is List) {
      count = (json['forum_answers'] as List).length;
    } else if (json['forum_answers'] != null && json['forum_answers'] is Map) {
      count = json['forum_answers']['count'] ?? 0;
    }

    return ForumQuestion(
      id: json['id'],
      authorId: json['author_id'],
      isAnonymous: json['is_anonymous'],
      title: json['title'],
      content: json['content'],
      topic: json['topic'],
      createdAt: DateTime.parse(json['created_at']),
      resolved: json['resolved'],
      authorName: name,
      answerCount: count,
    );
  }
}

class ForumAnswer {
  final String id;
  final String questionId;
  final String authorId;
  final bool isAnonymous;
  final String content;
  final bool isBestAnswer;
  final int upvotes;
  final DateTime createdAt;

  // Joined fields
  final String? authorName;

  // Client state
  bool hasUpvoted = false;

  ForumAnswer({
    required this.id,
    required this.questionId,
    required this.authorId,
    required this.isAnonymous,
    required this.content,
    required this.isBestAnswer,
    required this.upvotes,
    required this.createdAt,
    this.authorName,
    this.hasUpvoted = false,
  });

  factory ForumAnswer.fromJson(Map<String, dynamic> json) {
    String? name;
    if (json['profiles'] != null && json['profiles'] is Map) {
      name = json['profiles']['full_name'];
    }

    return ForumAnswer(
      id: json['id'],
      questionId: json['question_id'],
      authorId: json['author_id'],
      isAnonymous: json['is_anonymous'],
      content: json['content'],
      isBestAnswer: json['is_best_answer'],
      upvotes: json['upvotes'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
      authorName: name,
    );
  }
}
