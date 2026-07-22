import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// Riwayat hasil pemeriksaan: list → detail (tabel parameter, nilai, satuan,
// rujukan, flag). Hasil hanya muncul jika server menandai resultVisible
// (status VALIDA) — sama dengan aturan web /cek-hasil.
class ResultsHistoryScreen extends StatefulWidget {
  const ResultsHistoryScreen({super.key});

  @override
  State<ResultsHistoryScreen> createState() => _ResultsHistoryScreenState();
}

class _ResultsHistoryScreenState extends State<ResultsHistoryScreen> {
  bool _loading = true;
  List<dynamic> _exams = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiClient.get('/api/patient/me/examinations', auth: true);
    if (!mounted) return;
    setState(() {
      _exams = res.ok ? (res.data['examinations'] as List? ?? []) : [];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Hasil')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _exams.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.science_outlined, size: 56, color: AppColors.textMuted.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      const Text('Belum ada riwayat pemeriksaan', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.primary,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _exams.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final e = Map<String, dynamic>.from(_exams[i]);
                      final status = e['status']?.toString() ?? '';
                      final isValida = status == 'VALIDA';
                      final date = (e['validatedAt'] ?? e['createdAt'])?.toString().split('T').first ?? '';
                      return Card(
                        child: ListTile(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ResultDetailScreen(examId: e['id'] as int)),
                          ),
                          leading: Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: (isValida ? AppColors.statusNormal : AppColors.statusPending).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              isValida ? Icons.task_alt : Icons.hourglass_top_outlined,
                              color: isValida ? AppColors.statusNormal : AppColors.statusPending,
                            ),
                          ),
                          title: Text(e['labNo']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                          subtitle: Text(date, style: const TextStyle(fontSize: 12)),
                          trailing: StatusBadge(
                            isValida ? 'TERSEDIA' : status,
                            isValida ? AppColors.statusNormal : AppColors.statusPending,
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class ResultDetailScreen extends StatefulWidget {
  final int examId;
  const ResultDetailScreen({super.key, required this.examId});

  @override
  State<ResultDetailScreen> createState() => _ResultDetailScreenState();
}

class _ResultDetailScreenState extends State<ResultDetailScreen> {
  bool _loading = true;
  Map<String, dynamic>? _exam;
  List<dynamic> _details = [];
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiClient.get('/api/patient/me/examinations?id=${widget.examId}', auth: true);
    if (!mounted) return;
    setState(() {
      if (res.ok) {
        _exam = Map<String, dynamic>.from(res.data['examination'] ?? {});
        _details = res.data['details'] as List? ?? [];
        _visible = res.data['resultVisible'] == true;
      }
      _loading = false;
    });
  }

  Color _flagColor(String flag) {
    switch (flag) {
      case 'HIGH':
      case 'LOW':
      case 'POSITIVE':
      case 'KRITIS':
        return AppColors.statusKritis;
      case 'DUPLO':
        return AppColors.statusDuplo;
      default:
        return AppColors.statusNormal;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_exam?['labNo']?.toString() ?? 'Detail Hasil')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : !_visible
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock_outline, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        const Text('Hasil belum tersedia',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 6),
                        Text(
                          'Hasil akan muncul setelah divalidasi oleh Penanggung Jawab Lab.\nStatus saat ini: ${_exam?['status'] ?? '-'}',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12.5),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            _infoRow('No. Lab', _exam?['labNo']?.toString() ?? '-'),
                            _infoRow('No. Antrian', _exam?['queueNo']?.toString() ?? '-'),
                            _infoRow('Validator', _exam?['validatorName']?.toString() ?? '-'),
                            _infoRow('Tgl Validasi', (_exam?['validatedAt']?.toString() ?? '').split('T').first),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Hasil Pemeriksaan', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Card(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          headingRowHeight: 38,
                          dataRowMinHeight: 34,
                          dataRowMaxHeight: 44,
                          columnSpacing: 18,
                          headingTextStyle: const TextStyle(
                              fontSize: 11.5, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                          columns: const [
                            DataColumn(label: Text('PARAMETER')),
                            DataColumn(label: Text('HASIL')),
                            DataColumn(label: Text('SATUAN')),
                            DataColumn(label: Text('RUJUKAN')),
                            DataColumn(label: Text('FLAG')),
                          ],
                          rows: _details.map((d) {
                            final flag = d['flag']?.toString() ?? 'NORMAL';
                            return DataRow(cells: [
                              DataCell(Text(d['testName']?.toString() ?? '-', style: const TextStyle(fontSize: 12))),
                              DataCell(Text(d['value']?.toString() ?? '-',
                                  style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                      color: flag == 'NORMAL' ? AppColors.textMain : _flagColor(flag)))),
                              DataCell(Text(d['unit']?.toString() ?? '-', style: const TextStyle(fontSize: 12))),
                              DataCell(Text(d['referenceRange']?.toString() ?? '-', style: const TextStyle(fontSize: 12))),
                              DataCell(flag == 'NORMAL'
                                  ? const Text('N', style: TextStyle(fontSize: 11, color: AppColors.statusNormal, fontWeight: FontWeight.w700))
                                  : StatusBadge(flag, _flagColor(flag))),
                            ]);
                          }).toList(),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _infoRow(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(k, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
          Expanded(child: Text(v.isEmpty ? '-' : v, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }
}
