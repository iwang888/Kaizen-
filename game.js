/**
 * Jujutsu World — 2D Action Side-Scroller
 * Full game engine: Stage 1 (5 waves) -> Stage 2 (Boss Fight)
 */

// ============================================================
// CONSTANTS
// ============================================================
const CANVAS_W = 960;
const CANVAS_H = 540;
const GROUND_Y = 460; // baseline y-position of the ground surface

// Player
const PLAYER_MAX_HP  = 125;
const PLAYER_SPEED   = 5;      // 5 px/frame
const PLAYER_JUMP_VY = -14.5;
const GRAVITY        = 0.65;
const PLAYER_W       = 80;     // ~50% display size
const PLAYER_H       = 145;    // ~50% display size

// Attacks
const BULLET_SPEED   = 12;
const BULLET_DMG     = 40;     // Left click Blood Piercing Shot
const BULLET_RADIUS  = 6;

const SLASH_DMG      = 200;    // E skill: Area clear hits all monsters
const SLASH_COOLDOWN = 30;     // 30 seconds

// Regular Enemy (Stage 1)
const ENEMY_MAX_HP   = 50;     // 50 HP each
const ENEMY_SPEED    = 1.5;
const ENEMY_DMG      = 5;      // 5 damage on contact
const ENEMY_ATK_CD   = 900;    // ms between hits
const ENEMY_W        = 88;
const ENEMY_H        = 88;

// Boss (Stage 2)
const BOSS_MAX_HP    = 400;    // 400 HP
const BOSS_BEAM_CD   = 4000;   // Shoots energy beam every 4 seconds
const BOSS_WARN_TIME = 1400;   // ms warning / charging before beam fires
const BOSS_BEAM_DMG  = 15;     // 15 damage
const BOSS_W         = 180;
const BOSS_H         = 200;
const BOSS_BEAM_H    = 36;

// Waves config [Stage 1: 5 waves, adding 5 each wave]
const WAVE_COUNTS = [5, 10, 15, 20, 25];

// ============================================================
// RETRO AUDIO SYSTEM (Web Audio API)
// ============================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.lastStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playStep() {
    this.init();
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastStep < 180) return;
    this.lastStep = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + Math.random() * 30, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.085);
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  playShoot() {
    this.init();
    if (!this.ctx) return;
    // Piercing Blood Shot: laser/zap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playSlash() {
    this.init();
    if (!this.ctx) return;
    // Area clear slash: deep sweeping impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playHit() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playWarning() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(520, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.41);
  }

  playBeam() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.55);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.56);
  }

  playWin() {
    this.init();
    if (!this.ctx) return;
    const notes = [261.6, 329.6, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 0.32);
    });
  }

  playLose() {
    this.init();
    if (!this.ctx) return;
    const notes = [300, 260, 210, 150];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.2);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.2 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.2);
      osc.stop(this.ctx.currentTime + idx * 0.2 + 0.36);
    });
  }
}

const sfx = new SoundEffects();

// ============================================================
// DOM REFS
// ============================================================
const canvas       = document.getElementById('gameCanvas');
const ctx          = canvas.getContext('2d');

const elHpFill     = document.getElementById('hp-bar-fill');
const elHpText     = document.getElementById('hp-text');
const elWaveInfo   = document.getElementById('wave-info');
const elSlashCd    = document.getElementById('slash-cd');
const elBossHud    = document.getElementById('boss-hud');
const elBossHpFill = document.getElementById('boss-hp-fill');

const elLoading    = document.getElementById('overlay-loading');
const elLoadBar    = document.getElementById('loading-bar-fill');
const elWaveOvl    = document.getElementById('overlay-wave');
const elWaveText   = document.getElementById('wave-announce-text');
const elVictory    = document.getElementById('overlay-victory');
const elGameOver   = document.getElementById('overlay-gameover');

document.getElementById('btn-play-again').addEventListener('click', () => {
  sfx.init();
  startGame();
});
document.getElementById('btn-restart').addEventListener('click', () => {
  sfx.init();
  startGame();
});

