/* ============================================================
   MadRun - game.js
   BAGIAN 1: pengaturan dan data soal (mudah diubah)
   BAGIAN 2: mesin game (karakter, rintangan, nyawa, tantangan)
   ============================================================ */

// ===== BAGIAN 1: PENGATURAN =====
const CONFIG = {
  nama: "MadRun",        // ganti nama game cukup di sini
  nyawaAwal: 3,
  kecepatanJalan: 240,   // kecepatan berjalan (px/detik), dikendalikan pemain lewat keyboard
  kecepatanAwal: 280,    // piksel per detik
  kecepatanMaks: 520,    // batas agar game tidak mustahil
  percepatan: 6,         // tambahan kecepatan tiap detik
  gravitasi: 1800,
  kekuatanLompat: 620,
  skorFase2: 300,        // skor untuk masuk fase matematika
  bonusTantangan: 100,
};

// ===== DATA TANTANGAN MATEMATIKA =====
// Untuk menambah soal baru: tambahkan satu objek di CHALLENGES (lihat contoh di bawah).
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list, r) => (r < list.length ? list[r] : list[Math.floor(rand(0, list.length))]);
const susun = (arr, r) => (r === 0 ? arr.sort((x, y) => x - y) : arr.sort(() => Math.random() - 0.5)); // putaran 1 urut, berikutnya diacak
const ASET = (f) => (window.ASET_DATA && window.ASET_DATA[f]) || "assets/" + f;   // gambar: dari folder assets/ atau data tertanam
const mon = (i, k) => `<img class="mon" style="--k:${k}" src="${ASET(`mon${(i % 6) + 1}.png`)}" alt="">`;   // makhluk (aset karakter)
const mons = (n, k) => Array.from({ length: n }, (_, i) => mon(i, k)).join("");
const gcd = (x, y) => (y ? gcd(y, x % y) : x);

