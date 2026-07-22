import 'package:flutter/material.dart';
import 'theme.dart';

// Kategori tes — SAMA PERSIS dengan web /daftar-online.
// id dikirim sebagai elemen array requestedTests ke POST /api/online-registrations.
class TestCategory {
  final String id;
  final String name;
  final String desc;
  final Color color;
  final bool purposeRequired; // wajib isi "keperluan" (NARKOBA / KESEHATAN)

  const TestCategory(this.id, this.name, this.desc, this.color, {this.purposeRequired = false});
}

const testCategories = <TestCategory>[
  TestCategory('Hematologi', 'Hematologi', 'Darah lengkap, hitung sel darah', AppColors.catHematologi),
  TestCategory('Kimia Klinik', 'Kimia Klinik', 'Gula darah, kolesterol, fungsi ginjal/hati', AppColors.catKimia),
  TestCategory('Imunoserologi', 'Imunoserologi', 'HBsAg, HIV, Widal, tes kehamilan', AppColors.catImunoserologi),
  TestCategory('Mikrobiologi', 'Mikrobiologi', 'Kultur, pewarnaan Gram, TCM TB', AppColors.catMikrobiologi),
  TestCategory('Urinalisis', 'Urinalisis', 'Urine rutin, protein, sedimen', AppColors.catUrinalisis),
  TestCategory('NARKOBA', 'Narkoba', 'Skrining penyalahgunaan narkoba', AppColors.catNarkoba, purposeRequired: true),
  TestCategory('KESEHATAN', 'Surat Keterangan Sehat', 'Paket pemeriksaan kesehatan', AppColors.catKesehatan, purposeRequired: true),
];

// Data wilayah bertingkat — disalin dari web src/lib/wilayah.ts.
// Cakupan difokuskan ke Garut & sekitarnya (sama seperti web).
class Wilayah {
  static const negara = ['Indonesia'];

  static const provinsi = ['Jawa Barat'];

  static const Map<String, List<String>> kota = {
    'Jawa Barat': ['Kabupaten Garut', 'Kota Bandung', 'Kabupaten Bandung', 'Kota Tasikmalaya', 'Kabupaten Tasikmalaya', 'Kabupaten Sumedang'],
  };

  static const Map<String, List<String>> kecamatan = {
    'Kabupaten Garut': [
      'Tarogong Kidul', 'Tarogong Kaler', 'Garut Kota', 'Karangpawitan', 'Wanaraja',
      'Sucinaraja', 'Cibatu', 'Leuwigoong', 'Cisurupan', 'Bayongbong', 'Cilawu',
      'Sukaresmi', 'Samarang', 'Pasirwangi', 'Banyuresmi', 'Kadungora', 'Leles',
      'Cipicung', 'Malangbong', 'Cikelet', 'Pameungpeuk', 'Bungbulang', 'Mekarmukti',
      'Caringin', 'Cisompet', 'Pakenjeng', 'Pamulihan', 'Cisewu', 'Cibalong',
      'Sukawening', 'Cigedug', 'Singajaya', 'Peundeuy', 'Talegong', 'Banjarwangi',
      'Cihurip', 'Cikajang', 'Selaawi', 'Cibiuk', 'Pangatikan', 'Sukaraja', 'Blubur Limbangan',
    ],
    'Kota Bandung': ['Coblong', 'Cidadap', 'Bandung Wetan', 'Sumur Bandung', 'Andir', 'Cicendo', 'Sukajadi', 'Sukasari', 'Ujungberung', 'Cibiru', 'Arcamanik', 'Antapani', 'Mandalajati', 'Kiaracondong', 'Batununggal', 'Lengkong', 'Buahbatu', 'Regol', 'Astanaanyar', 'Bojongloa Kidul', 'Bojongloa Kaler', 'Babakan Ciparay', 'Margahayu', 'Gedebage', 'Panyileukan', 'Cinambo', 'Rancasari', 'Cibeunying Kidul', 'Cibeunying Kaler', 'Bandung Kidul', 'Bandung Kulon'],
    'Kabupaten Bandung': ['Cileunyi', 'Cimenyan', 'Cilengkrang', 'Rancaekek', 'Nagreg', 'Cicalengka', 'Majalaya', 'Banjaran', 'Baleendah', 'Dayeuhkolot', 'Bojongsoang', 'Soreang', 'Margaasih', 'Katapang', 'Pameungpeuk', 'Ciwidey', 'Pangalengan'],
    'Kota Tasikmalaya': ['Cipedes', 'Tawang', 'Indihiang', 'Kawalu', 'Mangkubumi', 'Cibeureum', 'Tamansari', 'Bungursari', 'Purbaratu', 'Cihideung'],
    'Kabupaten Tasikmalaya': ['Singaparna', 'Ciawi', 'Rajapolah', 'Jamanis', 'Sukahening', 'Pagerageung', 'Cineam', 'Manonjaya', 'Salawu', 'Taraju'],
    'Kabupaten Sumedang': ['Sumedang Utara', 'Sumedang Selatan', 'Jatinangor', 'Tanjungsari', 'Cimanggung', 'Paseh', 'Tomo', 'Ujungjaya'],
  };

