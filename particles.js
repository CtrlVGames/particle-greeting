const COLOR_PALETTES = [
  { id: 'rose',   name: 'Rose',   swatch: '#FF6B9D', colors: ['#FF6B9D', '#FF9EC1', '#FFB3D1', '#FF82B2', '#FF5C8A'] },
  { id: 'fire',   name: 'Fire',   swatch: '#FF6B00', colors: ['#FF4500', '#FF6B00', '#FFD700', '#FF8C00', '#FFA500'] },
  { id: 'ocean',  name: 'Ocean',  swatch: '#4A90E2', colors: ['#4A90E2', '#7EC8E3', '#B0D8F5', '#5BA3D9', '#2176AE'] },
  { id: 'aurora', name: 'Aurora', swatch: '#B8A9FF', colors: ['#B8A9FF', '#A8E6CF', '#FFD580', '#FF9EC1', '#7EC8E3'] },
  { id: 'forest', name: 'Forest', swatch: '#2ECC71', colors: ['#2ECC71', '#27AE60', '#A8E6CF', '#1ABC9C', '#16A085'] },
  { id: 'cyber',  name: 'Cyber',  swatch: '#00FFFF', colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF88', '#FF4488'] },
  { id: 'gold',   name: 'Gold',   swatch: '#FFD700', colors: ['#FFD700', '#FFC200', '#FFE566', '#FFAA00', '#FFF0A0'] },
  { id: 'snow',   name: 'Snow',   swatch: '#E8E8FF', colors: ['#FFFFFF', '#E8E8FF', '#D0E8FF', '#F0F0F0', '#C8D8FF'] },
];

class ExplodeParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = 1;
    this.decay = 0.016 + Math.random() * 0.024;
    this.size = 1.5 + Math.random() * 3.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.life * this.life;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
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
    this.ease = 0.20 + Math.random() * 0.08;
    this.delay = Math.random() * 20;
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

  recolor(color) { this.color = color; }

  scatter(mouseX, mouseY, radius) {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
      const force = (radius - dist) / radius;
      this.vx += (dx / dist) * force * 12;
      this.vy += (dy / dist) * force * 12;
      this.settled = false;
    }
  }

  update() {
    this.tick++;
    if (this.tick < this.delay) return;

    const dx = this.targetX + this.offsetX - this.x;
    const dy = this.targetY + this.offsetY - this.y;

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
      this.x += Math.sin(this.breathAngle) * 0.55
              + Math.sin(this.breathAngle * 1.73 + this.breathPhase2) * 0.25;
      this.y += Math.cos(this.breathAngle * 0.89) * 0.55
              + Math.cos(this.breathAngle * 2.31 + this.breathPhase2) * 0.2;
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

class ParticleText {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.explosionParticles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.scatterRadius = 80;
    this.animFrameId = null;
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d');
    this.palette = COLOR_PALETTES[0].colors;
    // Global time counter for wave animation
    this.time = 0;
    // Pulse wave state
    this.pulseActive = false;
    this.pulseRadius = 0;
    this.pulseX = 0;
    this.pulseY = 0;
    this.pulseLastTime = 0;
    this.PULSE_INTERVAL = 3000;
    this.PULSE_SPEED = 6;
    this.PULSE_STRENGTH = 4.5;
    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
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
      this.mouse.y = t.clientY - rect.top;
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  setPalette(paletteId) {
    const found = COLOR_PALETTES.find(p => p.id === paletteId);
    if (!found) return;
    this.palette = found.colors;
    for (const p of this.particles) {
      if (p.alpha > 0) {
        p.recolor(this.palette[Math.floor(Math.random() * this.palette.length)]);
      }
    }
  }

  explode(x, y, count = 80) {
    for (let i = 0; i < count; i++) {
      const color = this.palette[Math.floor(Math.random() * this.palette.length)];
      this.explosionParticles.push(new ExplodeParticle(x, y, color));
    }
  }

  _getFontSize(text, maxWidth) {
    const isMultibyte = /[\u3000-\u9fff\uac00-\ud7af\u0600-\u06ff\u0900-\u097f\u0e00-\u0e7f]/.test(text);
    const baseSize = isMultibyte ? 120 : 100;
    this.offscreen.width = maxWidth;
    this.offscreen.height = 200;
    let size = baseSize;
    while (size > 20) {
      this.offCtx.font = `bold ${size}px "Noto Sans", "Apple Color Emoji", sans-serif`;
      const w = this.offCtx.measureText(text).width;
      if (w <= maxWidth * 0.85) break;
      size -= 4;
    }
    return size;
  }

  _extractPoints(text, countryCode) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const fontSize = this._getFontSize(text, W);
    const pw = W;
    const ph = Math.min(H, 300);

    this.offscreen.width = pw;
    this.offscreen.height = ph;
    this.offCtx.clearRect(0, 0, pw, ph);
    this.offCtx.font = `bold ${fontSize}px "Noto Sans", "Apple Color Emoji", sans-serif`;
    this.offCtx.fillStyle = '#fff';
    this.offCtx.textAlign = 'center';
    this.offCtx.textBaseline = 'middle';

    const isRTL = ['SA', 'AE', 'EG'].includes(countryCode);
    if (isRTL) {
      this.offCtx.direction = 'rtl';
      this.offCtx.fillText(text, pw / 2, ph / 2);
      this.offCtx.direction = 'ltr';
    } else {
      this.offCtx.fillText(text, pw / 2, ph / 2);
    }

    const imageData = this.offCtx.getImageData(0, 0, pw, ph);
    const data = imageData.data;
    const points = [];
    const gap = 4;

    for (let y = 0; y < ph; y += gap) {
      for (let x = 0; x < pw; x += gap) {
        const idx = (y * pw + x) * 4;
        if (data[idx + 3] > 128) {
          const offsetY = (H - ph) / 2;
          points.push({ x, y: y + offsetY });
        }
      }
    }
    return points;
  }

  setText(text, countryCode) {
    const points = this._extractPoints(text, countryCode);
    if (points.length === 0) return;

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

  _triggerPulse() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.pulseActive = true;
    this.pulseRadius = 0;
    this.pulseX = cx;
    this.pulseY = cy;
  }

  _updatePulse() {
    if (!this.pulseActive) return;
    this.pulseRadius += this.PULSE_SPEED;
    const maxR = Math.hypot(this.canvas.width, this.canvas.height) * 0.6;
    if (this.pulseRadius > maxR) {
      this.pulseActive = false;
      return;
    }
    const bandwidth = 40;
    for (const p of this.particles) {
      if (!p.settled) continue;
      const dx = p.x - this.pulseX;
      const dy = p.y - this.pulseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const diff = Math.abs(dist - this.pulseRadius);
      if (diff < bandwidth) {
        const strength = (1 - diff / bandwidth) * this.PULSE_STRENGTH;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * strength;
        p.vy += Math.sin(angle) * strength;
        p.settled = false;
      }
    }
  }

  _loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.time++;

    // Auto-trigger pulse every PULSE_INTERVAL ms
    const now = performance.now();
    if (now - this.pulseLastTime > this.PULSE_INTERVAL) {
      this._triggerPulse();
      this.pulseLastTime = now;
    }
    this._updatePulse();

    for (const p of this.particles) {
      p.scatter(this.mouse.x, this.mouse.y, this.scatterRadius);
      // Flowing wave displacement for settled particles
      if (p.settled) {
        const wave = Math.sin(this.time * 0.018 + p.targetX * 0.012) * 1.2;
        p.y += wave * 0.06;
      }
      p.update();
      p.draw(this.ctx);
    }

    this.explosionParticles = this.explosionParticles.filter(p => !p.dead);
    for (const p of this.explosionParticles) {
      p.update();
      p.draw(this.ctx);
    }

    this.animFrameId = requestAnimationFrame(() => this._loop());
  }

  start() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
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