const CHALLENGES = [
  { // Tantangan A: Teorema Pythagoras (rintangan: tembok)
    obstacle: "wall",
    make(r) {                                   // r = sudah berapa kali soal ini muncul (soal makin bervariasi)
      const [a, b] = pick([[4, 3], [8, 6], [12, 5]], r);
      const c = Math.hypot(a, b);
      const k = 150 / Math.max(a, b), w = a * k, h = b * k;
      const svg = `<svg viewBox="0 0 200 140" width="200"><polygon points="20,125 ${20 + w},125 ${20 + w},${125 - h}" fill="#ffe08a" stroke="#1d2557" stroke-width="3"/><g fill="#1d2557" font-size="14" font-weight="700"><text x="${20 + w / 2}" y="138" text-anchor="middle">${a} satuan</text><text x="${26 + w}" y="${125 - h / 2}">${b}</text><text x="${20 + w / 2 - 22}" y="${125 - h / 2 - 6}" font-size="20" fill="#e63946">?</text></g></svg>`;
      return {
        unit: "satuan",
        mundo: { w: 432, h: 144, run: Math.round((a * 144) / b), trig: Math.round((a * 144) / b) + 60 },   // teras tingkat atas: tinggi 144 px (4 petak), panjang 432 px; papan mulai "run" px di depannya
        steps: [{ say: `Aku Jin Pintar! Ada tembok di depanmu. Jarak mendatar ke tembok ${a} satuan dan tinggi tembok ${b} satuan. Kita pasang papan miring!`, html: svg }],
        question: { say: "Berapa panjang minimal papan yang diperlukan untuk mencapai puncak penghalang?", html: svg },
        options: susun([a, c, a + b], r),
        solve: () => Math.hypot(a, b),          // jawaban dihitung dengan logika JS
        explain: `Papan adalah sisi miring segitiga siku-siku: c = √(${a}² + ${b}²) = √${a * a + b * b} = ${c} satuan.`,
      };
    },
  },
  { // Tantangan B: pembagian dan kebutuhan benda (rintangan: gerombolan makhluk)
    obstacle: "enemies",
    make(r) {
      const n = pick([27, 36, 45], r), jawab = n / 3;
      const tiga = [0, 1, 2].map((i) => `<div class="pair" style="animation-delay:${i * 0.7}s">${mon(i, 2)}<i class="bullet"></i></div>`).join("");
      const banyak = `<div class="grid">${mons(n, 1.4)}</div>`;
      return {
        unit: "pistol",
        mundo: { w: 130, h: 0, run: 0, trig: 300 },
        steps: [
          { say: "Gerombolan makhluk menghadang! Satu pistol berisi 3 peluru, dan setiap makhluk butuh 1 peluru. Perhatikan tiga makhluk ini.", html: tiga },
          { say: `Wah, sekarang ada ${n} makhluk sekaligus!`, html: banyak },
        ],
        question: { say: "Berapa pistol yang diperlukan agar semua makhluk dapat dihadapi dengan peluru yang cukup?", html: banyak },
        options: susun([jawab - 3, jawab, jawab + 3], r),
        solve: () => n / 3,
        explain: `Satu pistol punya 3 peluru, jadi ${n} ÷ 3 = ${jawab} pistol.`,
      };
    },
  },
  { // Tantangan C: Jembatan Dua Lampu (KPK). Dua lampu berkedip dengan periode berbeda; jin muncul setelah pemain sempat mengamati.
    obstacle: "hole", gaya: "lampu",
    make(r) {
      const [a, b] = [3, 6], kpk = (a * b) / gcd(a, b);
      return {
        unit: "detik", per: [a, b], pulse: 2, mundo: { w: 280, h: 0, run: 0, trig: 340 },
        demoEnd: 11.5, bridgeIn: 0.4, bridgeOut: 0.35,
        steps: [{ say: `Kedua lampu ini menyala setiap beberapa detik sekali. Jembatan hanya akan muncul ketika kedua lampu menyala bersamaan! Hitung KPK dari interval kedua lampu untuk mengetahui kapan kamu bisa menyeberang. Lampu A: tiap ${a} detik, lampu B: tiap ${b} detik.`, html: `<div class="hint">Demonstrasi: A dan B menyala bersama pada detik ke-${kpk}.<br>A: tiap ${a} detik &nbsp;|&nbsp; B: tiap ${b} detik</div>` }],
        question: { say: `Berapa detik sekali kedua lampu menyala bersamaan?`, html: `<div class="hint">A: tiap ${a} detik &nbsp;|&nbsp; B: tiap ${b} detik</div>` },
        options: susun([kpk, a + b, a * b], r),
        solve: () => (a * b) / gcd(a, b),
        explain: `Keduanya menyala bersamaan pada kelipatan persekutuan terkecil: KPK(${a}, ${b}) = ${kpk} detik. Jembatan aktif!`,
      };
    },
  },
  { // Tantangan D: Gerbang Kode Rahasia (pola bilangan)
    obstacle: "gua",
    make(r) {
      const P = pick([
        { s: [2, 4, 6, 8], next: (s) => s[s.length - 1] + (s[1] - s[0]), salah: [9, 12], why: "Setiap angka bertambah 2" },
        { s: [3, 6, 12, 24], next: (s) => s[s.length - 1] * (s[1] / s[0]), salah: [36, 30], why: "Setiap angka dikali 2" },
        { s: [1, 4, 9, 16], next: (s) => (s.length + 1) ** 2, salah: [20, 24], why: "Angkanya kuadrat: 1², 2², 3², 4²" },
        { s: [1, 1, 2, 3, 5], next: (s) => s[s.length - 1] + s[s.length - 2], salah: [7, 10], why: "Setiap angka adalah jumlah dua angka sebelumnya" },
      ], r), ans = P.next(P.s);
      const peta = `<div class="hint kode">${P.s.join(" &nbsp; ")} &nbsp; ?</div>`;
      return {
        unit: "", mundo: { w: 54, h: 0, run: 0, trig: 260 }, ukir: P.s.join("  ") + "  ?",
        steps: [{ say: "Gerbang batu kuno! Di ukirannya ada deretan angka misterius. Gerbang hanya terbuka jika kode yang hilang ditemukan.", html: peta }],
        question: { say: "Angka apa yang menggantikan tanda tanya agar pola ukiran lengkap?", html: peta },
        options: susun([ans, ...P.salah], r),
        solve: () => P.next(P.s),
        explain: `${P.why}, jadi angka berikutnya adalah ${ans}. Gerbang terbuka!`,
      };
    },
  },
  { // Tantangan E: Jembatan Diameter Lingkaran (luas setengah lingkaran, pi = 22/7)
    obstacle: "hole", gaya: "semi",
    make(r) {
      const rad = pick([7, 14, 21], r), luas = (11 * rad * rad) / 7, d = 2 * rad;   // luas = 1/2 x 22/7 x r^2
      const svg = `<svg viewBox="0 0 220 125" width="220"><path d="M10 20A100 100 0 0 0 210 20Z" fill="#241a3b"/><line x1="10" y1="20" x2="210" y2="20" stroke="#e0a96d" stroke-width="6" stroke-dasharray="8 5"/><g fill="#fff" font-size="15" font-weight="700" text-anchor="middle"><text x="110" y="65">A = ${luas} m²</text><text x="110" y="88">π = 22/7</text></g><text x="110" y="12" text-anchor="middle" font-size="15" font-weight="700" fill="#e63946">jembatan = ? meter</text></svg>`;
      return {
        unit: "meter", luas, mundo: { w: 200, h: 0, run: 0, trig: 340, amati: 1.5 },
        steps: [{ say: `Lubang besar berbentuk setengah lingkaran! Luasnya ${luas} meter persegi (gunakan π = 22/7). Jembatan harus sepanjang diameter lubang.`, html: svg }],
        question: { say: "Berapa panjang jembatan yang dibutuhkan untuk menyeberang?", html: svg },
        options: susun([rad, d, 2 * d], r),
        solve: () => Math.sqrt((2 * luas * 7) / 22) * 2,
        explain: `Luas = ½ × π × r², jadi ${luas} = ½ × 22/7 × r², r² = ${rad * rad}, r = ${rad} m. Diameter = 2 × ${rad} = ${d} meter.`,
      };
    },
  },
  { // Tantangan F: Timbangan Kristal Ajaib. Nilai kristal disimpulkan dari petunjuk penimbangan.
    obstacle: "pintu",
    make(r) {
      const P = pick([
        { v: [3, 2, 4], kiri: [2, 2, 1], kanan: [0, 0] },
        { v: [2, 3, 5], kiri: [2, 2], kanan: [1, 0, 0] },
        { v: [4, 1, 3], kiri: [2, 2, 2], kanan: [0, 1] },
      ], r), v = P.v, NAMA = ["Merah", "Biru", "Hijau"];
      const jum = (a) => a.reduce((t, i) => t + v[i], 0), gem = (i) => `<i class="gem g${i}"></i>`, kumpul = (a) => a.map(gem).join("");
      const butuh = () => jum(P.kiri) - jum(P.kanan);
      const petunjuk = `<div class="hint">${gem(0)}${gem(0)} = ${2 * v[0]}<br>${gem(0)}${gem(1)} = ${v[0] + v[1]}<br>${gem(2)}${gem(1)} = ${v[2] + v[1]}</div>`;
      const papan = (x) => `<div class="tim"><div>${kumpul(P.kiri)}</div><b>=</b><div>${kumpul(P.kanan)}${x}</div></div>`;
      return {
        mundo: { w: 54, h: 0, run: 0, trig: 40 }, ukir: "SEIMBANG",   // trig kecil: jin baru muncul setelah pemain keluar dari lorong
        steps: [
          { say: "Pintu kuno ini hanya terbuka jika kedua sisi timbangan seimbang. Tiap warna kristal punya berat sendiri. Pelajari petunjuk penimbangan ini.", html: petunjuk },
          { say: "Sisi kiri timbangan lebih berat. Sisi kanan perlu satu kristal lagi.", html: papan('<i class="gem q">?</i>') },
        ],
        question: { say: "Kristal mana yang harus ditaruh di sisi kanan agar timbangan seimbang?", html: papan('<i class="gem q">?</i>') },
        options: susun([...v], r), label: (x) => "Kristal " + NAMA[v.indexOf(x)],   // jawaban dinilai dari nilai kristal, bukan urutan tombol
        solve: butuh,
        hasil: (x) => `<div class="tim"><div>${kumpul(P.kiri)}</div><b>${jum(P.kiri)} ${jum(P.kiri) === jum(P.kanan) + x ? "=" : "≠"} ${jum(P.kanan) + x}</b><div>${kumpul(P.kanan)}${gem(v.indexOf(x))}</div></div>`,
        explain: `Dari petunjuk: Merah = ${v[0]}, Biru = ${v[1]}, Hijau = ${v[2]}. Kiri = ${jum(P.kiri)}, kanan sekarang = ${jum(P.kanan)}, jadi perlu ${butuh()}: Kristal ${NAMA[v.indexOf(butuh())]}.`,
      };
    },
  },
  { // Tantangan G: Gua Runtuh dengan Sepatu Kecepatan (jarak = kecepatan x waktu). 1 meter = 60 px, jadi lari normal 4 m/detik = 240 px/detik.
    obstacle: "lorong",
    make(r) {
      const [L, T] = pick([[30, 5], [36, 6], [42, 6]], r), vmin = L / T, v = [vmin - 2, vmin - 1, vmin + 1];
      const info = `<div class="hint">Panjang lorong: ${L} m<br>Waktu sebelum runtuh: ${T} detik<br>Lari normalmu: 4 m/detik</div>`;
      return {
        unit: "m/detik", v: vmin + 1, T, mundo: { w: L * 60, h: 0, run: 0, trig: 30 },
        steps: [
          { say: `Awas, gua mulai runtuh! Lorong ${L} meter ini roboh dalam ${T} detik, padahal larimu hanya 4 meter per detik.`, html: info },
          { say: "Aku punya Sepatu Kecepatan. Pilih yang cukup cepat agar kamu keluar sebelum lorong roboh!", html: info },
        ],
        question: { say: "Sepatu berkecepatan berapa yang membuatmu sampai di ujung lorong tepat waktu?", html: info },
        options: susun(v, r),
        solve: () => v.find((x) => x * T >= L),     // hanya satu pilihan yang cukup: jarak = kecepatan x waktu
        explain: `Jarak = kecepatan x waktu, jadi kecepatan minimal ${L} / ${T} = ${vmin} m/detik. Sepatu ${vmin + 1} m/detik menempuh ${(vmin + 1) * T} m dalam ${T} detik. Sepatu aktif, lari ke ujung lorong!`,
      };
    },
  },
];
const URUTAN = [0, 1, 2, [3, 6, 5], 4];   // urutan rintangan fase 2 (tetap, tidak acak); [3,6,5] = paket gua: gerbang kode -> lorong runtuh -> pintu timbangan

