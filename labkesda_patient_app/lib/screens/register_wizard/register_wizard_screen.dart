import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../core/api_client.dart';
import '../../core/catalog.dart';

// Wizard pendaftaran 4 langkah — field & payload SAMA dengan web /daftar-online:
// step 1: identitas, step 2: alamat (wilayah bertingkat), step 3: pilih tes,
// step 4: review → POST /api/online-registrations → tampil kode booking + QR.
class RegisterWizardScreen extends StatefulWidget {
  const RegisterWizardScreen({super.key});

  @override
  State<RegisterWizardScreen> createState() => _RegisterWizardScreenState();
}

class _RegisterWizardScreenState extends State<RegisterWizardScreen> {
  int _step = 0;
  bool _loading = false;
  String? _error;
  String? _bookingCode;

  // Step 1 — identitas
  final _nik = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  DateTime? _dob;
  String _gender = 'L';
  final _notes = TextEditingController();

  // Step 2 — alamat
  String _province = 'Jawa Barat';
  String? _city;
  String? _district;
  String? _village;
  final _rtRw = TextEditingController();
  final _address = TextEditingController();

  // Step 3 — tes
  final Set<String> _selected = {};
  final _purpose = TextEditingController();

  bool get _purposeRequired => _selected.any((id) => testCategories.firstWhere((c) => c.id == id).purposeRequired);

