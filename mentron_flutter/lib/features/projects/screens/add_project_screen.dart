import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class AddProjectScreen extends StatefulWidget {
  const AddProjectScreen({super.key});

  @override
  State<AddProjectScreen> createState() => _AddProjectScreenState();
}

class _AddProjectScreenState extends State<AddProjectScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _roleController = TextEditingController();
  final _durationController = TextEditingController();
  String _selectedCategory = 'Web Development';
  bool _isLoading = false;

  final List<String> _categories = [
    'Web Development',
    'Mobile Development',
    'AI / ML',
    'UI/UX Design',
    'Content & Marketing',
    'Other',
  ];

  Future<void> _handleCreate() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project title is required')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);

    try {
      final user = supabase.currentUser;
      if (user == null) throw Exception('Not logged in');

      await supabase.client.from('pending_projects').insert({
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'role': _roleController.text.trim().isEmpty ? 'Open' : _roleController.text.trim(),
        'duration': _durationController.text.trim().isEmpty ? 'Flexible' : _durationController.text.trim(),
        'category': _selectedCategory,
        'posted_by': user.id,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.amber,
            content: Text(
              '📋 Project submitted for review! Execom will approve it shortly.',
            ),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text(ErrorHandler.friendly(e)),
          ),
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
        title: const Text(
          'POST PROJECT',
          style: TextStyle(
            fontSize: 16,
            letterSpacing: 2,
            fontWeight: FontWeight.bold,
          ),
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
                    _buildLabel('PROJECT TITLE'),
                    _buildTextField(
                      _titleController,
                      'e.g. AI Research Dashboard',
                    ),
                    const SizedBox(height: 20),

                    _buildLabel('CATEGORY'),
                    _buildCategoryDropdown(),
                    const SizedBox(height: 20),

                    _buildLabel('ROLE REQUIRED'),
                    _buildTextField(
                      _roleController,
                      'e.g. Frontend Developer, Researcher',
                    ),
                    const SizedBox(height: 20),

                    _buildLabel('DURATION'),
                    _buildTextField(
                      _durationController,
                      'e.g. 2 Months, Flexible',
                    ),
                    const SizedBox(height: 20),

                    _buildLabel('DESCRIPTION'),
                    _buildTextField(
                      _descController,
                      'Describe the project mission, skills needed, deliverables...',
                      maxLines: 5,
                    ),
                    const SizedBox(height: 32),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleCreate,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text('POST PROJECT'),
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

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text,
        style: const TextStyle(
          color: AppTheme.accentPrimary,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 2,
        ),
      ),
    );
  }

  Widget _buildCategoryDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFBF9FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.accentPrimary.withValues(alpha: 0.12),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCategory,
          dropdownColor: AppTheme.surfaceColor,
          isExpanded: true,
          icon: const Icon(
            Icons.arrow_drop_down_rounded,
            color: AppTheme.textMuted,
          ),
          style: const TextStyle(
            color: AppTheme.textMain,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
          items: _categories.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value),
            );
          }).toList(),
          onChanged: (newValue) {
            if (newValue != null) {
              setState(() => _selectedCategory = newValue);
            }
          },
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint, {
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFBF9FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.accentPrimary.withValues(alpha: 0.12),
        ),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        cursorColor: AppTheme.accentPrimary,
        style: const TextStyle(
          color: AppTheme.textMain,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(
            color: AppTheme.textMuted.withValues(alpha: 0.70),
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }
}