// ===== BAGIAN 2: MESIN GAME =====
const W = 800, H = 450, GROUND_Y = 340, CAM_X = 300;   // CAM_X: batas kamera, lewat ini dunia yang bergeser
const FONT = '"Trebuchet MS", system-ui, sans-serif';
const $ = (id) => document.getElementById(id);
const canvas = $("game"), ctx = canvas.getContext("2d"), hctx = $("hero").getContext("2d");
const KEY = "madrun-skor-tertinggi";
let best = 0, state = "menu", G, dist = 0, held = false, keys = {};   // state: menu | play | challenge | over
try { best = +localStorage.getItem(KEY) || 0; } catch (e) {}   // kalau penyimpanan gagal, game tetap jalan

const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ---------- Data satu sesi permainan (dibuat ulang tiap main baru) ----------
function newGame() {
  G = { lives: CONFIG.nyawaAwal, score: 0, time: 0, speed: CONFIG.kecepatanAwal, phase: 1, anim: 0, face: 1, tema: 0, temaLama: 0, mix: 1,
    obs: [], cursor: W + 300, gapCount: 0, nextMath: 0, rounds: CHALLENGES.map(() => 0),
    parts: [], banner: 0, flash: 0, shake: 0, ch: null,
    p: { x: 150, y: GROUND_Y, vy: 0, onGround: true, falling: false, cut: false, blink: 0, buffer: 0 } };
}

// ---------- Rintangan: dibuat terus-menerus di sisi kanan layar ----------
function buatRintangan(ci, x) {                      // satu rintangan matematika di posisi x
  const def = CHALLENGES[ci], inst = def.make(G.rounds[ci]++), m = inst.mundo;
  return { type: def.obstacle, gaya: def.gaya, ci, inst, x: x + m.run, w: m.w, top: def.obstacle === "wall" ? GROUND_Y - m.h : 0, trig: m.trig, solid: def.obstacle !== "lorong", lampTime: 0, bridgeProgress: 0, bridgeWanted: false };
}
function spawn() {
  while (G.cursor < W + 200) {
    let ob;
    if (G.phase === 2 && G.gapCount >= 2) {          // fase 2: setiap 2 lubang muncul 1 rintangan atau 1 paket gua
      const grup = [].concat(URUTAN[G.nextMath++ % URUTAN.length]);
      ob = []; let x = G.cursor;
      for (const ci of grup) { const o = buatRintangan(ci, x); ob.push(o); x = o.x + o.w + 60; }
      if (ob.length > 1) ob[0].grup = ob;            // paket gua dibangun berurutan dan digambar sebagai satu lingkungan
      G.gapCount = 0;
    } else {
      ob = [{ type: "hole", x: G.cursor, w: rand(50, 70 + Math.min(25, G.score / 30)) }];   // makin jauh makin lebar, tetap bisa dilompati
      G.gapCount++;
    }
    G.obs.push(...ob);
    const akhir = ob[ob.length - 1];
    G.cursor = akhir.x + akhir.w + rand(320, 560);   // jarak cukup untuk mendarat dan melihat rintangan berikutnya
  }
}

// ---------- Efek partikel (debu, bintang, dll.) ----------
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) G.parts.push({ x, y, vx: rand(-140, 140), vy: rand(-220, -40), r: rand(2, 5), life: 0.6, max: 0.6, c: color });
}

// ---------- Nyawa ----------
function loseLife() { G.lives--; G.flash = 0.5; G.shake = 0.4; burst(G.p.x, G.p.y - 30, "#ff5a5f", 16); }

function onFell() {                                  // dipanggil sekali per jatuh
  loseLife();
  if (G.lives <= 0) return gameOver();
  const p = G.p;
  p.y = GROUND_Y; p.vy = 0; p.onGround = true; p.falling = false; p.blink = 1.5;   // kembali ke posisi aman
  G.obs = G.obs.filter((o) => !(o.type === "hole" && o.x < p.x + 350 && o.x + o.w > p.x - 80)); // bersihkan lubang di sekitar
}

