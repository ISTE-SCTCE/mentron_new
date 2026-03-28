import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../../shared/widgets/liquid_background.dart';
import '../../../data/models/note_model.dart';
import 'note_list_screen.dart';
import '../../../core/utils/app_transitions.dart';
import 'add_note_screen.dart';

class SubjectsScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final List<String> subjects;
  final Color color;
  final int year;
  final String dept;

  const SubjectsScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.subjects,
    required this.color,
    required this.year,
    required this.dept,
  });

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  List<Note> _notes = [];
  bool _loadingNotes = true;

  @override
  void initState() {
    super.initState();
    _fetchNotes();
  }

  Future<void> _fetchNotes() async {
    final supabase = Provider.of<SupabaseService>(context, listen: false).client;
    try {
      final response = await supabase
          .from('notes')
          .select('*, profiles!notes_created_by_fkey(full_name)')
          .ilike('department', '%${widget.dept}%')
          .order('created_at', ascending: false);
      final allNotes = (response as List).map((j) => Note.fromJson(j)).toList();
      final filtered = allNotes.where((n) => n.year == widget.year.toString()).toList();
      if (mounted) setState(() { _notes = filtered; _loadingNotes = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingNotes = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(children: [
          Text(widget.title, style: TextStyle(color: widget.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
          Text(widget.subtitle, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
        ]),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: TextButton.icon(
              onPressed: () => Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen())),
              icon: Icon(Icons.add_rounded, color: widget.color, size: 18),
              label: Text('Add', style: TextStyle(color: widget.color, fontWeight: FontWeight.w900, fontSize: 11)),
            ),
          ),
        ],
      ),
      body: LiquidBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 120, 24, 40),
          children: [
            // Subject list
            Text('SUBJECTS', style: TextStyle(color: widget.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 3)),
            const SizedBox(height: 12),
            if (widget.subjects.isEmpty)
              const Text('No subjects data.', style: TextStyle(color: AppTheme.textMuted))
            else
              ...List.generate(widget.subjects.length, (i) {
                final subject = widget.subjects[i];
                final isElective = subject.startsWith('Electives:');
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(14),
                    border: Border.all(color: widget.color.withOpacity(isElective ? 0.1 : 0.15)),
                    child: isElective
                        ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('OPEN ELECTIVES (choose one)', style: TextStyle(color: widget.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8, runSpacing: 6,
                              children: subject.replaceFirst('Electives: ', '').split(', ').map((e) =>
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: widget.color.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: widget.color.withOpacity(0.2)),
                                  ),
                                  child: Text(e, style: TextStyle(color: widget.color, fontSize: 10, fontWeight: FontWeight.w600)),
                                ),
                              ).toList(),
                            ),
                          ])
                        : Row(children: [
                            Container(
                              width: 28, height: 28,
                              decoration: BoxDecoration(
                                color: widget.color.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(child: Text('${i + 1}', style: TextStyle(color: widget.color, fontSize: 10, fontWeight: FontWeight.w900))),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(subject, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3))),
                          ]),
                  ).animate().fadeIn(delay: (i * 40).ms),
                );
              }),

            const SizedBox(height: 32),

            // Uploaded notes
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('UPLOADED NOTES', style: TextStyle(color: widget.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 3)),
              if (!_loadingNotes && _notes.isNotEmpty)
                Text('${_notes.length} notes', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
            ]),
            const SizedBox(height: 12),
            if (_loadingNotes)
              const Center(child: CircularProgressIndicator(color: AppTheme.accentSecondary))
            else if (_notes.isEmpty)
              GlassContainer(
                padding: const EdgeInsets.all(32),
                child: Column(children: [
                  const Text('📭', style: TextStyle(fontSize: 32)),
                  const SizedBox(height: 12),
                  const Text('No notes yet', style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.push(context, AppTransitions.slideUp(const AddNoteScreen())),
                    child: Text('Be the first to contribute →', style: TextStyle(color: widget.color, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ]),
              )
            else
              ...List.generate(_notes.length, (i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GlassContainer(
                  padding: const EdgeInsets.all(18),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_notes[i].title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text(_notes[i].description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    const SizedBox(height: 14),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(_notes[i].uploaderName ?? 'Student', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
                      GestureDetector(
                        onTap: () => Navigator.push(context, AppTransitions.slideUp(NoteListScreen(deptCode: widget.dept, year: widget.year.toString()))),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(color: widget.color.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: widget.color.withOpacity(0.25))),
                          child: Text('OPEN', style: TextStyle(color: widget.color, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                        ),
                      ),
                    ]),
                  ]),
                ).animate().fadeIn(delay: (i * 60).ms),
              )),
          ],
        ),
      ),
    );
  }
}