// ============================================================
// ASSET LOADER
// ============================================================
const ASSETS = {
  // Transparent cropped frames for character 1 (Image 1)
  c1Idle:      'assets/c1_idle.png',
  c1Walk1:     'assets/c1_walk1.png',
  c1Walk2:     'assets/c1_walk2.png',
  c1Back:      'assets/c1_back.png',
  playerSheet: 'assets/player_sheet.png',
  // Maps & Enemies
  bgForest:    'assets/bg_forest.jpg',      // Image 2
  bgGrave:     'assets/bg_graveyard.jpg',   // Image 3
  enemy:       'assets/enemy_spider.jpg',   // Image 4
  boss:        'assets/boss.jpg'            // Image 5
};

const imgs = {};

function loadAllAssets(onDone) {
  const assetKeys = Object.keys(ASSETS);
  let loaded = 0;
  for (const key of assetKeys) {
    const img = new Image();
    img.onload = () => {
      loaded++;
      elLoadBar.style.width = (loaded / assetKeys.length * 100) + '%';
      if (loaded === assetKeys.length) onDone();
    };
    img.onerror = () => {
      loaded++;
      elLoadBar.style.width = (loaded / assetKeys.length * 100) + '%';
      if (loaded === assetKeys.length) onDone();
    };
    img.src = ASSETS[key];
    imgs[key] = img;
  }
}

// ============================================================
// INPUT STATE (WAD / Thai / Arrow Keys + Mouse Aim / Attacks)
// ============================================================
const keys = { a: false, d: false, w: false };
let mouse = { x: CANVAS_W / 2, y: CANVAS_H / 2 };

// On-screen control buttons
const btnCtrlA = document.getElementById('btn-ctrl-a');
const btnCtrlW = document.getElementById('btn-ctrl-w');
const btnCtrlD = document.getElementById('btn-ctrl-d');
const btnCtrlE = document.getElementById('btn-ctrl-e');

function isKeyLeft(e) {
  return e.code === 'KeyA' || e.code === 'ArrowLeft' ||
         e.key === 'a' || e.key === 'A' || e.key === 'ฟ' || e.key === 'ฤ' || e.key === 'ArrowLeft';
}

function isKeyRight(e) {
  return e.code === 'KeyD' || e.code === 'ArrowRight' ||
         e.key === 'd' || e.key === 'D' || e.key === 'ก' || e.key === 'ฏ' || e.key === 'ArrowRight';
}

function isKeyJump(e) {
  return e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space' ||
         e.key === 'w' || e.key === 'W' || e.key === 'ไ' || e.key === '\"' ||
         e.key === ' ' || e.key === 'ArrowUp';
}

function isKeySlash(e) {
  return e.code === 'KeyE' || e.key === 'e' || e.key === 'E' || e.key === 'ำ' || e.key === 'ฎ';
}

function handleKeyDown(e) {
  sfx.init();

  if (isKeyLeft(e)) {
    keys.a = true;
    if (btnCtrlA) btnCtrlA.classList.add('pressed');
  }

  if (isKeyRight(e)) {
    keys.d = true;
    if (btnCtrlD) btnCtrlD.classList.add('pressed');
  }

  if (isKeyJump(e)) {
    if (e.code === 'Space' || e.key === ' ') e.preventDefault();
    keys.w = true;
    if (btnCtrlW) btnCtrlW.classList.add('pressed');
    if (player && player.onGround) {
      player.vy = PLAYER_JUMP_VY;
      player.onGround = false;
      sfx.playJump();
    }
  }

  if (isKeySlash(e)) {
    if (btnCtrlE) btnCtrlE.classList.add('pressed');
    trySlash();
  }
}