// ---------- Karakter: gravitasi, lompat, deteksi jatuh ----------
// Permukaan yang bisa diinjak di posisi x: tanah, atau papan/jembatan (o.plat). Infinity = jurang.
function supportY(x) {
  let y = G.obs.some((o) => o.type === "hole" && x > o.x + 8 && x < o.x + o.w - 8) ? Infinity : GROUND_Y;
  for (const o of G.obs) for (const g of (o.gaya === "lampu" ? (o.bridgeWanted && o.bridgeProgress >= 1 ? o.plat || [] : []) : o.plat || []))   // jembatan lampu hanya menopang saat kedua lampu ON dan sudah terangkat penuh
    if (x >= o.x + g.a && x <= o.x + g.b) y = Math.min(y, g.y0 + ((g.y1 - g.y0) * (x - o.x - g.a)) / (g.b - g.a));
  return y;
}
// Gerak horizontal. Benda padat (tembok, makhluk) menghalangi selama kaki masih di bawah puncaknya.
function geser(dx) {
  const p = G.p, HB = 6;
  for (const o of G.obs) if (o.solid && p.y > o.top + 8) {
    if (dx > 0 && p.x + HB <= o.x + 1) dx = Math.min(dx, Math.max(0, o.x - (p.x + HB)));
    if (dx < 0 && p.x - HB >= o.x + o.w - 1) dx = Math.max(dx, Math.min(0, o.x + o.w - (p.x - HB)));
  }
  let nx = p.x + dx, gulir = 0;
  if (nx > CAM_X) { gulir = nx - CAM_X; nx = CAM_X; }   // lewat batas kamera: dunia yang bergeser, bukan karakter
  p.x = Math.max(40, nx);
  if (gulir > 0) { for (const o of G.obs) o.x -= gulir; G.cursor -= gulir; dist += gulir; G.score += gulir * 0.1; }
}
function updatePlayer(dt) {
  const p = G.p, py = p.y;
  p.buffer -= dt;                                    // "buffer": tekan sedikit sebelum mendarat tetap terhitung
  if (p.buffer > 0 && p.onGround && !p.falling) { p.vy = -CONFIG.kekuatanLompat; p.onGround = false; p.cut = true; p.buffer = 0; burst(p.x, p.y, "#fff", 6); }
  if (p.cut && !held && p.vy < -CONFIG.kekuatanLompat * 0.6) p.vy = -CONFIG.kekuatanLompat * 0.6;   // lepas tombol = lompatan pendek
  p.vy += CONFIG.gravitasi * dt; p.y += p.vy * dt;
  if (p.falling) { if (p.y > H + 80) onFell(); return; }
  const s = supportY(p.x);
  if (p.onGround) {
    if (s === Infinity) { p.falling = true; p.onGround = false; }       // tidak ada tanah: jatuh
    else if (s - p.y > 14) p.onGround = false;                          // melangkah dari tepi: mulai turun
    else { p.y = s; p.vy = 0; }                                         // berjalan mengikuti permukaan (termasuk tanjakan papan)
  } else if (p.vy >= 0 && p.y >= s && py <= s + 8) {                    // mendarat dari atas
    burst(p.x, s, "#e8d9b5", 8); p.y = s; p.vy = 0; p.onGround = true;
  } else if (p.y > GROUND_Y + 2 && s === Infinity) p.falling = true;    // melewati tanah di atas lubang
}

