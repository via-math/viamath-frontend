// fraction-math.js — utilitas nilai pecahan & validasi ADIL.
// Mengganti pencocokan string mentah versi lama yang menolak jawaban benar (lihat audit A-1).
// Prinsip: bandingkan NILAI, bukan teks. Terima bentuk setara (1/2, 0,5, "1 1/2", desimal).

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

// Parse satu token jadi nilai numerik. Mengembalikan number | null.
// Dukung: "3/4", "1 3/20" (campuran), "0,25" / "0.25" (desimal), "5".
export function parseFractionValue(input) {
  if (input == null) return null;
  let s = String(input).toLowerCase().trim();
  // buang satuan & kata umum
  s = s.replace(/meter|kg|gram|liter|bagian|loyang|potong|m\b/g, '').trim();
  s = s.replace(/\s+/g, ' ');
  if (!s) return null;

  // pecahan campuran "1 3/20"
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const [, w, n, d] = mixed.map(Number);
    if (d === 0) return null;
    return w + n / d;
  }
  // pecahan biasa "a/b"
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const [, n, d] = frac.map(Number);
    if (d === 0) return null;
    return n / d;
  }
  // desimal "0,25" atau "0.25" atau bilangan bulat
  const dec = s.replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(dec)) return parseFloat(dec);
  return null;
}

// Apakah dua representasi pecahan/angka SENILAI? (toleransi pembulatan kecil)
export function isEquivalent(a, b) {
  const va = parseFractionValue(a), vb = parseFractionValue(b);
  if (va == null || vb == null) return false;
  return Math.abs(va - vb) < 1e-9;
}

// Sederhanakan pecahan → "p/q" tereduksi (untuk umpan balik).
export function simplify(n, d) {
  if (d === 0) return `${n}/0`;
  const g = gcd(n, d);
  return `${n / g}/${d / g}`;
}

function normText(s) {
  return String(s).toLowerCase().trim().replace(/\s+/g, ' ');
}

// Validasi jawaban siswa terhadap satu/lebih jawaban benar.
// `accepted` = array bentuk benar; cukup salah satunya cocok.
// Mendukung jawaban PECAHAN (dibandingkan berdasar NILAI) maupun TEKS (mis. "sama", "Ani").
export function checkAnswer(studentText, accepted) {
  if (!studentText || !studentText.trim()) return false;
  const studentTokens = normText(studentText).split(/[\s,;=]+/).filter(Boolean);
  const studentNorm = normText(studentText);

  for (const acc of accepted) {
    const accVal = parseFractionValue(acc);
    if (accVal != null) {
      // jawaban benar berupa pecahan/angka → bandingkan NILAI dengan token siswa
      if (studentTokens.some((t) => isEquivalent(t, acc)) || isEquivalent(studentText, acc)) {
        return true;
      }
    } else {
      // jawaban benar berupa TEKS → cocokkan kata (token atau substring)
      const accNorm = normText(acc);
      if (studentTokens.includes(accNorm) || studentNorm.includes(accNorm)) {
        return true;
      }
    }
  }
  return false;
}