function handleKeyUp(e) {
  if (isKeyLeft(e)) {
    keys.a = false;
    if (btnCtrlA) btnCtrlA.classList.remove('pressed');
  }

  if (isKeyRight(e)) {
    keys.d = false;
    if (btnCtrlD) btnCtrlD.classList.remove('pressed');
  }

  if (isKeyJump(e)) {
    keys.w = false;
    if (btnCtrlW) btnCtrlW.classList.remove('pressed');
  }

  if (isKeySlash(e)) {
    if (btnCtrlE) btnCtrlE.classList.remove('pressed');
  }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

window.addEventListener('blur', () => {
  keys.a = false;
  keys.d = false;
  keys.w = false;
  if (btnCtrlA) btnCtrlA.classList.remove('pressed');
  if (btnCtrlD) btnCtrlD.classList.remove('pressed');
  if (btnCtrlW) btnCtrlW.classList.remove('pressed');
  if (btnCtrlE) btnCtrlE.classList.remove('pressed');
});

// Attach listeners for On-Screen Buttons (Mouse & Touch)
if (btnCtrlA) {
  btnCtrlA.addEventListener('mousedown', e => { e.preventDefault(); sfx.init(); keys.a = true; btnCtrlA.classList.add('pressed'); });
  btnCtrlA.addEventListener('mouseup', () => { keys.a = false; btnCtrlA.classList.remove('pressed'); });
  btnCtrlA.addEventListener('mouseleave', () => { keys.a = false; btnCtrlA.classList.remove('pressed'); });
  btnCtrlA.addEventListener('touchstart', e => { e.preventDefault(); sfx.init(); keys.a = true; btnCtrlA.classList.add('pressed'); }, { passive: false });
  btnCtrlA.addEventListener('touchend', () => { keys.a = false; btnCtrlA.classList.remove('pressed'); });
}

if (btnCtrlD) {
  btnCtrlD.addEventListener('mousedown', e => { e.preventDefault(); sfx.init(); keys.d = true; btnCtrlD.classList.add('pressed'); });
  btnCtrlD.addEventListener('mouseup', () => { keys.d = false; btnCtrlD.classList.remove('pressed'); });
  btnCtrlD.addEventListener('mouseleave', () => { keys.d = false; btnCtrlD.classList.remove('pressed'); });
  btnCtrlD.addEventListener('touchstart', e => { e.preventDefault(); sfx.init(); keys.d = true; btnCtrlD.classList.add('pressed'); }, { passive: false });
  btnCtrlD.addEventListener('touchend', () => { keys.d = false; btnCtrlD.classList.remove('pressed'); });
}

if (btnCtrlW) {
  const doJump = () => {
    sfx.init();
    if (player && player.onGround) {
      player.vy = PLAYER_JUMP_VY;
      player.onGround = false;
      sfx.playJump();
    }
  };
  btnCtrlW.addEventListener('mousedown', e => { e.preventDefault(); doJump(); btnCtrlW.classList.add('pressed'); });
  btnCtrlW.addEventListener('mouseup', () => btnCtrlW.classList.remove('pressed'));
  btnCtrlW.addEventListener('mouseleave', () => btnCtrlW.classList.remove('pressed'));
  btnCtrlW.addEventListener('touchstart', e => { e.preventDefault(); doJump(); btnCtrlW.classList.add('pressed'); }, { passive: false });
  btnCtrlW.addEventListener('touchend', () => btnCtrlW.classList.remove('pressed'));
}

if (btnCtrlE) {
  btnCtrlE.addEventListener('click', e => {
    e.preventDefault();
    sfx.init();
    trySlash();
  });
}

// Click on HUD slash badge also triggers trySlash
if (elSlashCd) {
  elSlashCd.addEventListener('click', () => {
    sfx.init();
    trySlash();
  });
}

// Right click on canvas triggers trySlash
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  sfx.init();
  trySlash();
});

function updateMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top)  * scaleY;
}

window.addEventListener('mousemove', updateMousePos);
canvas.addEventListener('mousemove', updateMousePos);

canvas.addEventListener('mousedown', e => {
  sfx.init();
  if (e.button === 0) {
    shootBullet();
  }
});

// ============================================================
// GAME STATE
// ============================================================
let gameRunning = false;
let stage = 1; // 1 = Forest waves, 2 = Graveyard Boss
let wave  = 0; // 0 to 4 (5 waves total)
let totalEnemiesInWave = 5;
let enemiesKilledInWave = 0;
let activeSpawnTimeouts = [];

// Player
let player;
// Regular Enemies
let enemies = [];
// Projectiles (Blood piercing shots)
let bullets = [];
// Slash visual effect
let slashFX = null;
// Particle FX
let particles = [];
// Boss
let boss = null;

// Timers
let slashCooldownTimer = 0; // seconds remaining
let lastTime = 0;

// Boss beam state
let bossBeamTimer = BOSS_BEAM_CD;
let bossBeamActive = false;
let bossBeamWarning = false;
let bossBeamWarnTimer = 0;
let bossBeamY = GROUND_Y - 45; // height player must jump over