// ---------- Tantangan matematika ----------
function checkChallenge(dt) {                        // jin muncul saat karakter mendekati rintangan (berbasis posisi)
  const p = G.p;
  if (p.falling) return;
  for (const o of G.obs) {
    if (!o.inst || o.started || o.x - (p.x + 6) > o.trig) continue;
    if (o.gaya === "lampu") {
      o.lampActive = true;
      if (o.lampTime >= o.inst.demoEnd) { o.started = true; startChallenge(o); return; }
    } else {
      o.t = (o.t || 0) + dt;
      const amati = o.inst.mundo.amati || 0;
      if (o.t >= amati && (o.gaya !== "semi" || p.onGround)) { o.started = true; startChallenge(o); return; }
    }
  }
}
function lampuNyala(o, i) {
  const t = o.lampTime, p = o.inst.per[i], durasi = o.inst.pulse;
  return t >= p && ((t % p) < durasi);
}
function updateJembatanLampu(dt) {
  for (const o of G.obs) {
    if (o.gaya !== "lampu" || !o.lampActive) continue;
    o.lampTime += dt;
    const bersama = lampuNyala(o, 0) && lampuNyala(o, 1);
    o.bridgeWanted = bersama;
    const laju = dt / (bersama ? o.inst.bridgeIn : o.inst.bridgeOut);
    o.bridgeProgress = Math.max(0, Math.min(1, o.bridgeProgress + (bersama ? laju : -laju)));
    if (o.solved && !o.plat) o.plat = [{ a: 0, b: o.w, y0: GROUND_Y, y1: GROUND_Y }];
  }
}
function jalankanLorong(dt, dir) {                   // lari menembus gua runtuh; waktu berjalan setelah pemain mulai bergerak
  const r = G.run, o = r.o, p = G.p;
  if (!r.jalan && dir) r.jalan = true;
  if (r.jalan) r.sisa -= dt;
  if (Math.random() < 0.5) G.parts.push({ x: rand(0, W), y: GROUND_Y - 216, vx: rand(-20, 20), vy: 40, r: rand(2, 5), life: 0.9, max: 0.9, c: "#8a8f99" });   // batu jatuh dari langit-langit
  if (p.x > o.x + o.w) { G.run = null; G.shoe = null; G.score += CONFIG.bonusTantangan; burst(p.x, p.y - 30, "#ffd54f", 20); return; }   // sampai ujung: selamat
  if (r.sisa <= 0) {                                 // terlambat: lorong runtuh (animasi tidak grafis: guncangan + kilatan)
    loseLife();
    if (G.lives <= 0) return gameOver();
    const dx = p.x + 6 + 40 - o.x; for (const q of G.obs) q.x += dx; G.cursor += dx; dist -= dx;   // kembali ke mulut lorong untuk mencoba lagi
    r.sisa = r.T; r.jalan = false;
  }
}
function gantiTema() { G.temaLama = G.tema; G.tema = (G.tema + 1) % TEMA.length; G.mix = 0; }   // pemandangan berganti perlahan
function startChallenge(o) {
  G.ch = { o, inst: o.inst, step: 0, answered: false, ok: false };
  state = "challenge";                               // dunia berhenti selama soal tampil
  showStep();
}
function showStep() {
  const c = G.ch, i = c.inst, last = c.step >= i.steps.length;
  const s = last ? i.question : i.steps[c.step];
  show("challenge");
  $("say").textContent = s.say; $("cvis").innerHTML = s.html; $("copts").innerHTML = "";
  $("cnext").classList.toggle("hidden", last);
  $("cnext").textContent = "Lanjut";
  if (last) i.options.forEach((v) => {
    const b = document.createElement("button");
    b.className = "opt"; b.textContent = i.label ? i.label(v) : `${v} ${i.unit}`; b.dataset.v = v;
    b.onclick = () => answer(v);
    $("copts").appendChild(b);
  });
}
function answer(v) {
  const c = G.ch;
  if (c.answered) return;                            // satu soal hanya dinilai sekali
  c.answered = true;
  const benar = c.inst.solve();
  c.ok = Math.abs(v - benar) < 1e-9; if (c.inst.hasil) $("cvis").innerHTML = c.inst.hasil(v);                 // pemeriksaan jawaban dengan logika JS
  document.querySelectorAll(".opt").forEach((b) => {
    b.disabled = true;
    if (Math.abs(b.dataset.v - benar) < 1e-9) b.classList.add("benar"); else if (+b.dataset.v === v) b.classList.add("salah");
  });
  if (c.ok) { G.score += CONFIG.bonusTantangan; burst(G.p.x, GROUND_Y - 40, "#ffd54f", 20); } else loseLife();
  $("say").textContent = (c.ok ? "Hebat, jawabanmu tepat! " : "Hampir benar, ayo belajar bersama! ") + c.inst.explain;
  $("cnext").textContent = G.lives <= 0 ? "Lihat Hasil" : "Lanjutkan Petualangan";
  $("cnext").classList.remove("hidden");
}
function finishChallenge() {
  const { o, ok } = G.ch, m = o.inst.mundo;
  show(null);
  if (!ok || o.type === "enemies") { o.dead = true; burst(o.x + o.w / 2, GROUND_Y - 30, ok ? "#ffd54f" : "#b39ddb", 18); }   // salah: rintangan dibersihkan; makhluk: hilang
  else if (o.type === "wall") { o.solved = true; o.plat = [{ a: -m.run, b: 0, y0: GROUND_Y, y1: o.top }, { a: 0, b: o.w, y0: o.top, y1: o.top }]; }   // papan miring + puncak tembok bisa diinjak
  else if (o.type === "hole") { o.solved = true; o.solid = false; if (o.gaya === "lampu") o.lampActive = true; else o.plat = [{ a: 0, b: o.w, y0: GROUND_Y, y1: GROUND_Y }]; }   // jembatan KPK tetap mengikuti lampu; lubang lain tetap memakai platform biasa
  else if (o.type === "lorong") { G.run = { o, T: o.inst.T, sisa: o.inst.T, jalan: false }; G.shoe = o.inst.v; }   // sepatu aktif; waktu mulai saat pemain bergerak
  else o.open = 0;                                   // gerbang / pintu: animasi terbuka, lalu tidak padat lagi
  G.ch = null; state = "play"; gantiTema();
}

function show(id) { document.querySelectorAll(".overlay").forEach((e) => e.classList.add("hidden")); if (id) $(id).classList.remove("hidden"); }
function startGame() { newGame(); state = "play"; show(null); }
function toMenu() { newGame(); state = "menu"; show("menu"); }
function gameOver() {
  state = "over";
  const s = Math.floor(G.score);
  if (s > best) { best = s; try { localStorage.setItem(KEY, s); } catch (e) {} }
  $("finalScore").textContent = s; $("bestScore").textContent = best;
  show("over");
}

function tickEffects(dt) {
  for (const k of ["banner", "flash", "shake"]) G[k] = Math.max(0, G[k] - dt);
  G.p.blink = Math.max(0, G.p.blink - dt);
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.life -= dt; }
  G.parts = G.parts.filter((q) => q.life > 0);
}
function update(dt) {
  tickEffects(dt);
  updateJembatanLampu(dt);
  if (state === "menu") { dist += 40 * dt; G.anim += dt; return; }
  if (state !== "play") return;                      // tantangan / game over: dunia berhenti
  const p = G.p;
  const dir = p.falling ? 0 : (keys.right ? 1 : 0) - (keys.left ? 1 : 0);   // karakter hanya bergerak jika pemain menekan tombol
  if (dir) { G.face = dir; G.anim += dt; }
  geser(dir * (G.shoe ? G.shoe * 60 : CONFIG.kecepatanJalan) * dt);   // sepatu kecepatan: m/detik x 60 px           // dikali dt: kecepatan sama di berapa pun frame rate
  if (G.run) { jalankanLorong(dt, dir); if (state !== "play") return; }
  if (G.phase === 1 && G.score >= CONFIG.skorFase2) { G.phase = 2; G.banner = 3.5; gantiTema(); }
  if (G.mix < 1) G.mix = Math.min(1, G.mix + dt);
  G.obs = G.obs.filter((o) => { const z = o.grup ? o.grup[o.grup.length - 1] : o; return !o.dead && z.x + z.w > -60; });   // buang rintangan yang sudah lewat
  for (const o of G.obs) if (o.open !== undefined && o.open < 1) { o.open = Math.min(1, o.open + dt * 0.8); if (o.open >= 1) o.solid = false; }   // pintu/gerbang terbuka perlahan
  spawn(); updatePlayer(dt); checkChallenge(dt);
}

