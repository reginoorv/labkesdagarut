// Encoder Code128 (subset B, dengan START/checksum/STOP yang benar) tanpa
// dependency eksternal. Menghasilkan deretan lebar bar/space yang bisa
// dirender jadi SVG dan discan oleh pembaca barcode standar.
//
// Kode booking & nomor lab kita berupa ASCII (huruf besar, angka, "-"),
// semuanya ada di Code128 subset B, jadi subset B sudah cukup.

// 107 pola Code128; tiap pola = 6 angka lebar modul (bar,space,bar,space,bar,space).
const PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

// Ubah string -> daftar lebar modul (angka 1..4 berselang bar/space).
export function encodeCode128B(input: string): number[] {
  const values: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // Code128B: karakter ASCII 32..126 -> value 0..94
    const value = code - 32;
    if (value < 0 || value > 94) {
      // Karakter di luar jangkauan diganti spasi agar tetap valid.
      values.push(0);
      checksum += 0 * (i + 1);
      continue;
    }
    values.push(value);
    checksum += value * (i + 1);
  }

  values.push(checksum % 103); // checksum
  values.push(STOP);

  // Rangkai lebar modul dari pola tiap value.
  const widths: number[] = [];
  for (const v of values) {
    for (const ch of PATTERNS[v]) widths.push(parseInt(ch, 10));
  }
  return widths;
}

// Total lebar modul (untuk menghitung viewBox SVG).
export function code128ModuleCount(widths: number[]): number {
  return widths.reduce((a, b) => a + b, 0);
}