// Walk animation frame cycle
let walkCycleTimer = 0;

// ============================================================
// INIT PLAYER
// ============================================================
function createPlayer() {
  return {
    x: 120,
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    hp: PLAYER_MAX_HP,
    facing: 1, // 1 = right, -1 = left
    w: PLAYER_W,
    h: PLAYER_H,
    hitCD: 0
  };
}

// ============================================================
// HUD UPDATE
// ============================================================
function updateHUD() {
  if (!player) return;

  // Player HP bar & percentage
  const pct = Math.max(0, player.hp) / PLAYER_MAX_HP;
  elHpFill.style.width = (pct * 100) + '%';
  const pctText = Math.round(pct * 100);
  elHpText.textContent = `${Math.max(0, Math.round(player.hp))} / ${PLAYER_MAX_HP} (${pctText}%)`;

  // Wave info
  if (stage === 1) {
    const left = Math.max(0, totalEnemiesInWave - enemiesKilledInWave);
    elWaveInfo.textContent = `STAGE 1 - WAVE ${wave + 1} / 5 (${left} left)`;
  } else {
    elWaveInfo.textContent = `STAGE 2 - BOSS FIGHT`;
  }

  // Slash skill cooldown (30s)
  if (slashCooldownTimer <= 0) {
    elSlashCd.textContent = '[E] SLASH: READY';
    elSlashCd.style.color = '#44ffaa';
  } else {
    elSlashCd.textContent = `[E] SLASH: ${slashCooldownTimer.toFixed(1)}s`;
    elSlashCd.style.color = '#88ccff';
  }

  // Boss HUD
  if (stage === 2 && boss) {
    elBossHud.style.display = 'block';
    const bpct = Math.max(0, boss.hp) / BOSS_MAX_HP;
    elBossHpFill.style.width = (bpct * 100) + '%';
  } else {
    elBossHud.style.display = 'none';
  }
}

// ============================================================
// WAVE / STAGE MANAGEMENT
// ============================================================
function clearAllSpawnTimeouts() {
  activeSpawnTimeouts.forEach(t => clearTimeout(t));
  activeSpawnTimeouts = [];
}

function showWaveAnnounce(text, cb) {
  elWaveOvl.classList.remove('hidden');
  elWaveText.textContent = text;
  const t = setTimeout(() => {
    elWaveOvl.classList.add('hidden');
    if (cb) cb();
  }, 1600);
  activeSpawnTimeouts.push(t);
}

function spawnWave(waveIdx) {
  clearAllSpawnTimeouts();
  totalEnemiesInWave = WAVE_COUNTS[waveIdx];
  enemiesKilledInWave = 0;
  enemies = [];

  // Spawn staggered over time so monsters approach naturally from both flanks
  for (let i = 0; i < totalEnemiesInWave; i++) {
    const tid = setTimeout(() => {
      if (gameRunning && stage === 1) {
        spawnEnemy();
      }
    }, i * 750);
    activeSpawnTimeouts.push(tid);
  }
}

function spawnEnemy() {
  // Alternate or randomize spawn from left and right edges
  const fromRight = Math.random() > 0.45;
  const x = fromRight
    ? CANVAS_W + 40 + Math.random() * 200
    : -80 - Math.random() * 200;

  enemies.push({
    x,
    y: GROUND_Y,
    hp: ENEMY_MAX_HP,
    maxHp: ENEMY_MAX_HP,
    w: ENEMY_W,
    h: ENEMY_H,
    speed: ENEMY_SPEED + (Math.random() * 0.4 - 0.2),
    hitCD: 0,
    bobTime: Math.random() * Math.PI * 2
  });
}

function handleEnemyKill(enemy) {
  enemiesKilledInWave++;
  spawnDeathParticles(enemy.x + enemy.w / 2, enemy.y - enemy.h / 2, '#ff3366', 15);
  sfx.playHit();

  if (enemiesKilledInWave >= totalEnemiesInWave) {
    // Wave completed
    const tid = setTimeout(() => onWaveClear(), 500);
    activeSpawnTimeouts.push(tid);
  }
}

