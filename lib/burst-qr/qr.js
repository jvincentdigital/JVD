// Small QR Code encoder: byte mode, versions 1-10, levels L/M/Q/H.
// Written from the QR spec (ISO/IEC 18004) and the Thonky QR tutorial.
// No dependencies, works in Node and in the browser.

export const EC_FORMAT = { L: 1, M: 0, Q: 3, H: 2 };

// [ec codewords per block, group 1 blocks, data per block, group 2 blocks, data per block]
export const EC_TABLE = {
  1: { L: [7, 1, 19], M: [10, 1, 16], Q: [13, 1, 13], H: [17, 1, 9] },
  2: { L: [10, 1, 34], M: [16, 1, 28], Q: [22, 1, 22], H: [28, 1, 16] },
  3: { L: [15, 1, 55], M: [26, 1, 44], Q: [18, 2, 17], H: [22, 2, 13] },
  4: { L: [20, 1, 80], M: [18, 2, 32], Q: [26, 2, 24], H: [16, 4, 9] },
  5: { L: [26, 1, 108], M: [24, 2, 43], Q: [18, 2, 15, 2, 16], H: [22, 2, 11, 2, 12] },
  6: { L: [18, 2, 68], M: [16, 4, 27], Q: [24, 4, 19], H: [28, 4, 15] },
  7: { L: [20, 2, 78], M: [18, 4, 31], Q: [18, 2, 14, 4, 15], H: [26, 4, 13, 1, 14] },
  8: { L: [24, 2, 97], M: [22, 2, 38, 2, 39], Q: [22, 4, 18, 2, 19], H: [26, 4, 14, 2, 15] },
  9: { L: [30, 2, 116], M: [22, 3, 36, 2, 37], Q: [20, 4, 16, 4, 17], H: [24, 4, 12, 4, 13] },
  10: { L: [18, 2, 68, 2, 69], M: [26, 4, 43, 1, 44], Q: [24, 6, 19, 2, 20], H: [28, 6, 15, 2, 16] },
};

const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

export const MAX_VERSION = 10;

// ---- GF(256) and Reed-Solomon ----
export const EXP = new Uint8Array(512);
export const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

export function gfMul(a, b) {
  return a && b ? EXP[LOG[a] + LOG[b]] : 0;
}

function rsGenerator(degree) {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= gfMul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

export function rsRemainder(data, degree) {
  const gen = rsGenerator(degree);
  const res = new Array(degree).fill(0);
  for (const b of data) {
    const factor = b ^ res.shift();
    res.push(0);
    for (let j = 0; j < degree; j++) res[j] ^= gfMul(gen[j + 1], factor);
  }
  return res;
}

// ---- format and version info ----
export function formatBits(ecl, mask) {
  const data = (EC_FORMAT[ecl] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

export function versionBits(version) {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

export function dataCapacity(version, ecl) {
  const [, b1, d1, b2 = 0, d2 = 0] = EC_TABLE[version][ecl];
  return b1 * d1 + b2 * d2;
}

export const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

// ---- encoder ----
export function encodeQR(text, { ecl = 'H', mask } = {}) {
  if (!(ecl in EC_FORMAT)) throw new Error(`Unknown error level "${ecl}" (use L, M, Q or H)`);
  const bytes = new TextEncoder().encode(String(text));

  let version = 0;
  for (let v = 1; v <= MAX_VERSION; v++) {
    const needBits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
    if (needBits <= dataCapacity(v, ecl) * 8) {
      version = v;
      break;
    }
  }
  if (!version) {
    throw new Error(`Text is too long (${bytes.length} bytes) for level ${ecl}. Use a shorter link or a lower level (Q, M or L).`);
  }

  const codewords = buildCodewords(bytes, version, ecl);
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  drawFunctionPatterns(size, version, set);
  placeCodewords(size, codewords, modules, isFunction);

  const tryMask = (m) => {
    const copy = modules.map((row) => row.slice());
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (!isFunction[y][x] && MASKS[m](x, y)) copy[y][x] = !copy[y][x];
    drawFormat(size, formatBits(ecl, m), (x, y, d) => (copy[y][x] = d));
    return copy;
  };

  let best = null;
  const masks = mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [mask];
  for (const m of masks) {
    const candidate = tryMask(m);
    const score = penalty(candidate);
    if (!best || score < best.score) best = { m, candidate, score };
  }

  return { version, size, ecl, mask: best.m, modules: best.candidate, isFunction };
}

function buildCodewords(bytes, version, ecl) {
  const bits = [];
  const push = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);

  const cap = dataCapacity(version, ecl);
  push(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad);

  const [ec, b1, d1, b2 = 0, d2 = 0] = EC_TABLE[version][ecl];
  const blocks = [];
  let k = 0;
  for (let i = 0; i < b1; i++, k += d1) blocks.push(data.slice(k, k + d1));
  for (let i = 0; i < b2; i++, k += d2) blocks.push(data.slice(k, k + d2));
  const ecBlocks = blocks.map((b) => rsRemainder(b, ec));

  const out = [];
  const maxLen = Math.max(d1, d2);
  for (let i = 0; i < maxLen; i++) for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ec; i++) for (const b of ecBlocks) out.push(b[i]);
  return out;
}

function drawFunctionPatterns(size, version, set) {
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, dist !== 2 && dist !== 4);
      }
  }
  const pos = ALIGN[version];
  const last = pos.length - 1;
  for (let i = 0; i < pos.length; i++)
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  drawFormat(size, 0, set); // reserve; real bits are drawn per mask
  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit);
      set(b, a, bit);
    }
  }
}

export function drawFormat(size, bits, set) {
  const bit = (i) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true); // the always-dark module
}

function placeCodewords(size, codewords, modules, isFunction) {
  let i = 0;
  const total = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      const y = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (isFunction[y][x] || i >= total) continue;
        modules[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
        i++;
      }
    }
  }
}

// Standard 4-rule penalty, used only to pick the nicest mask.
function penalty(m) {
  const n = m.length;
  let score = 0;
  const lines = [];
  for (let y = 0; y < n; y++) lines.push(m[y]);
  for (let x = 0; x < n; x++) lines.push(m.map((row) => row[x]));

  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    const s = line.map((d) => (d ? 1 : 0)).join('');
    for (const pat of ['10111010000', '00001011101']) {
      for (let at = s.indexOf(pat); at !== -1; at = s.indexOf(pat, at + 1)) score += 40;
    }
  }
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  let dark = 0;
  for (const row of m) for (const d of row) if (d) dark++;
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}
