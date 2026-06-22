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
// irisan. `filled` irisan "berisi", sisanya kosong. Realistis (gradient, kerak,
// topping berkilau) tapi tetap mengajarkan pecahan. kind = 'pizza' | 'cake'.
let _ffId = 0;
export function foodFraction(filled, total, size = 150, kind = 'pizza') {
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  const ri = r - Math.max(5, size * 0.05); // radius isi (di dalam kerak/tepi)
  const id = 'ff' + (++_ffId);
  const styles = {
    // tops: [radiusFactor, offsetSudut(×lebarIrisan), ukuran(×ri), warna, tepi|null]
    pizza: {
      rim: '#d98c4a', rimInner: '#b9712b', g0: '#FCE9A6', g1: '#F0C544', empty: '#F1F5F9',
      tops: [[0.62, 0, 0.10, '#c0392b', '#8e2b21'], [0.40, -0.27, 0.085, '#c0392b', '#8e2b21'],
             [0.56, 0.30, 0.05, '#6aa84f', null], [0.30, 0.14, 0.042, '#6aa84f', null]],
    },
    cake: {
      rim: '#F7A8D0', rimInner: '#EC6FB0', g0: '#FFF1F8', g1: '#FBCFE8', empty: '#F1F5F9',
      tops: [[0.58, 0, 0.10, '#E11D48', null], [0.42, 0.26, 0.05, '#60A5FA', null],
             [0.50, -0.28, 0.05, '#FBBF24', null], [0.32, 0.10, 0.045, '#34D399', null]],
    },
  };
  const S = styles[kind] || styles.pizza;
  const parts = [
    `<defs><radialGradient id="${id}" cx="42%" cy="36%" r="68%"><stop offset="0" stop-color="${S.g0}"/><stop offset="1" stop-color="${S.g1}"/></radialGradient></defs>`,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${S.rim}"/>`,
  ];
  const place = (rf, ang, sf, fill, edge) => {
    const rr = Math.max(2, ri * sf);
    const x = cx + ri * rf * Math.cos(ang), y = cy + ri * rf * Math.sin(ang);
    const st = edge ? ` stroke="${edge}" stroke-width="${(rr * 0.28).toFixed(1)}"` : '';
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${fill}"${st}/>`);
    if (rr > ri * 0.07) parts.push(`<circle cx="${(x - rr * 0.32).toFixed(1)}" cy="${(y - rr * 0.32).toFixed(1)}" r="${(rr * 0.3).toFixed(1)}" fill="#fff" opacity="0.5"/>`);
  };
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const am = (a0 + a1) / 2, sw = a1 - a0;
    const x0 = cx + ri * Math.cos(a0), y0 = cy + ri * Math.sin(a0);
    const x1 = cx + ri * Math.cos(a1), y1 = cy + ri * Math.sin(a1);
    const large = sw > Math.PI ? 1 : 0;
    const d = total === 1
      ? `M ${cx} ${cy} m -${ri},0 a ${ri},${ri} 0 1,0 ${ri * 2},0 a ${ri},${ri} 0 1,0 -${ri * 2},0`
      : `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${ri} ${ri} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
    const on = i < filled;
    parts.push(`<path d="${d}" fill="${on ? `url(#${id})` : S.empty}" stroke="#fff" stroke-width="2"/>`);
    if (on && total > 1) S.tops.forEach(([rf, off, sf, fill, edge]) => place(rf, am + sw * off, sf, fill, edge));
  }
  if (total === 1) { // utuh: sebar topping ke seluruh permukaan
    [[0.5, 0], [0.5, 0.25], [0.5, 0.5], [0.5, 0.75], [0.26, 0.12], [0.26, 0.62], [0.72, 0.4], [0.72, 0.9]]
      .forEach(([rf, frac], idx) => { const t = S.tops[idx % 2]; place(rf, frac * 2 * Math.PI, t[2], t[3], t[4]); });
  }
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="${S.rimInner}" stroke-width="1.5" opacity="0.45"/>`);
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
