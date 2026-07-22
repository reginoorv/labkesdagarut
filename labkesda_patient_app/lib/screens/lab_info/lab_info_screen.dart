import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';

// Info lab: identitas Labkesda (dari letterhead settings web, via GET /api/letterhead
// — endpoint ini juga dipakai halaman kop-surat web) + jadwal layanan.
class LabInfoScreen extends StatefulWidget {
  const LabInfoScreen({super.key});

  @override
  State<LabInfoScreen> createState() => _LabInfoScreenState();
}

class _LabInfoScreenState extends State<LabInfoScreen> {
  bool _loading = true;
  Map<String, dynamic>? _lh;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiClient.get('/api/letterhead');
    if (!mounted) return;
    setState(() {
      if (res.ok) _lh = Map<String, dynamic>.from(res.data['letterhead'] ?? res.data['settings'] ?? {});
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final name = _lh?['labName']?.toString() ?? 'Labkesda Kabupaten Garut';
    final address = _lh?['address']?.toString() ?? 'Jl. Proklamasi No. 2, Garut';
    final phone = _lh?['phone']?.toString() ?? '-';
    final email = _lh?['email']?.toString() ?? '-';

    return Scaffold(
      appBar: AppBar(title: const Text('Info Laboratorium')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.local_hospital_outlined, color: Colors.white, size: 36),
                      const SizedBox(height: 10),
                      Text(name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 4),
                      Text(address, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12.5)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Text('Kontak', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.phone_outlined, color: AppColors.primary),
                        title: Text(phone, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Telepon', style: TextStyle(fontSize: 11.5)),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.email_outlined, color: AppColors.primary),
                        title: Text(email, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                        subtitle: const Text('Email', style: TextStyle(fontSize: 11.5)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Text('Jam Layanan', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(14),
                    child: Column(
                      children: [
                        _HoursRow('Senin - Kamis', '07.30 - 14.00'),
                        _HoursRow('Jumat', '07.30 - 11.00'),
                        _HoursRow('Sabtu', '07.30 - 12.00'),
                        _HoursRow('Minggu & Libur', 'Tutup'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Text('Alur Pendaftaran', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(14),
                    child: Column(
                      children: [
                        _StepRow('1', 'Daftar lewat aplikasi, dapatkan kode booking'),
                        _StepRow('2', 'Datang ke Labkesda, tunjukkan kode booking ke petugas loket'),
                        _StepRow('3', 'Bayar di kasir, lanjut pengambilan sampel'),
                        _StepRow('4', 'Hasil muncul di aplikasi setelah divalidasi'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _HoursRow extends StatelessWidget {
  final String day;
  final String hours;
  const _HoursRow(this.day, this.hours);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(day, style: const TextStyle(fontSize: 13)),
          Text(hours, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final String n;
  final String text;
  const _StepRow(this.n, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            child: Center(
              child: Text(n, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12.5))),
        ],
      ),
    );
  }
}
