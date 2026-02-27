import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/compression_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';

class AddNoteScreen extends StatefulWidget {
  const AddNoteScreen({super.key});

  @override
  State<AddNoteScreen> createState() => _AddNoteScreenState();
}

class _AddNoteScreenState extends State<AddNoteScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  String _selectedDept = 'CSE';
  String _selectedYear = '1';
  File? _selectedFile;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _autoFillFromProfile();
  }

  /// Auto-detect dept+year from the user's profile so uploads go to the right group
  Future<void> _autoFillFromProfile() async {
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final user = supabase.currentUser;
      if (user == null) return;
      final profile = await supabase.client
          .from('profiles')
          .select('department, roll_number, year')
          .eq('id', user.id)
          .maybeSingle();
      if (profile != null && mounted) {
        final roll = profile['roll_number'] as String?;
        final detected = DepartmentMapper.getDepartmentFromRoll(roll);
        final dept = detected != 'Other' ? detected : (profile['department'] as String? ?? 'CSE');
        final year = profile['year']?.toString() ?? '1';
        // Only update if valid values
        final validYear = ['1','2','3','4'].contains(year) ? year : '1';
        setState(() {
          _selectedDept = dept;
          _selectedYear = validYear;
        });
      }
    } catch (_) {}
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
    );
    if (result != null) {
      setState(() => _selectedFile = File(result.files.single.path!));
    }
  }

  Future<void> _handleUpload() async {
    if (_titleController.text.isEmpty || _selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title and File are required')));
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final compression = CompressionService();

    try {
      final user = supabase.currentUser;
      if (user == null) throw Exception('Not logged in');

      // 1. Gzip the file for web parity
      final compressedBytes = await compression.gzipCompress(_selectedFile!);
      
      // 2. Upload to storage — match web file path format (no userId prefix)
      final fileName = '${DateTime.now().millisecondsSinceEpoch}-${_selectedFile!.path.split('/').last}.gz';
      
      await supabase.client.storage.from('notes_bucket').uploadBinary(
        fileName,
        compressedBytes,
      );

      // 3. Use same /api/files/ URL pattern that the web app uses (goes through decompression API)
      // For Flutter we get the actual public URL instead since we can't use the web API route
      final fileUrl = supabase.client.storage.from('notes_bucket').getPublicUrl(fileName);

      await supabase.client.from('notes').insert({
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'department': _selectedDept,
        'year': int.parse(_selectedYear),  // DB column is integer
        'file_url': fileUrl,
        'profile_id': user.id,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(backgroundColor: Colors.green, content: Text('Note uploaded successfully!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: Colors.red, content: Text(ErrorHandler.friendly(e))));
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
        title: const Text('CONTRIBUTE NOTE', style: TextStyle(fontSize: 16, letterSpacing: 2, fontWeight: FontWeight.bold)),
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
                    _buildLabel('TITLE'),
                    _buildTextField(_titleController, 'e.g. Data Structures Unit 1'),
                    const SizedBox(height: 20),
                    
                    _buildLabel('DESCRIPTION'),
                    _buildTextField(_descController, 'Brief summary of contents...', maxLines: 3),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('DEPARTMENT'),
                              _buildDeptDropdown(),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('YEAR'),
                              _buildYearDropdown(),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    _buildFilePicker(),
                    const SizedBox(height: 32),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleUpload,
                      child: _isLoading 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                        : const Text('UPLOAD DOCUMENT'),
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
      child: Text(text, style: const TextStyle(color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildDeptDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedDept,
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: (val) => setState(() => _selectedDept = val!),
          items: DepartmentMapper.departments.map((dept) {
            return DropdownMenuItem(value: dept['code'], child: Text(dept['code']!));
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildYearDropdown() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedYear,
          isExpanded: true,
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: (val) => setState(() => _selectedYear = val!),
          items: ['1', '2', '3', '4'].map((year) {
            return DropdownMenuItem(value: year, child: Text('Year $year'));
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildFilePicker() {
    return InkWell(
      onTap: _pickFile,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _selectedFile != null ? AppTheme.accentSecondary : Colors.white.withOpacity(0.1),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          children: [
            Icon(
              _selectedFile != null ? Icons.check_circle_rounded : Icons.cloud_upload_outlined,
              color: _selectedFile != null ? Colors.greenAccent : AppTheme.textMuted,
              size: 32,
            ),
            const SizedBox(height: 12),
            Text(
              _selectedFile != null ? _selectedFile!.path.split('/').last : 'Select Document (PDF/DOC)',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _selectedFile != null ? Colors.white : AppTheme.textMuted,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
