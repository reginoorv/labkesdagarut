// Data wilayah administratif untuk dropdown alamat bertingkat.
// Fokus: Indonesia → Jawa Barat → (kota/kabupaten sekitar) → kecamatan → desa/kelurahan.
// Cakupan sengaja difokuskan ke Garut & sekitarnya (Labkesda Garut), dengan
// beberapa kota tetangga sebagai pelengkap. RT/RW tetap diisi manual.

export interface DesaNode {
  name: string;
}
export interface KecamatanNode {
  name: string;
  desa: string[];
}
export interface KotaNode {
  name: string;
  kecamatan: KecamatanNode[];
}
export interface ProvinsiNode {
  name: string;
  kota: KotaNode[];
}

// Negara — hanya Indonesia (Labkesda melayani warga Indonesia).
export const NEGARA = ["Indonesia"];

// Struktur lengkap Provinsi → Kota → Kecamatan → Desa.
export const WILAYAH: ProvinsiNode[] = [
  {
    name: "Jawa Barat",
    kota: [
      {
        name: "Kabupaten Garut",
        kecamatan: [
          {
            name: "Garut Kota",
            desa: ["Kota Wetan", "Kota Kulon", "Muara Sanding", "Regol", "Ciwalen", "Paminggir", "Pakuwon", "Sukamentri", "Cimuncang", "Margawati", "Sukanegla"],
          },
          {
            name: "Tarogong Kidul",
            desa: ["Pataruman", "Jayaraga", "Jayawaras", "Kersamenak", "Sukajaya", "Sukagalih", "Sukabakti", "Haurpanggung", "Tarogong", "Cibunar", "Sukakarya", "Sirnajaya"],
          },
          {
            name: "Tarogong Kaler",
            desa: ["Pananjung", "Jati", "Sukawangi", "Rancabango", "Mekarwangi", "Panjiwangi", "Sirnajaya", "Sukajadi", "Langensari", "Tanjungkamuning", "Cimganggu", "Sukamurni"],
          },
          {
            name: "Banyuresmi",
            desa: ["Banyuresmi", "Bagendit", "Sukaraja", "Sukakarya", "Cimareme", "Karyasari", "Karyamukti", "Sukamukti", "Binakarya", "Cipicung", "Dangdeur", "Pamekarsari"],
          },
          {
            name: "Leles",
            desa: ["Leles", "Kandangmukti", "Margaluyu", "Cangkuang", "Salamnunggal", "Ciburial", "Dungusiku", "Haruman", "Jangkurang", "Lembang", "Margahayu", "Sukarame"],
          },
          {
            name: "Kadungora",
            desa: ["Kadungora", "Cikembulan", "Gandamekar", "Karangmulya", "Karangtengah", "Cisaat", "Mekarbakti", "Neglasari", "Rancasalak", "Talagasari", "Tanggulun", "Mandalasari"],
          },
          {
            name: "Cibatu",
            desa: ["Cibatu", "Padasuka", "Keresek", "Kertajaya", "Wanakerta", "Girimukti", "Cibunar", "Karyamukti", "Mekarsari", "Sukalilah", "Sindangsuka", "Ckg"],
          },
          {
            name: "Bayongbong",
            desa: ["Bayongbong", "Mekarsari", "Panembong", "Cikedokan", "Ciela", "Cinisti", "Hegarmanah", "Karyajaya", "Mekarjaya", "Panyingkiran", "Salakuray", "Sukamanah"],
          },
          {
            name: "Cikajang",
            desa: ["Cikajang", "Cibodas", "Cikandang", "Cipangramatan", "Girijaya", "Karamatwangi", "Margamulya", "Mekarjaya", "Padasuka", "Simpang", "Cimanggu"],
          },
          {
            name: "Samarang",
            desa: ["Samarang", "Cintarasa", "Cintakarya", "Cintarakyat", "Sukalaksana", "Sukarasa", "Sukamukti", "Tanjungkarya", "Cisarua", "Parakan", "Sirnasari"],
          },
        ],
      },
      {
        name: "Kota Tasikmalaya",
        kecamatan: [
          { name: "Cihideung", desa: ["Nagarawangi", "Yudanagara", "Tuguraja", "Tugujaya", "Argasari"] },
          { name: "Tawang", desa: ["Kahuripan", "Tawangsari", "Lengkongsari", "Empangsari", "Cikalang"] },
          { name: "Cipedes", desa: ["Cipedes", "Nagarasari", "Panglayungan", "Sukamanah"] },
        ],
      },
      {
        name: "Kabupaten Bandung",
        kecamatan: [
          { name: "Soreang", desa: ["Soreang", "Pamekaran", "Sadu", "Sukajadi", "Sukanagara", "Panyirapan"] },
          { name: "Baleendah", desa: ["Baleendah", "Andir", "Jelekong", "Manggahang", "Rancamanyar", "Wargamekar"] },
          { name: "Banjaran", desa: ["Banjaran", "Banjaran Wetan", "Ciapus", "Kamasan", "Kiangroke", "Margahurip"] },
        ],
      },
      {
        name: "Kota Bandung",
        kecamatan: [
          { name: "Coblong", desa: ["Dago", "Cipaganti", "Lebakgede", "Sadangserang", "Sekeloa", "Lebaksiliwangi"] },
          { name: "Bandung Wetan", desa: ["Cihapit", "Citarum", "Tamansari"] },
          { name: "Sumur Bandung", desa: ["Braga", "Kebonpisang", "Merdeka", "Babakan Ciamis"] },
        ],
      },
    ],
  },
];

export function getProvinsiList(): string[] {
  return WILAYAH.map((p) => p.name);
}
export function getKotaList(provinsi: string): string[] {
  return WILAYAH.find((p) => p.name === provinsi)?.kota.map((k) => k.name) ?? [];
}
export function getKecamatanList(provinsi: string, kota: string): string[] {
  return (
    WILAYAH.find((p) => p.name === provinsi)
      ?.kota.find((k) => k.name === kota)
      ?.kecamatan.map((kc) => kc.name) ?? []
  );
}
export function getDesaList(provinsi: string, kota: string, kecamatan: string): string[] {
  return (
    WILAYAH.find((p) => p.name === provinsi)
      ?.kota.find((k) => k.name === kota)
      ?.kecamatan.find((kc) => kc.name === kecamatan)?.desa ?? []
  );
}
