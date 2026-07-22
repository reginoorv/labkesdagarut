import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _account;
  int _unread = 0;
  List<dynamic> _regs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final acc = await ApiClient.account;
    final regsRes = await ApiClient.get('/api/patient/me/registrations', auth: true);
    final notifRes = await ApiClient.get('/api/patient/me/notifications', auth: true);
    if (!mounted) return;
    setState(() {
      _account = acc;
      _regs = regsRes.ok ? (regsRes.data['registrations'] as List? ?? []) : [];
      _unread = notifRes.ok ? (notifRes.data['unreadCount'] as int? ?? 0) : 0;
      _loading = false;
    });
  }

  Future<void> _logout() async {
    await ApiClient.clearSession();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final name = _account?['name']?.toString() ?? 'Pasien';
    final first = name.split(' ').first;
    final active = _regs.where((r) => r['status'] == 'MENUNGGU_VERIFIKASI').toList();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: AppColors.primary,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Halo, $first', style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 2),
                        Text('Labkesda Garut', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  Stack(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pushNamed(context, '/status'),
                        icon: const Icon(Icons.notifications_outlined),
                      ),
                      if (_unread > 0)
                        Positioned(
                          right: 8,
                          top: 8,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: AppColors.statusKritis, shape: BoxShape.circle),
                            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                            child: Text('$_unread',
                                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                                textAlign: TextAlign.center),
                          ),
                        ),
                    ],
                  ),
                  IconButton(onPressed: _logout, icon: const Icon(Icons.logout, color: AppColors.textMuted)),
                ],
              ),
              const SizedBox(height: 16),

              // CTA daftar baru
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Daftar Pemeriksaan',
                        style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('Daftarkan diri atau keluarga tanpa antri di loket',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12.5)),
                    const SizedBox(height: 14),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        minimumSize: const Size.fromHeight(44),
                      ),
                      onPressed: () => Navigator.pushNamed(context, '/daftar'),
                      child: const Text('Mulai Pendaftaran'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Pendaftaran aktif
              if (active.isNotEmpty) ...[
                Text('Pendaftaran Aktif', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                ...active.map((r) => _ActiveRegCard(reg: r)),
                const SizedBox(height: 20),
              ],

              // Menu grid
              Text('Menu', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.5,
                children: [
                  _MenuCard(Icons.fact_check_outlined, 'Status & Antrian', '/status', AppColors.primary),
                  _MenuCard(Icons.science_outlined, 'Riwayat Hasil', '/hasil', AppColors.catKimia),
                  _MenuCard(Icons.person_outline, 'Profil Saya', '/profil', AppColors.catImunoserologi),
                  _MenuCard(Icons.local_hospital_outlined, 'Info Lab', '/info', AppColors.catKesehatan),
                ],
              ),
              if (_loading) const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator())),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String route;
  final Color color;
  const _MenuCard(this.icon, this.label, this.route, this.color);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.pushNamed(context, route),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 28),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveRegCard extends StatelessWidget {
  final Map<String, dynamic> reg;
  const _ActiveRegCard({required this.reg});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => Navigator.pushNamed(context, '/status'),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(10)),
          child: const Icon(Icons.qr_code_2_outlined, color: AppColors.primary),
        ),
        title: Text(reg['bookingCode']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: const Text('Menunggu verifikasi petugas', style: TextStyle(fontSize: 12)),
        trailing: const StatusBadge('MENUNGGU', AppColors.statusPending),
      ),
    );
  }
}