// ---------- Menggambar ----------
// ---------- Karakter: sprite buatan sendiri (tiap frame 128x128, kaki sekitar baris ke-80) ----------
// Di GitHub Pages gambar dimuat dari folder assets/. Di halaman gabungan, gambar diambil dari window.ASET_DATA.
const muat = (awalan, n) => Array.from({ length: n }, (_, i) => { const im = new Image(); im.src = ASET(`${awalan}${i + 1}.png`); return im; });
const SKALA = 2;                                     // perbesaran sprite (pixel art, jadi dibuat tajam)
const SPRITE = {                                     // ax, ay = titik pijak kaki di dalam gambar
  lari:   { frames: muat("lari", 10), fps: 13, ax: 64, ay: 80 },
  idle:   { frames: muat("idle", 10), fps: 8,  ax: 63, ay: 80 },
  lompat: { frames: muat("jump", 6),  ax: 61, ay: 80 },
};
function drawPlayer(c, x, y, t, mode, s = 1, vy = 0, face = 1) {   // (x,y) = telapak kaki; mode: run | idle | jump | fall
  const a = SPRITE[mode === "run" ? "lari" : mode === "idle" ? "idle" : "lompat"];
  let i;
  if (mode === "run") i = Math.floor(t * a.fps) % 10;                          // t hanya maju saat bermain
  else if (mode === "idle") i = Math.floor((performance.now() / 1000) * a.fps) % 10;
  else if (mode === "fall") i = 5;
  else i = 1 + Math.min(4, Math.max(0, Math.floor(((vy + 700) / 1400) * 5)));  // jump2..jump6 mengikuti naik-turunnya lompatan
  const im = a.frames[i];
  if (!im.complete || !im.naturalWidth) return;      // gambar belum selesai dimuat
  const k = SKALA * s;
  c.save(); c.imageSmoothingEnabled = false; c.translate(x, y); c.scale(face, 1);   // face -1 = menghadap kiri
  if (mode === "fall") c.rotate(0.4);
  c.drawImage(im, -a.ax * k, -a.ay * k, 128 * k, 128 * k);
  c.restore();
}
function drawMon(c, x, y, i, t, k) {                 // makhluk dari aset karakter; (x,y) = tengah-bawah
  const im = MON[i % 6];
  if (!siap(im)) return;
  const bob = Math.abs(Math.sin(t * 5 + i)) * 4;
  c.save(); c.imageSmoothingEnabled = false;
  c.drawImage(im, Math.round(x - 12 * k), Math.round(y - 24 * k - bob), 24 * k, 24 * k);
  c.restore();
}
function heart(c, x, y, s, full) {
  c.save(); c.translate(x, y); c.scale(s, s); c.beginPath();
  c.moveTo(0, 0.6); c.bezierCurveTo(-1.3, -0.2, -0.7, -1, 0, -0.4); c.bezierCurveTo(0.7, -1, 1.3, -0.2, 0, 0.6);
  c.fillStyle = full ? "#ff3b5c" : "rgba(0,0,0,.35)"; c.fill(); c.lineWidth = 0.12; c.strokeStyle = "#fff"; c.stroke(); c.restore();
}
// ---------- Latar & tanah dari aset tilemap ----------
const gambar = (f) => { const im = new Image(); im.src = ASET(f); return im; };
const siap = (im) => im.complete && im.naturalWidth > 0;
const MON = Array.from({ length: 6 }, (_, i) => gambar(`mon${i + 1}.png`));
const TEMA = [0, 1, 2].map((n) => ({ langit: gambar(`latar${n}_langit.png`), bukit: gambar(`latar${n}_bukit.png`), dasar: gambar(`latar${n}_dasar.png`) }));   // siang, senja, hijau
const TANAH = { rumput: [1, 2].map((n) => gambar(`tanah_rumput${n}.png`)), tanah: [1, 2].map((n) => gambar(`tanah_tanah${n}.png`)) };
const KIRI = { rumput: gambar("tanah_rumput_kiri.png"), tanah: gambar("tanah_tanah_kiri.png") }, KANAN = { rumput: gambar("tanah_rumput_kanan.png"), tanah: gambar("tanah_tanah_kanan.png") }, PINTU = gambar("pintu_gua.png");
const PS = 4;                                        // perbesaran latar: petak 24 px menjadi 96 px
function lajur(im, y, f) {                           // satu lajur latar yang berulang ke samping dan bergeser dengan faktor f
  if (!siap(im)) return;
  const w = im.width * PS, h = im.height * PS;
  for (let x = -Math.floor((dist * f) % w); x < W; x += w) ctx.drawImage(im, x, y, w, h);
}
function gambarTema(n) {
  const t = TEMA[n];
  for (let y = GROUND_Y - 3 * 96; y > -96; y -= 96) lajur(t.langit, y, 0.03);
  lajur(t.bukit, GROUND_Y - 2 * 96, 0.2); lajur(t.dasar, GROUND_Y - 96, 0.2);
}
function drawBackground() {
  ctx.imageSmoothingEnabled = false;
  gambarTema(G.mix < 1 ? G.temaLama : G.tema);
  if (G.mix < 1) { ctx.globalAlpha = G.mix; gambarTema(G.tema); ctx.globalAlpha = 1; }   // peralihan halus antar tema
}
function drawGround() {                              // tanah dari petak tilemap; lubang = celah gelap
  ctx.fillStyle = "#241a3b"; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  const seg = (a, b) => {
    if (b <= a) return;
    ctx.save(); ctx.beginPath(); ctx.rect(a, GROUND_Y, b - a, H); ctx.clip(); ctx.imageSmoothingEnabled = false;
    const n0 = Math.floor(dist / 36), mulai = -Math.floor(dist % 36);
    for (let r = 0, y = GROUND_Y; y < H; r++, y += 36)
      for (let k = 0, x = mulai; x < W; k++, x += 36) { const im = (r ? TANAH.tanah : TANAH.rumput)[(n0 + k) % 2]; if (siap(im)) ctx.drawImage(im, x, y, 36, 36); }
    ctx.restore();
  };
  let x = 0;
  for (const h of G.obs.filter((o) => o.type === "hole" && o.gaya !== "semi").sort((a, b) => a.x - b.x)) { seg(x, Math.min(h.x, W)); x = Math.max(x, h.x + h.w); }
  seg(x, W);
}
function teks(t, x, y, ukuran, warna) { ctx.font = `bold ${ukuran}px ${FONT}`; ctx.textAlign = "center"; ctx.fillStyle = warna; ctx.fillText(t, x, y); }
function blok(x, y, w, h, rumput = true) {           // blok tanah dari petak tilemap (36 px): rumput di atas, tepi kiri/kanan bertepi
  x = Math.round(x); const n = Math.ceil(w / 36);
  for (let r = 0, yy = y; yy < y + h - 1; r++, yy += 36)
    for (let k = 0; k < n; k++) {
      const set = r || !rumput ? "tanah" : "rumput", im = k === 0 ? KIRI[set] : k === n - 1 ? KANAN[set] : TANAH[set][k % 2];
      if (siap(im)) ctx.drawImage(im, x + k * 36, yy, 36, 36);
    }
}
function jembatan(o) {                               // papan miring: ujung bawah di tanah, ujung atas bertumpu DI ATAS permukaan teras
  const x0 = o.x - o.inst.mundo.run;
  ctx.lineCap = "butt"; ctx.strokeStyle = "#e0a96d"; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(x0, GROUND_Y + 5); ctx.lineTo(o.x, o.top + 5); ctx.lineTo(o.x + 30, o.top + 5); ctx.stroke();
  ctx.strokeStyle = "#7a4a1f"; ctx.lineWidth = 4;   // pagar dan tiang
  ctx.beginPath(); ctx.moveTo(x0, GROUND_Y - 30); ctx.lineTo(o.x, o.top - 30);
  for (let i = 0; i <= 4; i++) { const px = x0 + ((o.x - x0) * i) / 4, py = GROUND_Y + ((o.top - GROUND_Y) * i) / 4; ctx.moveTo(px, py); ctx.lineTo(px, py - 30); }
  ctx.stroke();
}
function papan(x, y, isi) {                          // papan petunjuk kayu berisi ukiran / teks
  ctx.fillStyle = "#7a4a1f"; ctx.fillRect(x + 62, y + 34, 6, 40); rr(ctx, x, y, 130, 38, 6); ctx.fill();
  teks(isi, x + 65, y + 25, 13, "#fff");
}
function drawGua(o) {                                // lingkungan gua: atap bukit, ruang dalam gelap, ambang di atas kedua pintu
  const e = o.grup[o.grup.length - 1], x0 = o.x, x1 = e.x + e.w, T = GROUND_Y - 288, C = GROUND_Y - 216, P = GROUND_Y - 108;
  ctx.fillStyle = "#1a1428"; ctx.fillRect(x0, C, x1 - x0, GROUND_Y - C);
  blok(x0, T, x1 - x0, C - T); blok(x0, C, o.w, P - C, false); blok(e.x, C, e.w, P - C, false);
  if (G.run) { ctx.strokeStyle = "#0d0a14"; ctx.lineWidth = 3; ctx.beginPath(); for (let x = x0 + 60; x < x1; x += 90) { ctx.moveTo(x, C); ctx.lineTo(x + 10, C + 22); ctx.lineTo(x - 6, C + 40); } ctx.stroke(); }   // retakan saat runtuh
}
function drawLain(o) {                               // pintu gua, pintu kristal, jurang lampu, lubang setengah lingkaran
  if (o.type === "gua" || o.type === "pintu") {
    if (o.grup) drawGua(o);
    const op = o.open || 0;
    if (op) { ctx.fillStyle = "#1a1428"; ctx.fillRect(o.x, GROUND_Y - 108, 54, 108); }
    if (siap(PINTU)) ctx.drawImage(PINTU, Math.round(o.x), GROUND_Y - 108, Math.max(6, 54 * (1 - op)), 108);   // pintu mengayun terbuka dari engsel kiri
    if (!op) papan(o.x - 150, GROUND_Y - 150, o.inst.ukir);
    return;
  }
  if (o.gaya === "semi") { ctx.fillStyle = "#241a3b"; ctx.beginPath(); ctx.arc(o.x + o.w / 2, GROUND_Y, o.w / 2, 0, Math.PI); ctx.fill(); teks(`A = ${o.inst.luas} m²`, o.x + o.w / 2, GROUND_Y + 50, 17, "#fff"); }
  if (o.gaya === "lampu") {
    if (o.bridgeProgress > 0.01) {
      const lift = 54 * (1 - o.bridgeProgress), top = GROUND_Y + lift;
      ctx.save(); ctx.globalAlpha = Math.min(1, o.bridgeProgress * 1.8);
      ctx.fillStyle = "#6b391e"; ctx.fillRect(o.x, top, o.w, 9);
      ctx.fillStyle = "#e0a96d"; ctx.fillRect(o.x + 2, top - 7, o.w - 4, 8);
      ctx.fillStyle = "#ffd59a";
      for (let x = o.x + 10; x < o.x + o.w - 5; x += 24) ctx.fillRect(x, top - 6, 2, 6);
      ctx.strokeStyle = "#8b552c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, top - 11); ctx.lineTo(o.x + o.w, top - 11); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 2; i++) {
      const nyala = lampuNyala(o, i), lx = o.x - 45 - i * 55, ly = GROUND_Y - 100;
      ctx.fillStyle = "#555"; ctx.fillRect(lx - 3, GROUND_Y - 90, 6, 90);
      ctx.save(); ctx.shadowColor = nyala ? (i ? "#79e7ff" : "#ffe066") : "transparent"; ctx.shadowBlur = nyala ? 28 : 0;
      dot(ctx, lx, ly, nyala ? 17 : 12, nyala ? (i ? "#b8f4ff" : "#fff2a3") : "#353347");
      if (nyala) { ctx.globalAlpha = 0.45; dot(ctx, lx, ly, 24, i ? "#45c9e8" : "#ffd54f"); }
      ctx.restore(); teks("AB"[i], lx, GROUND_Y - 60, 14, "#fff");
    }
  }
  if (o.plat && o.gaya !== "lampu") { ctx.fillStyle = "#e0a96d"; ctx.fillRect(o.x, GROUND_Y, o.w, 8); }   // jembatan lain: permukaan atasnya = tempat berpijak; lampu digambar sesuai animasinya
  else if (o.solid) { ctx.fillStyle = "rgba(120,200,255,.3)"; ctx.fillRect(o.x - 6, GROUND_Y - 130, 6, 130); }   // pembatas ajaib sampai soal selesai
}
function drawObstacles(t) {
  for (const o of G.obs) {
    if (o.type === "wall") {
      blok(o.x, o.top, o.w, GROUND_Y - o.top);   // teras tanah tingkat atas: permukaan rumputnya = jalur lanjutan
      if (o.plat) jembatan(o);
    } else if (o.type === "enemies") { for (let i = 0; i < 3; i++) drawMon(ctx, o.x + 24 + i * 41, GROUND_Y, i, t, 2); } else drawLain(o);
  }
}
function drawHero() {
  const p = G.p;
  if (p.blink > 0 && Math.floor(p.blink * 12) % 2) return;   // berkedip setelah kehilangan nyawa
  drawPlayer(ctx, p.x, p.y, G.anim, p.falling ? "fall" : !p.onGround ? "jump" : state === "play" && keys.left !== keys.right ? "run" : "idle", 1, p.vy, G.face);   // diam saat Jin muncul / game over
}
function drawHUD() {
  for (let i = 0; i < CONFIG.nyawaAwal; i++) heart(ctx, 34 + i * 38, 36, 15, i < G.lives);
  ctx.textAlign = "right"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.fillStyle = "#fff";
  ctx.font = `bold 26px ${FONT}`; const t = `Skor ${Math.floor(G.score)}`; ctx.strokeText(t, W - 20, 40); ctx.fillText(t, W - 20, 40);
  ctx.font = `bold 15px ${FONT}`; ctx.lineWidth = 4; const b = `Terbaik ${best}`; ctx.strokeText(b, W - 20, 62); ctx.fillText(b, W - 20, 62);
  if (G.run) teks(G.run.jalan ? `Gua runtuh dalam ${Math.max(0, G.run.sisa).toFixed(1)} detik!` : "Lari ke ujung lorong! Waktu mulai saat kamu bergerak.", W / 2, 96, 22, "#ffd54f");
  if (G.banner > 0) {                                // pengumuman masuk fase 2
    ctx.globalAlpha = Math.min(1, G.banner); ctx.fillStyle = "rgba(29,37,87,.88)"; rr(ctx, 150, 140, 500, 96, 18); ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#ffd54f"; ctx.font = `bold 30px ${FONT}`; ctx.fillText("Fase 2: Tantangan Matematika!", W / 2, 184);
    ctx.fillStyle = "#fff"; ctx.font = `18px ${FONT}`; ctx.fillText("Jin akan menghadangmu. Jawab dengan teliti!", W / 2, 214);
    ctx.globalAlpha = 1;
  }
}
function drawParticles() { for (const q of G.parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); dot(ctx, q.x, q.y, q.r, q.c); } ctx.globalAlpha = 1; }
function render(t) {
  ctx.save();
  if (G.shake > 0) ctx.translate(rand(-5, 5), rand(-5, 5));
  drawBackground(); drawGround(); drawObstacles(t); drawHero(); drawParticles();
  ctx.restore();
  if (state !== "menu") drawHUD();
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,40,60,${G.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }   // kilatan merah saat nyawa berkurang
  if (state === "menu") { hctx.clearRect(0, 0, 160, 160); drawPlayer(hctx, 80, 140, G.anim, "idle", 1.5); }
}