  // Desa hanya detail untuk kecamatan utama Garut; lainnya isi manual di form.
  static const Map<String, List<String>> desa = {
    'Tarogong Kidul': ['Sukakarya', 'Haurpanggung', 'Jati', 'Kersamenak', 'Sukamukti', 'Cimanganten', 'Pananjung', 'Sukawangi', 'Mekarwangi', 'Sukajadi', 'Pasawahan', 'Rancabango', 'Jayaraga'],
    'Tarogong Kaler': ['Sukagalih', 'Cimuncang', 'Sukanegla', 'Haurkuning', 'Sirnajaya', 'Mekarjaya', 'Tanjungsari', 'Cipanas', 'Langensari', 'Margawati'],
    'Garut Kota': ['Paminggir', 'Kota Kulon', 'Kota Wetan', 'Margawati', 'Regol', 'Sukamentri', 'Pakuwon'],
    'Karangpawitan': ['Lebakjaya', 'Karangpawitan', 'Suci', 'Jojogan', 'Sindangpalay', 'Godog', 'Tanjungkamuning', 'Situjaya', 'Mekarsari', 'Karangwangi', 'Cinunuk', 'Sindanglaya', 'Linggarjaya', 'Sindangsari', 'Pasirwangi', 'Cipacing', 'Sukalaksana', 'Pangkalan', 'Mekarjaya', 'Kubang'],
    'Wanaraja': ['Wanaraja', 'Wanasari', 'Cinunuk', 'Sukamenak', 'Sindangratu', 'Sindangsuka', 'Tambaksari', 'Mekarjaya', 'Wanamekar'],
    'Sucinaraja': ['Tegalpanjang', 'Sukalilah', 'Sukarasa', 'Sukaratu', 'Cigadog', 'Cintarasa', 'Sukapura'],
    'Cibatu': ['Cibatu', 'Padaluyu', 'Wanakerta', 'Mekarsari', 'Cibunar', 'Sukamaju', 'Keresek', 'Cinta', 'Karyamukti', 'Padasuka', 'Sukasari'],
    'Cilawu': ['Cilawu', 'Sukamukti', 'Dangiang', 'Ngamplangsari', 'Mekarmukti', 'Sukamanah', 'Pasirnangka', 'Karyamekar', 'Cipareuan', 'Dawuan', 'Sukamaju', 'Cipangramatan'],
  };

  static List<String> kotaList(String prov) => kota[prov] ?? [];
  static List<String> kecamatanList(String kotaName) => kecamatan[kotaName] ?? [];
  static List<String> desaList(String kec) => desa[kec] ?? [];
}
