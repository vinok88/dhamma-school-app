import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/date_utils.dart';
import '../../providers/auth_provider.dart';
import '../../services/supabase_service.dart';
import '../../widgets/loading_overlay.dart';

enum ReportType { daily, weekly, monthly }

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  ReportType _reportType = ReportType.weekly;
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 7));
  DateTime _endDate = DateTime.now();
  String? _selectedClassId;
  List<Map<String, dynamic>> _reportData = [];
  bool _isLoading = false;
  bool _isExporting = false;

  Future<void> _loadReport() async {
    final schoolId = ref.read(currentSchoolIdProvider);
    if (schoolId == null) return;

    setState(() => _isLoading = true);
    try {
      final startStr = AppDateUtils.toIsoDate(_startDate);
      final endStr = AppDateUtils.toIsoDate(_endDate);

      var query = SupabaseService.instance.attendanceRecords
          .select(
              'student_id, session_date, status, students(first_name, last_name, class_id, classes(name))')
          .eq('school_id', schoolId)
          .gte('session_date', startStr)
          .lte('session_date', endStr);

      if (_selectedClassId != null) {
        query = query.eq('class_id', _selectedClassId!);
      }

      final records = await query.order('session_date');

      // Aggregate by student
      final Map<String, Map<String, dynamic>> byStudent = {};
      for (final r in records) {
        final studentId = r['student_id'] as String;
        final studentData = r['students'] as Map<String, dynamic>?;
        final status = r['status'] as String;
        final isPresent = status != 'absent';

        if (!byStudent.containsKey(studentId)) {
          byStudent[studentId] = {
            'name':
                '${studentData?['first_name']} ${studentData?['last_name']}',
            'class': (studentData?['classes'] as Map?)?.['name'] ?? 'N/A',
            'attended': 0,
            'total': 0,
          };
        }
        byStudent[studentId]!['total'] =
            (byStudent[studentId]!['total'] as int) + 1;
        if (isPresent) {
          byStudent[studentId]!['attended'] =
              (byStudent[studentId]!['attended'] as int) + 1;
        }
      }

      setState(() {
        _reportData = byStudent.entries
            .map((e) => {
                  'name': e.value['name'],
                  'class': e.value['class'],
                  'attended': e.value['attended'],
                  'total': e.value['total'],
                  'percentage': e.value['total'] > 0
                      ? ((e.value['attended'] / e.value['total']) * 100)
                          .toStringAsFixed(1)
                      : '0.0',
                })
            .toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _exportCsv() async {
    setState(() => _isExporting = true);
    try {
      final rows = [
        ['Name', 'Class', 'Sessions Attended', 'Total Sessions', 'Attendance %'],
        ..._reportData.map((r) => [
              r['name'],
              r['class'],
              r['attended'].toString(),
              r['total'].toString(),
              '${r['percentage']}%',
            ]),
      ];

      final csv = const ListToCsvConverter().convert(rows);
      final dir = await getTemporaryDirectory();
      final file = File(
          '${dir.path}/attendance_report_${DateTime.now().millisecondsSinceEpoch}.csv');
      await file.writeAsString(csv);

      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'Dhamma School Attendance Report',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: ${e.toString()}'),
            backgroundColor: AppColors.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingStack(
      isLoading: _isExporting,
      message: 'Preparing CSV...',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Attendance Reports', style: AppTextStyles.displayLarge),
            const SizedBox(height: 20),

            // Report type selector
            SegmentedButton<ReportType>(
              segments: const [
                ButtonSegment(value: ReportType.daily, label: Text('Daily')),
                ButtonSegment(value: ReportType.weekly, label: Text('Weekly')),
                ButtonSegment(
                    value: ReportType.monthly, label: Text('Monthly')),
              ],
              selected: {_reportType},
              onSelectionChanged: (selection) {
                setState(() {
                  _reportType = selection.first;
                  switch (_reportType) {
                    case ReportType.daily:
                      _startDate = DateTime.now();
                      _endDate = DateTime.now();
                      break;
                    case ReportType.weekly:
                      _startDate = DateTime.now()
                          .subtract(const Duration(days: 7));
                      _endDate = DateTime.now();
                      break;
                    case ReportType.monthly:
                      _startDate = DateTime(
                          DateTime.now().year, DateTime.now().month, 1);
                      _endDate = DateTime.now();
                      break;
                  }
                });
              },
            ),

            const SizedBox(height: 16),

            // Date range
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _startDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (d != null) setState(() => _startDate = d);
                    },
                    icon: const Icon(Icons.calendar_today_outlined, size: 16),
                    label: Text(
                        'From: ${AppDateUtils.formatDate(_startDate)}',
                        style: AppTextStyles.bodySmall),
                    style: OutlinedButton.styleFrom(
                        alignment: Alignment.centerLeft),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _endDate,
                        firstDate: _startDate,
                        lastDate: DateTime.now(),
                      );
                      if (d != null) setState(() => _endDate = d);
                    },
                    icon: const Icon(Icons.calendar_today_outlined, size: 16),
                    label: Text(
                        'To: ${AppDateUtils.formatDate(_endDate)}',
                        style: AppTextStyles.bodySmall),
                    style: OutlinedButton.styleFrom(
                        alignment: Alignment.centerLeft),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _isLoading ? null : _loadReport,
                    icon: _isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.search),
                    label: const Text('Generate Report'),
                  ),
                ),
                if (_reportData.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: _exportCsv,
                    icon: const Icon(Icons.download, size: 16),
                    label: const Text('Export CSV'),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 20),

            // Results table
            if (_reportData.isNotEmpty) ...[
              Text(
                'Results: ${_reportData.length} students',
                style: AppTextStyles.bodySmall,
              ),
              const SizedBox(height: 8),
              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingRowColor: WidgetStateProperty.all(
                        AppColors.darkNavy.withAlpha(15)),
                    columns: const [
                      DataColumn(label: Text('Student')),
                      DataColumn(label: Text('Class')),
                      DataColumn(label: Text('Attended'), numeric: true),
                      DataColumn(label: Text('Total'), numeric: true),
                      DataColumn(label: Text('Rate'), numeric: true),
                    ],
                    rows: _reportData.map((row) {
                      final pct = double.tryParse(
                              row['percentage'] as String? ?? '0') ??
                          0;
                      return DataRow(cells: [
                        DataCell(Text(row['name'] as String? ?? '')),
                        DataCell(Text(row['class'] as String? ?? '')),
                        DataCell(
                            Text((row['attended'] as int? ?? 0).toString())),
                        DataCell(
                            Text((row['total'] as int? ?? 0).toString())),
                        DataCell(
                          Text(
                            '${row['percentage']}%',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: pct >= 80
                                  ? AppColors.successGreen
                                  : pct >= 60
                                      ? AppColors.pendingAmber
                                      : AppColors.errorRed,
                            ),
                          ),
                        ),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
            ] else if (!_isLoading)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Text(
                    'Select date range and click "Generate Report"',
                    style: AppTextStyles.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
