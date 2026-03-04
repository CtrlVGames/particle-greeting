/** 마우스로 글씨를 밀어내는 힘의 세기. 키우면 더 세게, 줄이면 약하게 밀림. */
const SCATTER_FORCE = 8;
/** 마우스로부터 이 거리(px) 안의 파티클만 반응. 키우면 더 넓은 범위가 밀림. */
const SCATTER_RADIUS = 40;
/** 파티클 샘플 간격(px). 키울수록 파티클 수 감소, 성능 개선. 되돌리려면 4로. */
const PARTICLE_GAP = 5;
/** 파티클 수 상한. 장문 시 버벅임 방지. 되돌리려면 이 상수와 setText 내 샘플링 블록 제거. */
const MAX_PARTICLES = 8000;

const COLOR_PALETTES = [
  { id: 'pink', name: 'Pink', colors: ['#FF6B9D', '#FF9EC1', '#FFB3D1', '#FF82B2', '#FF5C8A'] },
  { id: 'coral', name: 'Coral', colors: ['#FF6B6B', '#FF9F9F', '#FFD4D4', '#FF8E8E', '#FF5757'] },
  { id: 'sunset', name: 'Sunset', colors: ['#FF4444', '#FF7B00', '#FFD700', '#FF6600', '#FF2222'] },
  { id: 'ocean', name: 'Ocean', colors: ['#4A90E2', '#E24A4A', '#FFFFFF', '#6BAED6', '#B0C4DE'] },
  { id: 'forest', name: 'Forest', colors: ['#2ECC71', '#27AE60', '#A8E6CF', '#3CB371', '#1E8449'] },
  { id: 'pastel', name: 'Pastel', colors: ['#7EC8E3', '#B8A9FF', '#FFD580', '#A8E6CF', '#FFB3D1'] },
  { id: 'gold', name: 'Gold', colors: ['#FF9933', '#FFFFFF', '#138808', '#FF7700', '#00AA00'] },
  { id: 'warm', name: 'Warm', colors: ['#2ECC71', '#FFD700', '#3498DB', '#27AE60', '#F1C40F'] },
];

class ExplodeParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 14;
    this.vy = (Math.random() - 0.5) * 14;
    this.color = color;
    this.alpha = 1;
    this.size = Math.random() * 2 + 1;
    this.friction = 0.92;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.alpha *= 0.96;
    this.size *= 0.98;
  }
  draw(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.targetX = 0;
    this.targetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 2 + 1;
    this.baseSize = this.size;
    this.color = '#ffffff';
    this.alpha = 0;
    this.friction = 0.88;
    this.ease = 0.12 + Math.random() * 0.06;
    this.delay = Math.random() * 40;
    this.tick = 0;
    this.settled = false;
    this.offsetX = (Math.random() - 0.5) * 1.2;
    this.offsetY = (Math.random() - 0.5) * 1.2;
    this.breathAngle = Math.random() * Math.PI * 2;
    this.breathSpeed = 0.02 + Math.random() * 0.02;
    this.breathPhase2 = Math.random() * Math.PI * 2;
  }

  setTarget(x, y, color) {
    this.targetX = x;
    this.targetY = y;
    this.color = color;
    this.tick = 0;
    this.settled = false;
  }

  scatter(mouseX, mouseY, radius) {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      const force = (radius - dist) / radius;
      this.vx += (dx / dist) * force * SCATTER_FORCE;
      this.vy += (dy / dist) * force * SCATTER_FORCE;
      this.settled = false;
    }
  }

  update(pulseOffsetX, pulseOffsetY) {
    this.tick++;
    if (this.tick < this.delay) return;

    let tx = this.targetX + this.offsetX;
    let ty = this.targetY + this.offsetY;
    if (pulseOffsetX !== undefined && pulseOffsetY !== undefined) {
      tx += pulseOffsetX;
      ty += pulseOffsetY;
    }

    const dx = tx - this.x;
    const dy = ty - this.y;

    this.vx += dx * this.ease;
    this.vy += dy * this.ease;
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;

    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    if (distToTarget < 0.5 && Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
      this.settled = true;
    }

    if (this.settled) {
      this.breathAngle += this.breathSpeed;
      this.breathPhase2 += this.breathSpeed * 0.8;
      const b1 = Math.sin(this.breathAngle) * 0.55 + Math.sin(this.breathPhase2) * 0.25;
      const b2 = Math.cos(this.breathAngle * 0.7) * 0.55 + Math.cos(this.breathPhase2 * 0.6) * 0.2;
      this.x += b1;
      this.y += b2;
    }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.size = this.baseSize + Math.min(speed * 0.15, 2);

    this.alpha = Math.min(this.alpha + 0.05, 1);
  }

  draw(ctx) {
    if (this.tick < this.delay) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const PULSE_INTERVAL = 3000;
const PULSE_STRENGTH = 4.5;

class ParticleText {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.explodeParticles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.scatterRadius = SCATTER_RADIUS;
    this.animFrameId = null;
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d');
    this.palette = (COLOR_PALETTES[0] && COLOR_PALETTES[0].colors) ? COLOR_PALETTES[0].colors.slice() : ['#ffffff'];
    this.paletteId = (COLOR_PALETTES[0] && COLOR_PALETTES[0].id) ? COLOR_PALETTES[0].id : 'pink';
    this.paletteName = (COLOR_PALETTES[0] && COLOR_PALETTES[0].name) ? COLOR_PALETTES[0].name : 'Pink';
    this.isTransitioning = false;
    this.pulseWave = 0;
    this.lastPulseAt = 0;
    this._bindEvents();
  }

  _triggerPulse() {
    this.pulseWave = 1;
    this.lastPulseAt = performance.now();
  }

  _updatePulse() {
    if (this.pulseWave <= 0) return { x: 0, y: 0 };
    const elapsed = performance.now() - this.lastPulseAt;
    const decay = Math.max(0, 1 - elapsed / 800);
    const wave = Math.sin(elapsed * 0.012) * decay * PULSE_STRENGTH;
    this.pulseWave = decay;
    return { x: wave * 0.7, y: wave };
  }

  _scrollTop() {
    const wrap = this.canvas.parentElement && this.canvas.parentElement.parentElement;
    return (wrap && wrap.scrollTop) || 0;
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top + this._scrollTop();
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.mouse.x = t.clientX - rect.left;
      this.mouse.y = t.clientY - rect.top + this._scrollTop();
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  setPalette(paletteId) {
    const p = COLOR_PALETTES.find(x => x.id === paletteId) || COLOR_PALETTES[0];
    this.palette = p.colors.slice();
    this.paletteId = p.id;
    this.paletteName = p.name;
  }

  explode(x, y) {
    const colors = this.palette.length ? this.palette : ['#fff'];
    for (let i = 0; i < 24; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.explodeParticles.push(new ExplodeParticle(x, y, c));
    }
  }

  _getFontSize(line, maxWidth) {
    const isMultibyte = /[\u3000-\u9fff\uac00-\ud7af\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f]/.test(line);
    const baseSize = isMultibyte ? 120 : 100;
    this.offscreen.width = maxWidth;
    this.offscreen.height = 200;
    let size = baseSize;
    while (size > 20) {
      this.offCtx.font = `bold ${size}px "Noto Sans", "Apple Color Emoji", sans-serif`;
      const w = this.offCtx.measureText(line).width;
      if (w <= maxWidth * 0.85) break;
      size -= 4;
    }
    return size;
  }

  _extractPoints(text, countryCode) {
    const W = this.canvas.offsetWidth || this.canvas.width;
    const lines = text.split('\n');
    if (!lines.length) return { points: [], contentHeight: 0 };

    const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b)) || '';
    const baseFontSize = this._getFontSize(longest, W);
    const fontSize = lines.length >= 2 ? baseFontSize * 0.8 : baseFontSize;
    const lineHeight = fontSize * 1.3;
    const blockHeight = lines.length * lineHeight;
    let paddingTop, paddingBottom, contentHeight;

    if (lines.length <= 3) {
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : blockHeight + 80;
      contentHeight = Math.max(blockHeight + 80, viewportH);
      paddingTop = (contentHeight - blockHeight) / 2;
      paddingBottom = contentHeight - paddingTop - blockHeight;
    } else {
      paddingTop = 40;
      paddingBottom = 40;
      contentHeight = Math.ceil(paddingTop + blockHeight + paddingBottom);
    }

    const pw = W;
    const ph = contentHeight;

    this.offscreen.width = pw;
    this.offscreen.height = ph;
    this.offCtx.clearRect(0, 0, pw, ph);
    this.offCtx.font = `bold ${fontSize}px "Noto Sans", "Apple Color Emoji", sans-serif`;
    this.offCtx.fillStyle = '#fff';
    this.offCtx.textAlign = 'center';
    this.offCtx.textBaseline = 'middle';

    const isRTL = ['SA', 'AE', 'EG'].includes(countryCode);
    for (let i = 0; i < lines.length; i++) {
      const y = paddingTop + i * lineHeight + lineHeight / 2;
      if (isRTL) this.offCtx.direction = 'rtl';
      this.offCtx.fillText(lines[i], pw / 2, y);
      if (isRTL) this.offCtx.direction = 'ltr';
    }

    const imageData = this.offCtx.getImageData(0, 0, pw, ph);
    const data = imageData.data;
    const points = [];
    const gap = PARTICLE_GAP;

    for (let y = 0; y < ph; y += gap) {
      for (let x = 0; x < pw; x += gap) {
        const idx = (y * pw + x) * 4;
        if (data[idx + 3] > 128) points.push({ x, y });
      }
    }
    return { points, contentHeight: ph };
  }

  setText(text, countryCode) {
    const W = this.canvas.offsetWidth || this.canvas.width;
    let { points, contentHeight } = this._extractPoints(text, countryCode);
    if (points.length === 0) return;

    // 성능: 파티클 수 상한 (되돌리려면 아래 5줄 삭제)
    if (points.length > MAX_PARTICLES) {
      const step = points.length / MAX_PARTICLES;
      points = Array.from({ length: MAX_PARTICLES }, (_, i) =>
        points[Math.min(Math.floor(i * step), points.length - 1)]
      );
    }

    this.contentHeight = contentHeight;
    this.canvas.width = W;
    this.canvas.height = contentHeight;

    const needed = points.length;
    while (this.particles.length < needed) {
      this.particles.push(new Particle(this.canvas));
    }

    const shuffled = [...points].sort(() => Math.random() - 0.5);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (i < shuffled.length) {
        const color = this.palette[Math.floor(Math.random() * this.palette.length)];
        p.setTarget(shuffled[i].x, shuffled[i].y, color);
        p.alpha = 0;
        p.x = Math.random() * this.canvas.width;
        p.y = Math.random() * this.canvas.height;
        p.vx = 0;
        p.vy = 0;
      } else {
        p.setTarget(-100, -100, 'transparent');
        p.alpha = 0;
      }
    }
  }

  _loop() {
    const now = performance.now();
    if (now - this.lastPulseAt >= PULSE_INTERVAL) this._triggerPulse();
    const pulse = this._updatePulse();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      // 마우스 커서 주변 파티클 밀어내기 (필요 시 주석 해제)
      // p.scatter(this.mouse.x, this.mouse.y, this.scatterRadius);
      p.update(pulse.x, pulse.y);
      p.draw(this.ctx);
    }

    for (let i = this.explodeParticles.length - 1; i >= 0; i--) {
      const ep = this.explodeParticles[i];
      ep.update();
      ep.draw(this.ctx);
      if (ep.alpha <= 0.01) this.explodeParticles.splice(i, 1);
    }

    this.animFrameId = requestAnimationFrame(() => this._loop());
  }

  start() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.lastPulseAt = performance.now();
    this._loop();
  }

  stop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }
}