function onWaveClear() {
  if (wave < 4) {
    wave++;
    showWaveAnnounce(`WAVE ${wave + 1}`, () => {
      spawnWave(wave);
    });
  } else {
    // 5 waves completed -> Stage 2 Boss Fight
    showWaveAnnounce('STAGE 2\nBOSS FIGHT', () => {
      startStage2();
    });
  }
}

function startStage2() {
  clearAllSpawnTimeouts();
  stage = 2;
  enemies = [];
  bullets = [];
  boss = createBoss();
  bossBeamTimer = BOSS_BEAM_CD;
  bossBeamActive = false;
  bossBeamWarning = false;
}

function createBoss() {
  return {
    x: CANVAS_W - BOSS_W - 50,
    y: GROUND_Y - BOSS_H + 30,
    baseY: GROUND_Y - BOSS_H + 30,
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    w: BOSS_W,
    h: BOSS_H,
    hoverTime: 0,
    hitCD: 0
  };
}

// ============================================================
// ATTACKS
// ============================================================
function shootBullet() {
  if (!gameRunning || !player) return;
  const px = player.x + player.w / 2;
  const py = player.y - player.h / 2;
  const dx = mouse.x - px;
  const dy = mouse.y - py;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  bullets.push({
    x: px,
    y: py,
    vx: (dx / len) * BULLET_SPEED,
    vy: (dy / len) * BULLET_SPEED,
    r: BULLET_RADIUS,
    dmg: BULLET_DMG,
    alive: true
  });

  sfx.playShoot();
}

function trySlash() {
  if (!gameRunning || !player) return;
  if (slashCooldownTimer > 0) return;
  slashCooldownTimer = SLASH_COOLDOWN;
  sfx.playSlash();

  // Visual slash effect covering the battlefield
  slashFX = { timer: 0, duration: 450 };

  // Hit ALL currently active regular monsters
  for (const e of enemies) {
    e.hp -= SLASH_DMG;
    spawnHitParticles(e.x + e.w / 2, e.y - e.h / 2, '#ff66ff', 12);
  }

  // Hit boss if on Stage 2
  if (stage === 2 && boss) {
    boss.hp -= SLASH_DMG;
    spawnHitParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff66ff', 24);
  }

  // Check killed enemies
  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      handleEnemyKill(e);
      return false;
    }
    return true;
  });

  // Check boss death
  if (stage === 2 && boss && boss.hp <= 0) {
    onVictory();
  }
}

// ============================================================
// PARTICLES
// ============================================================
function spawnHitParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.4,
      color,
      r: 3 + Math.random() * 3,
      timer: 0
    });
  }
}

function spawnDeathParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.4,
      color,
      r: 4 + Math.random() * 5,
      timer: 0
    });
  }
}

// ============================================================
// GAME OVER / VICTORY
// ============================================================
function onGameOver() {
  gameRunning = false;
  clearAllSpawnTimeouts();
  sfx.playLose();
  elGameOver.classList.remove('hidden');
}

function onVictory() {
  gameRunning = false;
  clearAllSpawnTimeouts();
  sfx.playWin();
  elVictory.classList.remove('hidden');
}

// ============================================================
// START / RESET
// ============================================================
function startGame() {
  clearAllSpawnTimeouts();

  // Reset UI Overlays
  elLoading.classList.add('hidden');
  elWaveOvl.classList.add('hidden');
  elVictory.classList.add('hidden');
  elGameOver.classList.add('hidden');
  elBossHud.style.display = 'none';

  // Reset Game State
  gameRunning = true;
  stage = 1;
  wave  = 0;
  totalEnemiesInWave = WAVE_COUNTS[0];
  enemiesKilledInWave = 0;

  enemies = [];
  bullets = [];
  particles = [];
  slashFX = null;
  boss = null;
  slashCooldownTimer = 0;

  bossBeamActive = false;
  bossBeamWarning = false;
  bossBeamTimer = BOSS_BEAM_CD;

  player = createPlayer();

  // Announce Wave 1 and start
  showWaveAnnounce('WAVE 1', () => {
    spawnWave(0);
  });
}