// ---------- Kontrol ----------
function pressJump() { if (state === "play") { held = true; G.p.buffer = 0.12; } }
function releaseJump() { held = false; }
const PETA = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };   // tombol berjalan
const LONCAT = ["Space", "ArrowUp", "KeyW"];
addEventListener("keydown", (e) => {
  if (state === "challenge") {                       // dialog jin: Enter = lanjut, 1/2/3 = pilih jawaban
    if (e.code === "Enter") { e.preventDefault(); if (!$("cnext").classList.contains("hidden")) $("cnext").click(); }
    const n = +e.key;
    if (n >= 1 && n <= 3) { const b = document.querySelectorAll(".opt")[n - 1]; if (b && !b.disabled) b.click(); }
    return;
  }
  if (PETA[e.code]) { e.preventDefault(); keys[PETA[e.code]] = true; }
  if (LONCAT.includes(e.code)) { e.preventDefault(); if (!e.repeat) pressJump(); }
});
addEventListener("keyup", (e) => { if (PETA[e.code]) keys[PETA[e.code]] = false; if (LONCAT.includes(e.code)) releaseJump(); });
addEventListener("blur", () => { keys.left = keys.right = false; held = false; });   // pindah tab: berhenti, tidak jalan sendiri
const tahan = (id, aksi, lepas) => {                 // tombol layar sentuh (HP): kiri, kanan, lompat
  const el = $(id);
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); aksi(); });
  for (const ev of ["pointerup", "pointerleave", "pointercancel"]) el.addEventListener(ev, lepas);
};
tahan("kiri", () => (keys.left = true), () => (keys.left = false));
tahan("kanan", () => (keys.right = true), () => (keys.right = false));
tahan("jump", pressJump, releaseJump);
$("btnStart").onclick = startGame; $("btnAgain").onclick = startGame; $("btnMenu").onclick = toMenu;
$("btnHow").onclick = () => show("how"); $("btnBack").onclick = () => show("menu");
function lanjutDialog() {                           // tombol Lanjut / Enter pada dialog Jin
  const c = G.ch;
  if (!c.answered) { c.step++; showStep(); return; } // masih tahap pengenalan soal
  if (G.lives <= 0) return gameOver();
  if (!c.ok && c.o.type !== "enemies") { c.answered = false; c.step = c.inst.steps.length; showStep(); return; }   // salah: tetap terhalang, soal diulang
  finishChallenge();
}
$("cnext").onclick = lanjutDialog;

