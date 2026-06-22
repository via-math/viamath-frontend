// fraction-circle.js — komponen visual pecahan (lingkaran SVG + notasi + bar model).
// Murni render, tanpa dependensi. Dipakai di halaman Materi/Penyelidikan.

// Notasi pecahan a/b vertikal sebagai HTML string.
export function fracHTML(a, b, colorClass = '') {
  return `<span class="vm-frac ${colorClass}">
    <span>${a}</span><span class="bar"></span><span>${b}</span>
  </span>`;
}

// SVG lingkaran pecahan: `filled` dari `total` potongan terisi warna.
export function fractionCircle(filled, total, color = '#5B8DEF', size = 130) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const slices = [];
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const d = total === 1
      ? `M ${cx} ${cy} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
      : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    const isFilled = i < filled;
    slices.push(
      `<path d="${d}" fill="${isFilled ? color : '#EEF2F7'}" stroke="#fff" stroke-width="2"/>`
    );
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img"
    aria-label="${filled} dari ${total} bagian">${slices.join('')}</svg>`;
}

// Pecahan bergaya makanan: lingkaran (pizza/kue) yang TETAP terbagi `total`
// irisan. `filled` irisan tampil "berisi", sisanya kosong. Realistis tapi tetap
// mengajarkan pecahan (bisa dibagi). kind = 'pizza' | 'cake'.
export function foodFraction(filled, total, size = 150, kind = 'pizza') {
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  const ri = r - Math.max(6, size * 0.06); // radius isi (di dalam tepi)
  const S = kind === 'cake'
    ? { rim: '#F472B6', fill: '#FBCFE8', empty: '#F1F5F9', dot: '#EF4444', dot2: '#ffffff' }
    : { rim: '#e0a763', fill: '#f6da77', empty: '#F1F5F9', dot: '#b21725', dot2: '#83bf4f' };
  const parts = [`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${S.rim}"/>`];
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const am = (a0 + a1) / 2;
    const x0 = cx + ri * Math.cos(a0), y0 = cy + ri * Math.sin(a0);
    const x1 = cx + ri * Math.cos(a1), y1 = cy + ri * Math.sin(a1);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const d = total === 1
      ? `M ${cx} ${cy} m -${ri},0 a ${ri},${ri} 0 1,0 ${ri * 2},0 a ${ri},${ri} 0 1,0 -${ri * 2},0`
      : `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${ri} ${ri} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
    const on = i < filled;
    parts.push(`<path d="${d}" fill="${on ? S.fill : S.empty}" stroke="#fff" stroke-width="2"/>`);
    if (on && total > 1) {
      const sw = a1 - a0;                 // lebar sudut irisan
      const pr = Math.max(2.5, ri * 0.085);
      // 2 topping utama (pepperoni/ceri) + 1 hiasan kecil (basil/sprinkle), tersebar dalam irisan
      [[0.64, 0, pr, S.dot], [0.40, -sw * 0.26, pr * 0.85, S.dot], [0.56, sw * 0.30, pr * 0.55, S.dot2]]
        .forEach(([rf, da, rr, col]) => {
          const ang = am + da;
          parts.push(`<circle cx="${(cx + ri * rf * Math.cos(ang)).toFixed(1)}" cy="${(cy + ri * rf * Math.sin(ang)).toFixed(1)}" r="${rr.toFixed(1)}" fill="${col}"/>`);
        });
    }
  }
  if (total === 1) { // utuh: sebar beberapa topping/hiasan
    [[0.5, 0], [-0.4, 0.3], [0.1, -0.45], [-0.2, -0.2], [0.35, 0.4]].forEach(([dx, dy]) =>
      parts.push(`<circle cx="${(cx + ri * dx).toFixed(1)}" cy="${(cy + ri * dy).toFixed(1)}" r="${(ri * 0.1).toFixed(1)}" fill="${S.dot}"/>`));
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${kind} ${filled} dari ${total} bagian">${parts.join('')}</svg>`;
}

// Alias pizza (kompatibilitas pemakaian lama, mis. inkuiri penyelidikan).
export function pizzaFraction(filled, total, size = 150) {
  return foodFraction(filled, total, size, 'pizza');
}

// Bar model: deretan kotak, `filled` dari `total` terisi.
export function barModel(filled, total, color = '#5B8DEF') {
  let cells = '';
  for (let i = 0; i < total; i++) {
    cells += `<div style="flex:1;height:2rem;border-radius:.4rem;background:${i < filled ? color : '#EEF2F7'};"></div>`;
  }
  return `<div style="display:flex;gap:.25rem;">${cells}</div>`;
}

// Bar model interaktif dengan slider. `onChange(value)` dipanggil saat digeser.
// Mengembalikan elemen DOM siap pasang.
export function interactiveBar(total, initial, color, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'vm-card';
  wrap.style.padding = '1rem';
  let val = initial;

  const label = document.createElement('div');
  label.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;font-weight:800;';

  const bar = document.createElement('div');
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = String(total); slider.value = String(initial);
  slider.style.width = '100%'; slider.style.marginTop = '.5rem';
  slider.setAttribute('aria-label', `Geser jumlah bagian terisi dari ${total}`);

  function render() {
    label.innerHTML = `<span style="color:var(--ink-soft)">Bagian terisi (penyebut ${total})</span>
      ${fracHTML(val, total)}`;
    bar.innerHTML = barModel(val, total, color);
  }
  slider.addEventListener('input', () => {
    val = Number(slider.value);
    render();
    onChange && onChange(val);
  });
  render();
  wrap.append(label, bar, slider);
  return wrap;
}
