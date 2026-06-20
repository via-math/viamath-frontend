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