  bool get _stepValid {
    switch (_step) {
      case 0:
        return _nik.text.length == 16 && _name.text.trim().isNotEmpty && _dob != null && _phone.text.trim().length >= 9;
      case 1:
        return _city != null && _district != null && _address.text.trim().isNotEmpty;
      case 2:
        return _selected.isNotEmpty && (!_purposeRequired || _purpose.text.trim().isNotEmpty);
      default:
        return true;
    }
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final res = await ApiClient.post('/api/online-registrations', {
      'nik': _nik.text.trim(),
      'name': _name.text.trim(),
      'dob': _dob!.toIso8601String().split('T').first,
      'gender': _gender,
      'phone': _phone.text.trim(),
      'address': _address.text.trim(),
      'province': _province,
      'city': _city,
      'district': _district,
      'village': _village,
      'rtRw': _rtRw.text.trim(),
      'requestedTests': _selected.toList(),
      'purpose': _purpose.text.trim(),
      'notes': _notes.text.trim(),
    });
    setState(() => _loading = false);
    if (!mounted) return;
    if (res.ok) {
      setState(() {
        _bookingCode = res.data['bookingCode']?.toString() ?? res.data['registration']?['bookingCode']?.toString();
        _step = 4;
      });
    } else {
      setState(() => _error = res.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pendaftaran Online')),
      body: _step == 4 ? _buildSuccess() : _buildWizard(),
    );
  }

  Widget _buildWizard() {
    return Column(
      children: [
        // Stepper indicator
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: List.generate(4, (i) {
              final done = i < _step;
              final active = i == _step;
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  height: 5,
                  decoration: BoxDecoration(
                    color: done || active ? AppColors.primary : AppColors.border,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              ['Data Diri', 'Alamat Domisili', 'Pilih Pemeriksaan', 'Review'][_step],
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: _step == 0
                ? _stepIdentity()
                : _step == 1
                    ? _stepAddress()
                    : _step == 2
                        ? _stepTests()
                        : _stepReview(),
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(_error!, style: const TextStyle(color: AppColors.statusKritis, fontSize: 12.5)),
          ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (_step > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _step--),
                    child: const Text('Kembali'),
                  ),
                ),
              if (_step > 0) const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: !_stepValid || _loading
                      ? null
                      : () {
                          if (_step < 3) {
                            setState(() {
                              _step++;
                              _error = null;
                            });
                          } else {
                            _submit();
                          }
                        },
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_step < 3 ? 'Lanjut' : 'Kirim Pendaftaran'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _stepIdentity() {
    return Column(
      children: [
        TextField(
          controller: _nik,
          keyboardType: TextInputType.number,
          maxLength: 16,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'NIK (16 digit) *', counterText: ''),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'Nama Lengkap *'),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime(2000),
              firstDate: DateTime(1900),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _dob = picked);
          },
          child: InputDecorator(
            decoration: const InputDecoration(labelText: 'Tanggal Lahir *', suffixIcon: Icon(Icons.calendar_today_outlined, size: 18)),
            child: Text(
              _dob == null ? 'Pilih tanggal' : '${_dob!.day}/${_dob!.month}/${_dob!.year}',
              style: TextStyle(color: _dob == null ? AppColors.textMuted : AppColors.textMain, fontSize: 14),
            ),
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _gender,
          decoration: const InputDecoration(labelText: 'Jenis Kelamin *'),
          items: const [
            DropdownMenuItem(value: 'L', child: Text('Laki-laki')),
            DropdownMenuItem(value: 'P', child: Text('Perempuan')),
          ],
          onChanged: (v) => setState(() => _gender = v!),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'Nomor WhatsApp / HP *'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _notes,
          maxLines: 2,
          decoration: const InputDecoration(labelText: 'Catatan (opsional)', hintText: 'Keluhan / info tambahan'),
        ),
      ],
    );
  }

  Widget _stepAddress() {
    final cities = Wilayah.kotaList(_province);
    final districts = _city == null ? <String>[] : Wilayah.kecamatanList(_city!);
    final villages = _district == null ? <String>[] : Wilayah.desaList(_district!);

    return Column(
      children: [
        DropdownButtonFormField<String>(
          value: _province,
          decoration: const InputDecoration(labelText: 'Provinsi'),
          items: Wilayah.provinsi.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
          onChanged: (v) => setState(() {
            _province = v!;
            _city = null;
            _district = null;
            _village = null;
          }),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _city,
          decoration: const InputDecoration(labelText: 'Kabupaten / Kota *'),
          items: cities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
          onChanged: (v) => setState(() {
            _city = v;
            _district = null;
            _village = null;
          }),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _district,
          decoration: const InputDecoration(labelText: 'Kecamatan *'),
          items: districts.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
          onChanged: (v) => setState(() {
            _district = v;
            _village = null;
          }),
        ),
        const SizedBox(height: 12),
        villages.isNotEmpty
            ? DropdownButtonFormField<String>(
                value: _village,
                decoration: const InputDecoration(labelText: 'Desa / Kelurahan'),
                items: villages.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                onChanged: (v) => setState(() => _village = v),
              )
            : TextField(
                onChanged: (v) => _village = v,
                decoration: const InputDecoration(labelText: 'Desa / Kelurahan'),
              ),
        const SizedBox(height: 12),
        TextField(
          controller: _rtRw,
          decoration: const InputDecoration(labelText: 'RT / RW', hintText: 'mis. 001/002'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _address,
          maxLines: 3,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(labelText: 'Alamat Lengkap *', hintText: 'Nama jalan, nomor rumah, patokan'),
        ),
      ],
    );
  }

  Widget _stepTests() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Pilih satu atau lebih pemeriksaan:', style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 10),
        ...testCategories.map((c) {
          final checked = _selected.contains(c.id);
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: CheckboxListTile(
              value: checked,
              activeColor: AppColors.primary,
              onChanged: (_) => setState(() {
                checked ? _selected.remove(c.id) : _selected.add(c.id);
              }),
              title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              subtitle: Text(c.desc, style: const TextStyle(fontSize: 12)),
              secondary: Container(width: 10, height: 40, decoration: BoxDecoration(color: c.color, borderRadius: BorderRadius.circular(5))),
            ),
          );
        }),
        if (_purposeRequired) ...[
          const SizedBox(height: 8),
          TextField(
            controller: _purpose,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Keperluan *',
              hintText: 'mis. Syarat kerja, SKCK, pra-nikah',
            ),
          ),
        ],
      ],
    );
  }

  Widget _stepReview() {
    final names = _selected.map((id) => testCategories.firstWhere((c) => c.id == id).name).join(', ');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _row('NIK', _nik.text),
            _row('Nama', _name.text),
            _row('Tgl Lahir', _dob == null ? '-' : '${_dob!.day}/${_dob!.month}/${_dob!.year}'),
            _row('Jenis Kelamin', _gender == 'L' ? 'Laki-laki' : 'Perempuan'),
            _row('No. HP', _phone.text),
            const Divider(height: 20),
            _row('Alamat', '${_address.text}, ${_village ?? ''}, $_district, $_city'),
            _row('RT/RW', _rtRw.text.isEmpty ? '-' : _rtRw.text),
            const Divider(height: 20),
            _row('Pemeriksaan', names),
            if (_purpose.text.isNotEmpty) _row('Keperluan', _purpose.text),
          ],
        ),
      ),
    );
  }

  Widget _row(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 110, child: Text(k, style: const TextStyle(fontSize: 12.5, color: AppColors.textMuted))),
          Expanded(child: Text(v, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
              child: const Icon(Icons.check_circle_outline, size: 42, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text('Pendaftaran Terkirim!', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            Text('Tunjukkan kode booking ini ke petugas loket',
                style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    QrImageView(data: _bookingCode ?? '', size: 180, backgroundColor: Colors.white),
                    const SizedBox(height: 12),
                    Text(_bookingCode ?? '-',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text('Status dapat dipantau di menu Status & Antrian',
                style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/status', ModalRoute.withName('/home')),
              child: const Text('Lihat Status Pendaftaran'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false),
              child: const Text('Kembali ke Beranda', style: TextStyle(color: AppColors.primary)),
            ),
          ],
        ),
      ),
    );
  }
}
