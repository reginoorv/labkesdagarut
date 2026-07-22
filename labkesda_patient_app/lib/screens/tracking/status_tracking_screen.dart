import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// Status tracking: timeline perjalanan pendaftaran → verifikasi → antrian → hasil.
// Sumber: GET /api/patient/me/registrations + /api/patient/me/notifications.
class StatusTrackingScreen extends StatefulWidget {
  const StatusTrackingScreen({super.key});

  @override
  State<StatusTrackingScreen> createState() => _StatusTrackingScreenState();
}

class _StatusTrackingScreenState extends State<StatusTrackingScreen> with SingleTickerProviderStateMixin {
  late final TabController _tab = TabController(length: 2, vsync: this);
  bool _loading = true;
  List<dynamic> _regs = [];
  List<dynamic> _exams = [];
  List<dynamic> _notifs = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final regRes = await ApiClient.get('/api/patient/me/registrations', auth: true);
    final notifRes = await ApiClient.get('/api/patient/me/notifications', auth: true);
    if (!mounted) return;
    setState(() {
      _regs = regRes.ok ? (regRes.data['registrations'] as List? ?? []) : [];
      _exams = regRes.ok ? (regRes.data['examinations'] as List? ?? []) : [];
      _notifs = notifRes.ok ? (notifRes.data['notifications'] as List? ?? []) : [];
      _loading = false;
    });
    // tandai semua terbaca
    ApiClient.post('/api/patient/me/notifications', {'all': true}, auth: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Status & Antrian'),
        bottom: TabBar(
          controller: _tab,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Tracking'),
            Tab(text: 'Notifikasi'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tab,
              children: [_buildTracking(), _buildNotifs()],
            ),
    );
  }

  Widget _buildTracking() {
    if (_regs.isEmpty && _exams.isEmpty) {
      return _empty('Belum ada pendaftaran.\nMulai dari menu Daftar Pemeriksaan.');
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ..._regs.map((r) => _RegTrackingCard(reg: r, exam: _matchExam(r))),
        ],
      ),
    );
  }

  Map<String, dynamic>? _matchExam(Map<String, dynamic> reg) {
    for (final e in _exams) {
      if (e['id'] == reg['convertedExaminationId']) return Map<String, dynamic>.from(e);
    }
    return null;
  }

  Widget _buildNotifs() {
    if (_notifs.isEmpty) return _empty('Belum ada notifikasi.');
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _notifs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final n = Map<String, dynamic>.from(_notifs[i]);
          final type = n['type']?.toString() ?? '';
          final (icon, color) = switch (type) {
            'HASIL' => (Icons.science_outlined, AppColors.statusNormal),
            'PEMBAYARAN' => (Icons.payments_outlined, AppColors.catKimia),
            _ => (Icons.app_registration_outlined, AppColors.primary),
          };
          return Card(
            child: ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color),
              ),
              title: Text(n['title']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
              subtitle: Text(n['body']?.toString() ?? '', style: const TextStyle(fontSize: 12)),
            ),
          );
        },
      ),
    );
  }

  Widget _empty(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 56, color: AppColors.textMuted.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          Text(msg, style: const TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _RegTrackingCard extends StatelessWidget {
  final Map<String, dynamic> reg;
  final Map<String, dynamic>? exam;
  const _RegTrackingCard({required this.reg, this.exam});

  @override
  Widget build(BuildContext context) {
    final status = reg['status']?.toString() ?? 'MENUNGGU_VERIFIKASI';
    final examStatus = exam?['status']?.toString();
    final queueNo = exam?['queueNo']?.toString();

    // Timeline steps: Daftar → Verifikasi → (Antrian/Proses) → Hasil
    final steps = <_TL>[
      _TL('Pendaftaran dikirim', true),
      _TL('Verifikasi petugas', status == 'TERVERIFIKASI' || status == 'SELESAI'),
      _TL(
        queueNo != null ? 'Antrian: $queueNo' : 'Menunggu antrian',
        examStatus != null && examStatus != 'REGISTRASI',
      ),
      _TL('Hasil tersedia', examStatus == 'VALIDA'),
    ];
    final current = steps.lastIndexWhere((s) => s.done);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(reg['bookingCode']?.toString() ?? '-',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 0.5)),
                ),
                StatusBadge(
                  examStatus == 'VALIDA'
                      ? 'HASIL TERSEDIA'
                      : status == 'TERVERIFIKASI'
                          ? 'TERVERIFIKASI'
                          : status == 'DITOLAK'
                              ? 'DITOLAK'
                              : 'MENUNGGU',
                  examStatus == 'VALIDA'
                      ? AppColors.statusNormal
                      : status == 'DITOLAK'
                          ? AppColors.statusKritis
                          : status == 'TERVERIFIKASI'
                              ? AppColors.statusDuplo
                              : AppColors.statusPending,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(reg['name']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
            const SizedBox(height: 14),

            // QR booking (masih relevan kalau belum diverifikasi)
            if (status == 'MENUNGGU_VERIFIKASI') ...[
              Center(
                child: QrImageView(data: reg['bookingCode']?.toString() ?? '', size: 130, backgroundColor: Colors.white),
              ),
              const SizedBox(height: 6),
              const Center(
                child: Text('Tunjukkan ke petugas loket', style: TextStyle(fontSize: 11.5, color: AppColors.textMuted)),
              ),
              const SizedBox(height: 12),
            ],

            // Timeline
            ...List.generate(steps.length, (i) {
              final s = steps[i];
              final isLast = i == steps.length - 1;
              final isCurrent = i == current;
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: s.done ? AppColors.primary : Colors.white,
                          border: Border.all(color: s.done ? AppColors.primary : AppColors.border, width: 2),
                        ),
                        child: s.done
                            ? const Icon(Icons.check, size: 12, color: Colors.white)
                            : null,
                      ),
                      if (!isLast)
                        Container(width: 2, height: 26, color: s.done ? AppColors.primary : AppColors.border),
                    ],
                  ),
                  const SizedBox(width: 10),
                  Padding(
                    padding: const EdgeInsets.only(top: 1),
                    child: Text(
                      s.label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                        color: s.done ? AppColors.textMain : AppColors.textMuted,
                      ),
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _TL {
  final String label;
  final bool done;
  const _TL(this.label, this.done);
}
