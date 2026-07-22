import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// Profil: info akun + data pasien, kelola dependen (keluarga), ganti PIN.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loading = true;
  Map<String, dynamic>? _account;
  Map<String, dynamic>? _patient;
  List<dynamic> _dependents = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiClient.get('/api/patient/me/profile', auth: true);
    if (!mounted) return;
    setState(() {
      if (res.ok) {
        _account = Map<String, dynamic>.from(res.data['account'] ?? {});
        _patient = res.data['patient'] != null ? Map<String, dynamic>.from(res.data['patient']) : null;
        _dependents = res.data['dependents'] as List? ?? [];
      }
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil Saya')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Identitas akun
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 54,
                            height: 54,
                            decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
                            child: const Icon(Icons.person_outline, size: 30, color: AppColors.primary),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_patient?['name']?.toString() ?? 'Pasien',
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                const SizedBox(height: 2),
                                Text('NIK: ${_account?['nik'] ?? '-'}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                                Text('HP: ${_account?['phone'] ?? '-'}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Data pasien (read-only, dari web)
                  if (_patient != null) ...[
                    Text('Data Pasien (tersambung)', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            _row('No. RM', _patient!['rmNo']?.toString() ?? '-'),
                            _row('Tgl Lahir', (_patient!['dob']?.toString() ?? '').split('T').first),
                            _row('Jenis Kelamin', _patient!['gender']?.toString() == 'L' ? 'Laki-laki' : 'Perempuan'),
                            _row('Alamat', _patient!['address']?.toString() ?? '-'),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Dependen
                  Row(
                    children: [
                      Expanded(child: Text('Keluarga / Dependen', style: Theme.of(context).textTheme.titleMedium)),
                      TextButton.icon(
                        onPressed: _addDependent,
                        icon: const Icon(Icons.add, size: 18, color: AppColors.primary),
                        label: const Text('Tambah', style: TextStyle(color: AppColors.primary)),
                      ),
                    ],
                  ),
                  if (_dependents.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Belum ada dependen. Tambahkan anggota keluarga untuk didaftarkan.',
                            style: TextStyle(fontSize: 12.5, color: AppColors.textMuted)),
                      ),
                    )
                  else
                    ..._dependents.map((d) {
                      final dep = Map<String, dynamic>.from(d);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(9)),
                            child: const Icon(Icons.family_restroom_outlined, color: AppColors.primary, size: 20),
                          ),
                          title: Text(dep['name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                          subtitle: Text(dep['relation']?.toString() ?? '', style: const TextStyle(fontSize: 12)),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.statusKritis),
                            onPressed: () => _deleteDependent(dep['id'] as int),
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 16),

                  // Ganti PIN
                  OutlinedButton.icon(
                    onPressed: _changePin,
                    icon: const Icon(Icons.lock_reset, size: 18),
                    label: const Text('Ganti PIN'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.statusKritis, side: const BorderSide(color: AppColors.statusKritis)),
                    onPressed: () async {
                      await ApiClient.clearSession();
                      if (!mounted) return;
                      Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
                    },
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('Keluar'),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _row(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(k, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
          Expanded(child: Text(v.isEmpty ? '-' : v, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Future<void> _addDependent() async {
    final name = TextEditingController();
    final relation = TextEditingController();
    final nik = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tambah Dependen', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Nama lengkap *')),
            const SizedBox(height: 10),
            TextField(controller: relation, decoration: const InputDecoration(labelText: 'Hubungan *', hintText: 'Anak, Pasangan, Orang tua')),
            const SizedBox(height: 10),
            TextField(controller: nik, keyboardType: TextInputType.number, maxLength: 16, decoration: const InputDecoration(labelText: 'NIK (opsional)', counterText: '')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
        ],
      ),
    );
    if (ok == true && name.text.trim().isNotEmpty && relation.text.trim().isNotEmpty) {
      await ApiClient.put('/api/patient/me/profile', {
        'dependent': {'name': name.text.trim(), 'relation': relation.text.trim(), 'nik': nik.text.trim()},
      }, auth: true);
      _load();
    }
  }

  Future<void> _deleteDependent(int id) async {
    await ApiClient.put('/api/patient/me/profile', {
      'dependent': {'id': id, 'name': '', 'relation': '', '_delete': true},
    }, auth: true);
    _load();
  }

  Future<void> _changePin() async {
    final oldPin = TextEditingController();
    final newPin = TextEditingController();
    String? err;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setD) => AlertDialog(
          title: const Text('Ganti PIN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: oldPin,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 6,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'PIN lama', counterText: ''),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: newPin,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 6,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(labelText: 'PIN baru (6 digit)', counterText: ''),
              ),
              if (err != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(err!, style: const TextStyle(color: AppColors.statusKritis, fontSize: 12)),
                ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            ElevatedButton(
              onPressed: () async {
                final res = await ApiClient.put('/api/patient/me/profile', {
                  'oldPin': oldPin.text.trim(),
                  'newPin': newPin.text.trim(),
                }, auth: true);
                if (res.ok) {
                  if (ctx.mounted) Navigator.pop(ctx, true);
                } else {
                  setD(() => err = res.error);
                }
              },
              child: const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
    if (ok == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PIN berhasil diganti')));
    }
  }
}
