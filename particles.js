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
      this.x += Math.sin(this.breathAngle) * 0.15;
      this.y += Math.cos(this.breathAngle * 0.7) * 0.15;
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
    this.mouse = { x: -9999, y: -9999 };
    this.scatterRadius = 80;
    this.animFrameId = null;
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d');
    this.palette = ['#ffffff'];
    this.isTransitioning = false;
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

  _getPalette(countryCode) {
    const palettes = {
      KR: ['#FF6B9D', '#FF9EC1', '#FFB3D1', '#FF82B2', '#FF5C8A'],
      JP: ['#FF6B6B', '#FF9F9F', '#FFD4D4', '#FF8E8E', '#FF5757'],
      CN: ['#FF4444', '#FF7B00', '#FFD700', '#FF6600', '#FF2222'],
      TW: ['#FF4444', '#FF7B00', '#FFD700', '#FF6600', '#FF2222'],
      HK: ['#FF4444', '#FF7B00', '#FFD700', '#FF6600', '#FF2222'],
      US: ['#4A90E2', '#E24A4A', '#FFFFFF', '#6BAED6', '#B0C4DE'],
      GB: ['#4A90E2', '#E24A4A', '#FFFFFF', '#6BAED6', '#B0C4DE'],
      FR: ['#4A90E2', '#E24A4A', '#FFFFFF', '#6BAED6', '#B0C4DE'],
      DE: ['#444444', '#FF9900', '#FF3333', '#777777', '#BBBBBB'],
      SA: ['#2ECC71', '#27AE60', '#A8E6CF', '#3CB371', '#1E8449'],
      AE: ['#2ECC71', '#27AE60', '#A8E6CF', '#3CB371', '#1E8449'],
      IN: ['#FF9933', '#FFFFFF', '#138808', '#FF7700', '#00AA00'],
      BR: ['#2ECC71', '#FFD700', '#3498DB', '#27AE60', '#F1C40F'],
      default: ['#7EC8E3', '#B8A9FF', '#FFD580', '#A8E6CF', '#FFB3D1'],
    };
    return palettes[countryCode] || palettes.default;
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
    this.palette = this._getPalette(countryCode);
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

  _loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      p.scatter(this.mouse.x, this.mouse.y, this.scatterRadius);
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