// ============================================================
// UPDATE LOOP
// ============================================================
function update(dt) {
  if (!gameRunning) return;

  const dtMs = dt * 1000;

  // ---- 1. Player Movement & Aim ----
  let moving = false;
  if (keys.a) {
    player.x -= PLAYER_SPEED;
    moving = true;
  }
  if (keys.d) {
    player.x += PLAYER_SPEED;
    moving = true;
  }

  // Keep player inside map boundaries (full map traversal)
  player.x = Math.max(0, Math.min(CANVAS_W - player.w, player.x));

  // Player Facing Follows Mouse
  const playerCenterX = player.x + player.w / 2;
  if (mouse.x < playerCenterX) {
    player.facing = -1; // Face Left
  } else {
    player.facing = 1;  // Face Right
  }

  // Gravity & Jumping
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
  }

  // Walk Cycle & Footsteps
  if (moving && player.onGround) {
    walkCycleTimer += dt * 8;
    if (Math.sin(walkCycleTimer) > 0.8) {
      sfx.playStep();
    }
  } else {
    walkCycleTimer = 0;
  }

  // Player Hit Cooldown
  if (player.hitCD > 0) player.hitCD -= dtMs;

  // Slash Cooldown Timer
  if (slashCooldownTimer > 0) slashCooldownTimer -= dt;
  if (slashCooldownTimer < 0) slashCooldownTimer = 0;

  // Slash FX Animation
  if (slashFX) {
    slashFX.timer += dtMs;
    if (slashFX.timer >= slashFX.duration) slashFX = null;
  }

  // ---- 2. Projectiles (Blood Piercing Shot) ----
  for (const b of bullets) {
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -40 || b.x > CANVAS_W + 40 || b.y < -40 || b.y > CANVAS_H + 40) {
      b.alive = false;
    }
  }

  // ---- 3. Stage 1: Regular Curse Monsters ----
  if (stage === 1) {
    for (const e of enemies) {
      e.bobTime += dt * 3;

      // Monsters move toward player
      const ex = e.x + e.w / 2;
      const px = player.x + player.w / 2;
      const dir = px > ex ? 1 : -1;
      e.x += dir * e.speed;

      // Contact Damage: When enemy approaches player, deals 5 damage
      const dist = Math.abs(ex - px);
      const touchDist = (player.w / 2 + e.w / 2) - 15;
      if (dist < touchDist && Math.abs(player.y - e.y) < 60) {
        if (player.hitCD <= 0) {
          player.hp -= ENEMY_DMG;
          player.hitCD = ENEMY_ATK_CD;
          sfx.playHit();
          spawnHitParticles(px, player.y - player.h / 2, '#ff1133', 8);

          if (player.hp <= 0) {
            onGameOver();
            return;
          }
        }
      }

      // Check collision with bullets
      if (e.hitCD > 0) e.hitCD -= dtMs;
      for (const b of bullets) {
        if (!b.alive) continue;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y - e.h && b.y < e.y) {
          b.alive = false;
          e.hp -= b.dmg;
          sfx.playHit();
          spawnHitParticles(b.x, b.y, '#ff3344', 6);
        }
      }
    }

    // Filter dead enemies
    enemies = enemies.filter(e => {
      if (e.hp <= 0) {
        handleEnemyKill(e);
        return false;
      }
      return true;
    });
  }

  // ---- 4. Stage 2: Boss Fight ----
  if (stage === 2 && boss) {
    boss.hoverTime += dt * 2.2;
    boss.y = boss.baseY + Math.sin(boss.hoverTime) * 10;

    // Boss Energy Beam Attack every 4 seconds
    bossBeamTimer -= dtMs;
    if (bossBeamTimer <= BOSS_WARN_TIME && !bossBeamWarning && !bossBeamActive) {
      bossBeamWarning = true;
      bossBeamWarnTimer = BOSS_WARN_TIME;
      bossBeamY = GROUND_Y - 45; // Beam sweeps low across ground level
      sfx.playWarning();
    }

    if (bossBeamWarning) {
      bossBeamWarnTimer -= dtMs;
      if (bossBeamWarnTimer <= 0) {
        bossBeamWarning = false;
        bossBeamActive = true;
        bossBeamTimer = BOSS_BEAM_CD;
        sfx.playBeam();

        // Check if player is on ground when beam fires -> MUST JUMP TO DODGE!
        checkBeamCollision();

        setTimeout(() => {
          bossBeamActive = false;
        }, 650);
      }
    }

    // Boss hit by bullets
    for (const b of bullets) {
      if (!b.alive) continue;
      if (b.x > boss.x && b.x < boss.x + boss.w &&
          b.y > boss.y && b.y < boss.y + boss.h) {
        b.alive = false;
        boss.hp -= b.dmg;
        sfx.playHit();
        spawnHitParticles(b.x, b.y, '#9900ff', 7);

        if (boss.hp <= 0) {
          onVictory();
          return;
        }
      }
    }
  }

  // Remove consumed bullets
  bullets = bullets.filter(b => b.alive);

  // ---- 5. Particles Update ----
  for (const p of particles) {
    p.timer += dt;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life = 1 - p.timer / p.maxLife;
  }
  particles = particles.filter(p => p.life > 0);

  updateHUD();
}

