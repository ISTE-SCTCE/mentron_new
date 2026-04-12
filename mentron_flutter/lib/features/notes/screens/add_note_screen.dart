import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:http/http.dart' as http;
import '../../../core/services/supabase_service.dart';
import '../../../core/services/compression_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/department_mapper.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../core/utils/error_handler.dart';
import '../../../data/models/subject_data.dart';

class AddNoteScreen extends StatefulWidget {
  const AddNoteScreen({super.key});

  @override
  State<AddNoteScreen> createState() => _AddNoteScreenState();
}

class _AddNoteScreenState extends State<AddNoteScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();

  String _selectedYear = '1';
  String _selectedSem = '';
  String _selectedDeptOrGroup = 'CSE';
  String _selectedSubject = '';
  String? _selectedFolderId;
  String? _selectedFolderName;

  File? _selectedFile;
  bool _isLoading = false;
  List<Map<String, dynamic>> _availableFolders = [];
  bool _loadingFolders = false;

  bool get _isFirstYear => _selectedYear == '1';

  List<String> get _semOptions => SubjectData.semsForYear(int.parse(_selectedYear));

  List<String> get _subjectOptions {
    if (_selectedSem.isEmpty || _selectedDeptOrGroup.isEmpty) return [];
    List<String> rawSubjects = [];
    if (_isFirstYear) {
      rawSubjects = SubjectData.getFirstYearSubjects(_selectedDeptOrGroup, _selectedSem)
          .where((s) => !s.startsWith('Electives:')).toList();
    } else {
      rawSubjects = SubjectData.getSubjects(_selectedDeptOrGroup, _selectedSem)
          .where((s) => !s.startsWith('Electives:') && !s.startsWith('— Electives:')).toList();
    }

    List<String> expanded = [];
    for (var s in rawSubjects) {
      expanded.add(s);
      expanded.add('PYQ - $s');
      expanded.add('Video - $s');
    }
    return expanded;
  }

  @override
  void initState() {
    super.initState();
    _checkPermission();
    _autoFillFromProfile();
  }

  Future<void> _checkPermission() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false);
    final isLeadership = await supabase.isLeadershipPosition();
    final perms = await supabase.getPermissions();

    if (!isLeadership && perms['can_upload_notes'] != true) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.red,
            content: Text('Access Restricted: You do not have permission to upload notes.'),
          ),
        );
        Navigator.pop(context);
      }
    }
  }

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
        final validYear = ['1', '2', '3', '4'].contains(year) ? year : '1';

        final sems = SubjectData.semsForYear(int.parse(validYear));
        final sem = sems.isNotEmpty ? sems.first : '';

        final deptOrGroup = validYear == '1'
            ? SubjectData.getGroupFromDepartment(dept)
            : dept;

        setState(() {
          _selectedYear = validYear;
          _selectedDeptOrGroup = deptOrGroup;
          _selectedSem = sem;
          _selectedSubject = '';
          _selectedFolderId = null;
          _selectedFolderName = null;
        });
      }
    } catch (_) {}
  }

  Future<void> _loadFoldersForSubject() async {
    if (_selectedSubject.isEmpty) {
      setState(() { _availableFolders = []; _selectedFolderId = null; _selectedFolderName = null; });
      return;
    }
    // Only load folders for non-virtual subjects
    if (_selectedSubject.startsWith('PYQ - ') || _selectedSubject.startsWith('Video - ')) {
      setState(() { _availableFolders = []; _selectedFolderId = null; _selectedFolderName = null; });
      return;
    }

    setState(() => _loadingFolders = true);
    try {
      final supabase = Provider.of<SupabaseService>(context, listen: false);
      final response = await supabase.client
          .from('note_folders')
          .select('id, name')
          .eq('subject', _selectedSubject)
          .eq('department', _selectedDeptOrGroup)
          .eq('year', _selectedYear)
          .eq('semester', _selectedSem)
          .order('created_at', ascending: true);

      if (mounted) {
        setState(() {
          _availableFolders = List<Map<String, dynamic>>.from(response);
          _selectedFolderId = null;
          _selectedFolderName = null;
          _loadingFolders = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingFolders = false);
    }
  }

  Future<void> _pickFile() async {
    final bool isVideoType = _selectedSubject.startsWith('Video - ');
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: isVideoType
        ? ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'mov', 'avi', 'mkv']
        : ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
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
    if (_selectedSem.isEmpty || _selectedSubject.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a semester and subject')));
      return;
    }

    setState(() => _isLoading = true);
    final supabase = Provider.of<SupabaseService>(context, listen: false);

    try {
      final user = supabase.currentUser;
      if (user == null) throw Exception('Not logged in');

      const String apiBaseUrl = 'http://10.0.2.2:3000';
      final uri = Uri.parse('$apiBaseUrl/api/notes/upload');
      final request = http.MultipartRequest('POST', uri);

      request.fields['title'] = _titleController.text.trim();
      request.fields['description'] = _descController.text.trim();
      request.fields['department'] = _selectedDeptOrGroup;
      request.fields['year'] = _selectedYear;
      request.fields['semester'] = _selectedSem;
      request.fields['subject'] = _selectedSubject;
      if (_selectedFolderId != null) {
        request.fields['folder_id'] = _selectedFolderId!;
      }

      request.files.add(await http.MultipartFile.fromPath('file', _selectedFile!.path));

      final response = await request.send();
      final responseData = await response.stream.bytesToString();

      if (response.statusCode >= 400) {
        throw Exception('Server Error: $responseData');
      }

      if (mounted) {
        final folderMsg = _selectedFolderName != null ? ' in "$_selectedFolderName"' : '';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.green,
          content: Text('✅ Note successfully published$folderMsg!'),
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          backgroundColor: Colors.red,
          content: Text(ErrorHandler.friendly(e)),
        ));
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
        title: const Text('CONTRIBUTE NOTE',
            style: TextStyle(fontSize: 16, letterSpacing: 2, fontWeight: FontWeight.bold)),
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

                    // Year + Semester row
                    Row(
                      children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _buildLabel('YEAR'),
                            _buildDropdown(
                              value: _selectedYear,
                              items: ['1', '2', '3', '4'],
                              labelBuilder: (y) => 'Year $y',
                              onChanged: (val) {
                                final sems = SubjectData.semsForYear(int.parse(val));
                                setState(() {
                                  _selectedYear = val;
                                  _selectedSem = sems.isNotEmpty ? sems.first : '';
                                  _selectedSubject = '';
                                  _selectedDeptOrGroup = val == '1' ? 'A' : 'CSE';
                                  _availableFolders = [];
                                  _selectedFolderId = null;
                                  _selectedFolderName = null;
                                });
                              },
                            ),
                          ]),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _buildLabel('SEMESTER'),
                            _buildDropdown(
                              value: _selectedSem.isEmpty ? null : _selectedSem,
                              items: _semOptions,
                              labelBuilder: (s) => s,
                              onChanged: (val) => setState(() {
                                _selectedSem = val;
                                _selectedSubject = '';
                                _availableFolders = [];
                                _selectedFolderId = null;
                                _selectedFolderName = null;
                              }),
                            ),
                          ]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Group (Y1) or Department (Y2-4)
                    _buildLabel(_isFirstYear ? 'STREAM GROUP' : 'DEPARTMENT'),
                    _isFirstYear
                        ? _buildDropdown(
                            value: _selectedDeptOrGroup,
                            items: const ['A', 'B', 'C', 'D'],
                            labelBuilder: (g) {
                              const labels = {
                                'A': 'Group A — CS/IT',
                                'B': 'Group B — EEE/ECE',
                                'C': 'Group C — Mech/Civil',
                                'D': 'Group D — Biotech',
                              };
                              return labels[g] ?? 'Group $g';
                            },
                            onChanged: (val) => setState(() {
                              _selectedDeptOrGroup = val;
                              _selectedSubject = '';
                              _availableFolders = [];
                              _selectedFolderId = null;
                              _selectedFolderName = null;
                            }),
                          )
                        : _buildDropdown(
                            value: _selectedDeptOrGroup,
                            items: const ['CSE', 'ECE', 'ME', 'MEA', 'BT'],
                            labelBuilder: (d) {
                              const labels = {
                                'CSE': 'Computer Science',
                                'ECE': 'Electronics & Comm',
                                'ME':  'Mechanical Engg',
                                'MEA': 'Automobile Engg',
                                'BT':  'Biotechnology',
                              };
                              return labels[d] ?? d;
                            },
                            onChanged: (val) => setState(() {
                              _selectedDeptOrGroup = val;
                              _selectedSubject = '';
                              _availableFolders = [];
                              _selectedFolderId = null;
                              _selectedFolderName = null;
                            }),
                          ),
                    const SizedBox(height: 20),

                    // Subject dropdown
                    if (_subjectOptions.isNotEmpty) ...[
                      _buildLabel('SUBJECT'),
                      _buildDropdown(
                        value: _selectedSubject.isEmpty ? null : _selectedSubject,
                        items: _subjectOptions,
                        labelBuilder: (s) => s,
                        onChanged: (val) {
                          setState(() => _selectedSubject = val);
                          _loadFoldersForSubject();
                        },
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Folder dropdown (optional) - shown when subject is selected and has folders
                    if (_selectedSubject.isNotEmpty &&
                        !_selectedSubject.startsWith('PYQ - ') &&
                        !_selectedSubject.startsWith('Video - ')) ...[
                      _buildLabel('FOLDER (OPTIONAL)'),
                      if (_loadingFolders)
                        Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: const Center(
                            child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.accentSecondary)),
                          ),
                        )
                      else if (_availableFolders.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.folder_off_outlined, color: AppTheme.textMuted, size: 16),
                              const SizedBox(width: 10),
                              Text(
                                'No folders created for this subject yet',
                                style: TextStyle(color: AppTheme.textMuted.withValues(alpha: 0.6), fontSize: 12),
                              ),
                            ],
                          ),
                        )
                      else
                        _buildDropdownNullable(
                          value: _selectedFolderId,
                          items: [null, ..._availableFolders.map((f) => f['id'] as String)],
                          labelBuilder: (id) {
                            if (id == null) return 'No folder (subject root)';
                            final folder = _availableFolders.firstWhere((f) => f['id'] == id, orElse: () => {});
                            return '📁 ${folder['name'] ?? id}';
                          },
                          onChanged: (val) {
                            setState(() {
                              _selectedFolderId = val;
                              _selectedFolderName = val == null
                                  ? null
                                  : (_availableFolders.firstWhere((f) => f['id'] == val, orElse: () => {})['name'] as String?);
                            });
                          },
                        ),
                      const SizedBox(height: 20),
                    ],

                    _buildFilePicker(),
                    const SizedBox(height: 32),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleUpload,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20, width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
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
      child: Text(text,
          style: const TextStyle(
              color: AppTheme.accentSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<String> items,
    required String Function(String) labelBuilder,
    required void Function(String) onChanged,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.surfaceColor,
          hint: Text('Select', style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 14)),
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: (val) { if (val != null) onChanged(val); },
          items: items.map((item) => DropdownMenuItem(
            value: item,
            child: Text(labelBuilder(item), overflow: TextOverflow.ellipsis),
          )).toList(),
        ),
      ),
    );
  }

  Widget _buildDropdownNullable({
    required String? value,
    required List<String?> items,
    required String Function(String?) labelBuilder,
    required void Function(String?) onChanged,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String?>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.surfaceColor,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          onChanged: onChanged,
          items: items.map((item) => DropdownMenuItem<String?>(
            value: item,
            child: Text(labelBuilder(item), overflow: TextOverflow.ellipsis),
          )).toList(),
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
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _selectedFile != null ? AppTheme.accentSecondary : Colors.white.withValues(alpha: 0.1),
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
