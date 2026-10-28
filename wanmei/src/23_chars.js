/* ================= character & creature designs (2D vector) ================= */
const EYES = {
  kid: ['#07060c', '#1c1830', '#4a3f78', '#8a7cc0'], brown: ['#1a0e08', '#4a2c18', '#8a5a34', '#c89a6a'], dark: ['#0a080c', '#2a2430', '#5a4e66', '#8a7a96'],
  gray: ['#14181c', '#3a444e', '#7a8894', '#b0bcc6'], amber: ['#3a1a04', '#8a4a10', '#d8901a', '#ffd060'], cyan: ['#032028', '#0a6a80', '#1ab0c8', '#9af0ff'], violet: ['#1a0430', '#4a1a7a', '#8a3ad8', '#e0b0ff'], red: ['#200404', '#6a1010', '#c02020', '#ff9a7a'], green: ['#06180a', '#1a5a2a', '#2a8a4a', '#9af0b0'], gold: ['#2a1a00', '#7a5208', '#d8a010', '#fff0a0'],
};
const FACE = (o) => Object.assign({ ew: 30, eh: 38, sep: 44, ey: 8, blush: 0.3 }, o);
const CHARS = {
  // 小不点·石昊（三岁半）：乌黑的发丝垂到肩头，大眼睛又黑又亮，白白净净；手腕上一串兽牙手串；嘴角奶渍
  xiaobudian: () => ({ rig: 'chibi', key: 'xbd', build: 'kid', hair: 'kid', skin: '#fde8dc', skinSh: '#f2b6aa', hairC: '#1a1b28', top: '#efe4cc', kilt: '#b6844f', fur: '#f7f0e2', boot: '#8a6040', wraps: '#d2b282', belt: '#6a4428', bracelet: true,
    face: FACE({ ew: 30, eh: 38, sep: 44, blush: 0.45, milk: true, smile: 5, iris: EYES.kid }) }),
  chief: () => ({ rig: 'chibi', key: 'chief', build: 'old', hair: 'topknot', hairC: '#e8e8e2', hairHl: '#ffffff', skin: '#f0d0b4', robe: true, top: '#6a5a48', trim: '#3a2e24', sleeve: 'long', boot: '#3a2e24', sash: '#8a6a3a', hunch: 0.05,
    face: FACE({ ew: 22, eh: 20, sep: 40, ey: 10, iris: EYES.brown, browC: '#f0f0ea', browW: 8, browT: -3, beard: '#f4f4ee', wrinkle: true, blush: 0.12 }) }),
  linhu: () => ({ rig: 'chibi', key: 'linhu', build: 'brute', hair: 'wild', hairC: '#16121a', skin: '#c8946a', vest: true, top: '#7a5032', fur: '#a08060', kilt: '#6a4428', legC: '#4a3424', pants: true, boot: '#3a2618', armband: '#2a1a10', bracer: '#5a3a24', necklace: true, weapon: 'greatsword', puff: false,
    face: FACE({ ew: 24, eh: 22, sep: 42, ey: 10, iris: EYES.brown, browW: 9, browT: 4, stubble: true, scar: true, blush: 0.06, jaw: 1, mouthW: 16 }) }),
  feijiao: () => ({ rig: 'chibi', key: 'feijiao', build: 'man', hair: 'spiky', hairC: '#1a1414', skin: '#d4a07a', vest: true, top: '#5a6a48', fur: '#9a8a6a', kilt: '#4a5a3a', legC: '#3e3a2e', pants: true, boot: '#2e2a20', bracer: '#3a3226', weapon: 'club', puff: false,
    face: FACE({ ew: 24, eh: 24, sep: 42, ey: 10, iris: EYES.dark, browW: 8, browT: 6, blush: 0.06, jaw: 0.6 }) }),
  ermeng: () => ({ rig: 'chibi', key: 'ermeng', build: 'child', hair: 'short', hairC: '#141010', skin: '#c4926c', top: '#9a7048', kilt: '#7a5434', fur: '#c8b090', boot: '#5a3a24', belly: 1.25,
    face: FACE({ ew: 27, eh: 32, iris: EYES.brown, browW: 6, mouthW: 16, smile: 8, blush: 0.3 }) }),
  pihou: () => ({ rig: 'chibi', key: 'pihou', build: 'child', hair: 'spiky', hairC: '#2a1a12', skin: '#dcae88', top: '#8a6a4a', kilt: '#6a5038', fur: '#b8a080', boot: '#4a3424',
    face: FACE({ ew: 26, eh: 32, iris: EYES.amber, browW: 4, mouthW: 18, smile: 10, blush: 0.25, fang: true }) }),
  dazhuang: () => ({ rig: 'chibi', key: 'dazhuang', build: 'child', hair: 'short', hairC: '#101010', skin: '#c8966e', top: '#7a5a3a', kilt: '#5a4028', fur: '#a89070', boot: '#3a2a1c', b: 1.1,
    face: FACE({ ew: 25, eh: 28, iris: EYES.dark, browW: 8, mouthW: 14, smile: 3, blush: 0.18 }) }),
  beifeng: () => ({ rig: 'chibi', key: 'beifeng', build: 'teen', hair: 'longtie', hairC: '#0a0a12', hairHl: '#4a4a70', skin: '#f6e4d6', vest: false, top: '#2a2226', sleeve: 'long', fur: '#4a3a3a', kilt: '#3a1a1a', legC: '#221c20', pants: true, boot: '#1a1416', bracer: '#5a1a14', sash: '#7a1a14', weapon: 'bow',
    face: FACE({ ew: 26, eh: 24, sep: 40, ey: 10, iris: EYES.gray, browW: 5, browT: 6, flick: true, blush: 0.05, jaw: 1.2, mouthW: 11, smile: -1 }) }),
  beishan: () => ({ rig: 'chibi', key: 'beishan', build: 'brute', hair: 'short', hairC: '#2a2420', skin: '#b0866a', vest: true, top: '#3e3a40', fur: '#6a6460', legC: '#2a2628', pants: true, boot: '#1a1618', bracer: '#2a2428', puff: false,
    face: FACE({ ew: 22, eh: 20, sep: 42, ey: 10, iris: EYES.gray, browW: 9, browT: 8, stubble: true, blush: 0, jaw: 1.2 }) }),
  beiHunter: i => { const r = mulberry32(i * 31 + 7); const P = a => a[Math.floor(r() * a.length)]; return { rig: 'chibi', key: 'bh' + (i % 6), build: 'man', hair: P(['short', 'spiky']), hairC: '#1a1618', skin: P(['#c8a080', '#b89070', '#d8b090']), vest: true, top: P(['#3e3a40', '#4a4040', '#34302e']), fur: '#6a6460', legC: '#2a2628', pants: true, boot: '#1a1618', bracer: '#2a2428', puff: false,
    face: FACE({ ew: 22, eh: 22, sep: 42, ey: 10, iris: EYES.gray, browW: 7, browT: 7, blush: 0, jaw: 1 }) }; },
  villager: (seed, kind) => { const r = mulberry32(seed * 977 + 13), P = a => a[Math.floor(r() * a.length)]; kind = kind || P(['man', 'man', 'woman', 'woman', 'old', 'child', 'child']);
    const skin = P(['#f0cca8', '#e0b890', '#d0a078', '#f6d8bc', '#dcb08c']), tops = ['#9a6a3a', '#8a7050', '#7a5a40', '#a88a5a', '#6a5a40', '#b09068', '#8a5a3a', '#a07850', '#7a6a50'];
    const base = { rig: 'chibi', key: 'v' + seed + kind, skin, top: P(tops), kilt: P(tops), fur: P(['#e8dcc0', '#d8c8a8', '#f0e8d8']), boot: P(['#4a3424', '#3a2a1a', '#5a4030']), hairC: P(['#161214', '#2a1e18', '#1a1418']),
      face: FACE({ ew: 25, eh: 26, iris: P([EYES.brown, EYES.dark, EYES.amber]), browW: 5, blush: 0.15, smile: 4 }) };
    if (kind === 'man') return Object.assign(base, { build: 'man', hair: P(['short', 'spiky', 'wild']), vest: r() < 0.5, puff: false, legC: P(['#5a4a3a', '#4a3e30']), pants: r() < 0.5, face: Object.assign(base.face, { ew: 23, eh: 22, sep: 42, ey: 10, browW: 7, stubble: r() < 0.5, jaw: 0.8 }) });
    if (kind === 'woman') return Object.assign(base, { build: 'woman', hair: P(['bun', 'long']), robe: true, sleeve: 'long', trim: P(['#6a2a1a', '#3a5a6a', '#5a3a20', '#7a3a4a']), face: Object.assign(base.face, { ew: 27, eh: 30, flick: true, blush: 0.3, lip: '#c05a5a', jaw: 0.6 }) });
    if (kind === 'old') return Object.assign(base, { build: 'old', hair: P(['topknot', 'short', 'bald']), hairC: '#d8d8d0', hairHl: '#ffffff', robe: true, sleeve: 'long', hunch: 0.08, face: Object.assign(base.face, { ew: 21, eh: 18, browC: '#e8e8e0', browW: 7, wrinkle: true, beard: r() < 0.6 ? '#ecece4' : null }) });
    return Object.assign(base, { build: 'child', hair: P(['short', 'spiky', 'kid']), face: Object.assign(base.face, { ew: 28, eh: 33, blush: 0.32 }) }); },
  // ---------- beasts (side view) ----------
  wolf: () => ({ rig: 'quad', key: 'wolf', size: 1.0, len: 180, legH: 70, bodyR: 42, c1: '#6e6e78', c2: '#9a9aa4', belly: '#d0d0d6', headR: 0.78, snout: 1.0, earL: 0.7, tailL: 0.8, tailUp: 0.2, tailTuft: '#9a9aa4', fangs: true, iris: EYES.amber.slice(1).concat(['#3a1a04']) }),
  lynx: () => ({ rig: 'quad', key: 'lynx', size: 0.9, len: 170, legH: 60, bodyR: 40, c1: '#b8864e', c2: '#d8b078', belly: '#f0e0c8', stripes: '#5a3818', headR: 0.8, snout: 0.5, earL: 0.85, tailL: 0.9, horns: '#3a2a1a', hornL: 0.9, hornCurve: 0.3, iris: ['#0a3a14', '#2a9a4a', '#a0f0b0'] }),
  snake: () => ({ rig: 'snake', key: 'snake', size: 1, n: 16, r: 15, c1: '#3a5a2a', c2: '#5a7a3a', eye: 0xffd020 }),
  zjsnake: () => ({ rig: 'snake', key: 'zjsnake', size: 1.6, n: 20, r: 20, c1: '#6a2a8a', c2: '#d8a830', crest: '#d8a830', eye: 0xff4020 }),
  mangniu: () => ({ rig: 'quad', key: 'mangniu', size: 1.7, len: 230, legH: 80, bodyR: 64, humpY: 1.15, c1: '#2c3c34', c2: '#3e5244', belly: '#5a6a5a', headR: 0.62, snout: 0.7, earL: 0.35, tailL: 0.5, tailTuft: '#1a2018', horns: '#e0d4b0', hornL: 1.6, hornCurve: 0.9, hoof: '#1a1a1a', mood: 'open', iris: ['#2a1a08', '#8a5a20', '#d8a050'] }),
  biao: () => ({ rig: 'quad', key: 'biao', size: 2.4, len: 210, legH: 70, bodyR: 48, c1: '#8a6440', c2: '#b08a5c', belly: '#e0c8a0', stripes: '#3a2814', headR: 0.8, snout: 0.55, earL: 0.55, tailL: 1.0, wings: '#6a4a2e', fangs: true, iris: EYES.gold.slice(1) }),
  dog: () => ({ rig: 'quad', key: 'dog', size: 0.8, len: 150, legH: 55, bodyR: 34, c1: '#d8a040', c2: '#e8c070', belly: '#f4e4c0', headR: 0.85, snout: 0.7, earL: 0.5, earBack: true, tailL: 0.7, tailUp: 0.9, mood: 'cute', iris: ['#2a1a0a', '#6a4020', '#a07040'] }),
  qingying: () => ({ rig: 'bird', key: 'qy', size: 4.0, c1: '#1e6a64', c2: '#5ac0b0', belly: '#9ad8c8', iris: EYES.amber.slice(1) }),
  dapeng: () => ({ rig: 'bird', key: 'dp', size: 0.85, chibi: 0.8, c1: '#2a7a6a', c2: '#7ad8c0', belly: '#c8f0e0', iris: EYES.gold.slice(1) }),
  xiaoqing: () => ({ rig: 'bird', key: 'xq', size: 0.8, chibi: 0.85, c1: '#2a8a7a', c2: '#8ae8d0', belly: '#d0f4e8', iris: EYES.amber.slice(1) }),
  ziyun: () => ({ rig: 'bird', key: 'zy', size: 0.85, chibi: 0.8, c1: '#6a2a9a', c2: '#d070e0', belly: '#f0c8f8', iris: EYES.gold.slice(1), spike: '#ffd8a0' }),
  wuseque: () => ({ rig: 'bird', key: 'wsq', size: 0.22, chibi: 0.6, c1: '#d83a3a', c2: '#3ac8e8', belly: '#ffe04a', iris: EYES.dark.slice(1) }),
  stakeS: () => ({ rig: 'stake', key: 'stake', size: 1 }),
};
/* ================= the original divine-beast partner (P2): evolves into the species of the novel's companion of each stage ================= */
const PARTNER_FORMS = {
  rongling: { stage: 1, name: '绒灵', desc: '柳神护下的灵卵孵出的幼崽，一团会发光的软毛，额上有一点小角芽。', role: '辅助', tags: ['护盾', '灵光', '嗅宝'],
    spec: () => ({ rig: 'quad', key: 'rongling', size: 0.62, len: 120, legH: 26, bodyR: 52, humpY: 1.05, chestY: 1.05, c1: '#f4f6ff', c2: '#dfeaff', belly: '#ffffff', headR: 1.15, snout: 0.25, neckUp: 0.9, earL: 1.2, tailL: 1.0, tailUp: 0.9, tailC: '#f4f6ff', tailTuft: '#bfe8ff', earC: '#eaf4ff', horn1: '#9ae8ff', legR: 0.34, claws: false, iris: EYES.cyan.slice(1), mood: 'cute', eyeR: 0.3, blush: true }),
    glow: '#8ae0ff', skills: ['p_tackle', 'p_orb', 'p_shield', 'p_sniff'] },
  qinglin: { stage: 2, name: '青鳞鹰', from: 'rongling', desc: '柳树下三枚鹰卵孵化时，绒灵吸尽了卵壳上破碎的符文，蜕成一只青鳞幼鹰——无羽，周身青色金属鳞片，头顶一排小骨刺。', role: '敏捷·青月', tags: ['青月', '俯冲', '鳞甲'],
    spec: lv => ({ rig: 'bird', key: 'p_qinglin', size: lerp(0.85, 1.5, clamp((lv - 10) / 20, 0, 1)), chibi: lerp(0.8, 0.35, clamp((lv - 10) / 20, 0, 1)), c1: '#237a72', c2: '#7ae0cc', belly: '#c8f0e4', spike: '#f0e8d0', iris: EYES.cyan.slice(1) }),
    glow: '#6ae8d0', skills: ['q_peck', 'q_moon', 'q_dive', 'q_scale'] },
  zhuyan: { stage: 3, name: '朱厌', from: 'qinglin', desc: '形似猿猴，脚赤红——太古凶兽朱厌一脉。金毛里藏着一对麟角，血是能疗伤的金色。（第53章起）', role: '迅捷·偷取', tags: ['金光', '偷取', '金血'],
    spec: () => ({ rig: 'quad', key: 'p_zhuyan', size: 0.7, len: 110, legH: 44, bodyR: 38, c1: '#e8b020', c2: '#ffd860', belly: '#fff0b0', headR: 1.0, snout: 0.35, earL: 0.4, tailL: 1.2, tailTuft: '#ffe080', legC: '#d83020', iris: EYES.gold.slice(1), mood: 'cute' }),
    glow: '#ffd040', skills: [] },
};
/* character height in metres for collision / UI, derived from the drawing */
function specHeight(P) { if (P.rig === 'chibi') return chibiHeight(P) * UM_C; const S = P.size || 1; if (P.rig === 'bird') return S * 160 * UM_B * (1 - (P.chibi || 0) * 0.25); if (P.rig === 'snake') return 0.35 * S; if (P.rig === 'stake') return 1.6; return S * (P.legH + P.bodyR * 2.2) * UM_B; }
