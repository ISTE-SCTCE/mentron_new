import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class CreateFolderScreen extends StatefulWidget {
  final String subjectName;
  final String department;
  final String year;
  final String semester;

  const CreateFolderScreen({
    super.key,
    required this.subjectName,
    required this.department,
    required this.year,
    required this.semester,
  });

  @override
  State<CreateFolderScreen> createState() => _CreateFolderScreenState();
}

class _CreateFolderScreenState extends State<CreateFolderScreen> {
  final _nameController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a folder name')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);

    try {
      final user = supabase.currentUser;
      if (user == null) throw Exception('Not logged in');

      // Check if folder with same name already exists for this subject
      final existing = await supabase.client
          .from('note_folders')
          .select('id')
          .eq('subject', widget.subjectName)
          .eq('department', widget.department)
          .eq('year', widget.year)
          .eq('semester', widget.semester)
          .ilike('name', name)
          .maybeSingle();

      if (existing != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.orange,
              content: Text('A folder with this name already exists for this subject.'),
            ),
          );
        }
        return;
      }

      await supabase.client.from('note_folders').insert({
        'name': name,
        'subject': widget.subjectName,
        'department': widget.department,
        'year': widget.year,
        'semester': widget.semester,
        'created_by': user.id,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.green,
            content: Text('📁 Folder "$name" created!'),
          ),
        );
        Navigator.pop(context, true); // return true to signal refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          children: [
            Text('CREATE FOLDER', style: TextStyle(color: AppTheme.accentSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 3)),
            Text('New Folder', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
      body: LiquidBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
          child: Column(
            children: [
              GlassContainer(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Subject badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.accentSecondary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.accentSecondary.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.menu_book_rounded, color: AppTheme.accentSecondary, size: 14),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              widget.subjectName,
                              style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 11, fontWeight: FontWeight.w900),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Folder name label
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8, left: 4),
                      child: Text(
                        'FOLDER NAME',
                        style: TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2),
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: TextField(
                        controller: _nameController,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'e.g. Module 1, Unit 2, Lab Reports...',
                          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(16),
                          prefixIcon: const Icon(Icons.folder_open_rounded, color: AppTheme.accentSecondary, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Notes added to this folder will only appear inside it.',
                      style: TextStyle(color: AppTheme.textMuted.withValues(alpha: 0.6), fontSize: 11),
                    ),
                    const SizedBox(height: 32),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleCreate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentSecondary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20, width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.create_new_folder_rounded, size: 18),
                                SizedBox(width: 8),
                                Text('CREATE FOLDER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                              ],
                            ),
                    ),
                  ],
                ),
              ).animate().fadeIn().slideY(begin: 0.1),
            ],
          ),
        ),
      ),
    );
  }
}