function checkBeamCollision() {
  const playerTop = player.y - player.h;
  const playerBottom = player.y;
  const beamTop = bossBeamY - BOSS_BEAM_H / 2;
  const beamBottom = bossBeamY + BOSS_BEAM_H / 2;

  // If player is in beam's vertical swath (i.e. did not jump over it)
  if (playerBottom > beamTop && playerTop < beamBottom) {
    player.hp -= BOSS_BEAM_DMG;
    spawnHitParticles(player.x + player.w / 2, player.y - player.h / 2, '#ffaa00', 14);
    sfx.playHit();

    if (player.hp <= 0) {
      setTimeout(() => onGameOver(), 100);
    }
  }
}

// ============================================================
// DRAW ROUTINES
// ============================================================
function drawBackground() {
  const bgImg = (stage === 1) ? imgs.bgForest : imgs.bgGrave;
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = (stage === 1) ? '#102518' : '#14081c';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawGround() {
  // Ground tint strip
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
}

function drawPlayer() {
  if (!player) return;
  const cx = player.x + player.w / 2;
  const cy = player.y;

  // Shadow under player
  const jumpOffset = GROUND_Y - player.y;
  const shadowScale = Math.max(0.3, 1 - jumpOffset * 0.007);
  const shadowAlpha = Math.max(0.15, 0.5 - jumpOffset * 0.005);
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 2, (player.w * 0.4) * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Determine active frame: idle vs walk1 vs walk2
  let activeFrameImg = imgs.c1Idle;
  if (!player.onGround) {
    activeFrameImg = imgs.c1Walk1;
  } else if (Math.abs(keys.a || keys.d ? 1 : 0) > 0) {
    const step = Math.floor(walkCycleTimer) % 2;
    activeFrameImg = (step === 0) ? imgs.c1Walk1 : imgs.c1Walk2;
  }

  ctx.save();
  ctx.translate(cx, cy);

  // Character 1 in original sheet faces left natively.
  // Facing right (1) -> flip horizontally with scale(-1, 1).
  // Facing left (-1) -> keep normal scale(1, 1).
  if (player.facing === 1) {
    ctx.scale(-1, 1);
  } else {
    ctx.scale(1, 1);
  }

  if (activeFrameImg && activeFrameImg.complete && activeFrameImg.naturalWidth > 0) {
    ctx.drawImage(activeFrameImg, -player.w / 2, -player.h, player.w, player.h);
  } else if (imgs.playerSheet && imgs.playerSheet.complete) {
    // Fallback: draw from sheet
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(imgs.playerSheet, 0, 0, 256, 576, -player.w / 2, -player.h, player.w, player.h);
  } else {
    ctx.fillStyle = '#ff2255';
    ctx.fillRect(-player.w / 2, -player.h, player.w, player.h);
  }
  ctx.restore();

  // Hit flash indicator
  if (player.hitCD > 700) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(player.x, player.y - player.h, player.w, player.h);
    ctx.restore();
  }
}