// ---------- Mulai ----------
function fit() { const d = Math.min(devicePixelRatio || 1, 2); canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener("resize", fit); fit();
document.title = CONFIG.nama;
$("ikonA").src = ASET("ikon_lompat.png"); $("ikonKiri").src = ASET("ikon_kiri.png"); $("ikonKanan").src = ASET("ikon_kanan.png"); $("ikonKetuk").src = ASET("ikon_ketuk.png");   // ikon dari aset input prompt (tampil di HP)
document.body.style.cssText += `background-image:url("${ASET("latar0_langit.png")}");background-size:384px;image-rendering:pixelated`;   // latar halaman dari aset latar
document.querySelectorAll(".nama-game").forEach((e) => (e.textContent = CONFIG.nama));
if (matchMedia("(pointer:coarse)").matches) document.documentElement.classList.add("touch");   // HP/tablet: tampilan landscape + tombol layar
$("btnStart").addEventListener("click", () => {      // sentuhan pertama: coba layar penuh + kunci landscape (Android); iOS memakai putaran CSS
  if (!document.documentElement.classList.contains("touch")) return;
  try { document.documentElement.requestFullscreen().then(() => screen.orientation.lock("landscape")).catch(() => {}); } catch (e) {}
});
newGame(); show("menu");
let last = 0;
function loop(ts) {                                  // loop utama; dt dibatasi agar tidak "melompat" saat tab ditinggalkan
  const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
  update(dt); render(ts / 1000);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