function drawEnemies() {
  for (const e of enemies) {
    const img = imgs.enemy;
    const bob = Math.sin(e.bobTime) * 3;
    const cx = e.x + e.w / 2;
    const cy = e.y + bob;

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, GROUND_Y + 2, e.w * 0.4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const facingLeft = (player.x + player.w / 2) < cx;
    ctx.translate(cx, cy);
    if (!facingLeft) ctx.scale(-1, 1);

    if (img && img.complete && img.naturalWidth > 0) {
      // Curse monster: crop middle monster region (avoid top HP bar and bottom dialog box)
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(img, 120, 80, 800, 640, -e.w / 2, -e.h, e.w, e.h);
    } else {
      ctx.fillStyle = '#7a1f2e';
      ctx.fillRect(-e.w / 2, -e.h, e.w, e.h);
    }
    ctx.restore();

    // Monster HP Bar
    const barW = e.w;
    const barX = e.x;
    const barY = e.y - e.h - 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barW, 5);
    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = hpPct > 0.5 ? '#44ff66' : hpPct > 0.25 ? '#ffaa00' : '#ff2233';
    ctx.fillRect(barX, barY, barW * hpPct, 5);
  }
}

function drawBoss() {
  if (!boss) return;
  const img = imgs.boss;
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;

  // Boss Dark Aura
  ctx.save();
  const auraGrd = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
  auraGrd.addColorStop(0, 'rgba(160, 40, 255, 0.35)');
  auraGrd.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrd;
  ctx.fillRect(boss.x - 60, boss.y - 60, boss.w + 120, boss.h + 120);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.globalCompositeOperation = 'screen';
    // Crop boss avoiding top title bar
    ctx.drawImage(img, 20, 40, 984, 514, -boss.w / 2, -boss.h / 2, boss.w, boss.h);
  } else {
    ctx.fillStyle = '#5500aa';
    ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
  }
  ctx.restore();

  // Energy Beam Warning Indicator (Telegraph Line)
  if (bossBeamWarning) {
    const progress = 1 - bossBeamWarnTimer / BOSS_WARN_TIME;
    ctx.save();
    ctx.globalAlpha = 0.25 + progress * 0.55;
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(0, bossBeamY - BOSS_BEAM_H / 2, CANVAS_W, BOSS_BEAM_H);

    // Flashing warning text: JUMP TO DODGE!
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 10;
    ctx.fillText('⚠ WARNING: ENERGY CHARGE — JUMP [W] TO DODGE! ⚠', CANVAS_W / 2, bossBeamY + 5);
    ctx.restore();
  }

  // Beam Active Firing
  if (bossBeamActive) {
    ctx.save();
    // Inner high-energy core
    const beamGrd = ctx.createLinearGradient(0, bossBeamY - BOSS_BEAM_H / 2, 0, bossBeamY + BOSS_BEAM_H / 2);
    beamGrd.addColorStop(0, 'rgba(255, 120, 0, 0)');
    beamGrd.addColorStop(0.3, 'rgba(255, 240, 100, 0.95)');
    beamGrd.addColorStop(0.7, 'rgba(255, 240, 100, 0.95)');
    beamGrd.addColorStop(1, 'rgba(255, 120, 0, 0)');
    ctx.fillStyle = beamGrd;
    ctx.fillRect(0, bossBeamY - BOSS_BEAM_H / 2, CANVAS_W, BOSS_BEAM_H);

    // Outer plasma glow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(0, bossBeamY - BOSS_BEAM_H - 12, CANVAS_W, BOSS_BEAM_H * 2 + 24);
    ctx.restore();
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.save();
    ctx.shadowColor = '#ff1144';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    // Hot bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSlashFX() {
  if (!slashFX) return;
  const progress = slashFX.timer / slashFX.duration;

  ctx.save();
  // Screen flash
  ctx.globalAlpha = (1 - progress) * 0.45;
  ctx.fillStyle = '#ff2299';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Dynamic slash streaks across screen
  ctx.globalAlpha = (1 - progress) * 0.95;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const y = 80 + i * 75;
    const x0 = CANVAS_W * progress;
    ctx.beginPath();
    ctx.moveTo(x0 - 150, y + i * 8);
    ctx.lineTo(x0 + CANVAS_W, y - i * 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life) * 0.9;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// MAIN RENDER
// ============================================================
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground();
  drawGround();

  if (stage === 1) drawEnemies();
  if (stage === 2) drawBoss();

  drawBullets();
  drawPlayer();
  drawSlashFX();
  drawParticles();
}

// ============================================================
// GAME LOOP
// ============================================================
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

// ============================================================
// BOOTSTRAP
// ============================================================
loadAllAssets(() => {
  startGame();
  lastTime = performance.now();
  requestAnimationFrame(loop);
});
