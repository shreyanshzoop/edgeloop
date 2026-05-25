/* ============================================================
   EDGELOOP — script.js
   CGI + Motion Design Studio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────────────────
     1. CUSTOM CURSOR
  ────────────────────────────────────────────────────────── */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animRing);
  })();


  /* ──────────────────────────────────────────────────────────
     2. BACKGROUND CANVAS — animated grid + particle network
  ────────────────────────────────────────────────────────── */
  (function initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GRID_COLS = 22;
    const GRID_ROWS = 14;
    let W, H, gridPts = [], time = 0;
    let normMouseX = 0.5, normMouseY = 0.5;

    // floating nodes
    const nodes = Array.from({ length: 60 }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      vx:    (Math.random() - 0.5) * 0.00012,
      vy:    (Math.random() - 0.5) * 0.00012,
      r:     Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    function buildGrid() {
      gridPts = [];
      for (let r = 0; r <= GRID_ROWS; r++) {
        for (let c = 0; c <= GRID_COLS; c++) {
          gridPts.push({
            x:     (c / GRID_COLS) * W,
            y:     (r / GRID_ROWS) * H,
            ox:    c / GRID_COLS,
            oy:    r / GRID_ROWS,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildGrid();
    }

    window.addEventListener('resize', resize);
    resize();

    document.addEventListener('mousemove', e => {
      normMouseX = e.clientX / window.innerWidth;
      normMouseY = e.clientY / window.innerHeight;
    });

    function getPt(r, c) {
      const pt      = gridPts[r * (GRID_COLS + 1) + c];
      const distort = 0.012;
      const mxInfl  = (normMouseX - pt.ox) * 0.015;
      const myInfl  = (normMouseY - pt.oy) * 0.015;
      const wave    = Math.sin(time + pt.phase) * distort;
      return {
        x: pt.x + mxInfl * W + wave * W,
        y: pt.y + myInfl * H + wave * H,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      time += 0.008;

      // distorted mesh grid
      ctx.strokeStyle = 'rgba(255,255,255,0.028)';
      ctx.lineWidth = 0.5;

      for (let r = 0; r <= GRID_ROWS; r += 2) {
        ctx.beginPath();
        for (let c = 0; c <= GRID_COLS; c++) {
          const p = getPt(r, c);
          c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (let c = 0; c <= GRID_COLS; c += 2) {
        ctx.beginPath();
        for (let r = 0; r <= GRID_ROWS; r++) {
          const p = getPt(r, c);
          r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // nodes + connections
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = (nodes[i].x - nodes[j].x) * W;
          const dy   = (nodes[i].y - nodes[j].y) * H;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 130) * 0.07})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(255,255,255,${nodes[i].alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(nodes[i].x * W, nodes[i].y * H, nodes[i].r, 0, Math.PI * 2);
        ctx.fill();
      }

      // horizontal light sweep
      const sweepX = ((time * 0.04) % 1.4 - 0.2) * W;
      const sweepG = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
      sweepG.addColorStop(0,   'rgba(255,255,255,0)');
      sweepG.addColorStop(0.5, 'rgba(255,255,255,0.018)');
      sweepG.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = sweepG;
      ctx.fillRect(sweepX - 80, 0, 160, H);

      requestAnimationFrame(draw);
    }

    draw();
  })();


  /* ──────────────────────────────────────────────────────────
     3. MARQUEE
  ────────────────────────────────────────────────────────── */
  const marqueeItems = [
    '3D anamorphic', 'motion design', 'cgi production', 'brand content',
    'product visualization', 'immersive visuals', 'digital campaigns', 'creative direction',
  ];
  const track = document.getElementById('marquee-track');
  if (track) {
    track.innerHTML = [...marqueeItems, ...marqueeItems, ...marqueeItems]
      .map(t => `<span class="marquee-item">${t}</span><span class="marquee-dot"></span>`)
      .join('');
  }


  /* ──────────────────────────────────────────────────────────
     4. SCROLL REVEAL
  ────────────────────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


  /* ──────────────────────────────────────────────────────────
     5. CARD TILT EFFECT
  ────────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.15s ease';
    });
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s ease';
      card.style.transform  = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
    });
  });


  /* ──────────────────────────────────────────────────────────
     6. PROJECT CARD CANVASES
  ────────────────────────────────────────────────────────── */
  const cardThemes = [
    { bg: '#0a0a0f', gridColor: 'rgba(120,120,180,0.15)', nodeColor: 'rgba(200,200,255,0.08)' },
    { bg: '#0a0f0a', gridColor: 'rgba(80,160,100,0.12)',  nodeColor: 'rgba(180,220,190,0.07)' },
    { bg: '#0f0a0a', gridColor: 'rgba(180,80,60,0.12)',   nodeColor: 'rgba(240,180,160,0.07)' },
    { bg: '#0a0a0a', gridColor: 'rgba(160,140,60,0.12)',  nodeColor: 'rgba(220,200,140,0.07)' },
  ];

  cardThemes.forEach((theme, i) => {
    const cv = document.getElementById(`card-canvas-${i}`);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let tick = Math.random() * 100;

    const pts = Array.from({ length: 30 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
    }));

    (function frame() {
      const W = cv.offsetWidth  || 400;
      const H = cv.offsetHeight || 300;
      cv.width = W; cv.height = H;

      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // particles
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });

      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = (pts[a].x - pts[b].x) * W;
          const dy = (pts[a].y - pts[b].y) * H;
          const d  = Math.hypot(dx, dy);
          if (d < 100) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 100) * 0.12})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(pts[a].x * W, pts[a].y * H);
            ctx.lineTo(pts[b].x * W, pts[b].y * H);
            ctx.stroke();
          }
        }
        ctx.fillStyle = theme.nodeColor;
        ctx.beginPath();
        ctx.arc(pts[a].x * W, pts[a].y * H, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // sweep
      const sw = ((tick * 0.0025) % 1.3 - 0.15) * W;
      const sg = ctx.createLinearGradient(sw - 50, 0, sw + 50, 0);
      sg.addColorStop(0,   'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.04)');
      sg.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sw - 50, 0, 100, H);

      tick++;
      requestAnimationFrame(frame);
    })();
  });


  /* ──────────────────────────────────────────────────────────
     6.5. PROJECT CARD VIDEO PLAYBACK
  ────────────────────────────────────────────────────────── */
  document.querySelectorAll('.project-card').forEach(card => {
    const video = card.querySelector('.card-video');
    const playBtn = card.querySelector('.play-button');
    
    if (!video || !playBtn) return;

    // Play button click
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        video.classList.add('playing');
        playBtn.classList.add('hidden');
      }
    });

    // Video click to toggle
    video.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    // Play event
    video.addEventListener('play', () => {
      video.classList.add('playing');
      playBtn.classList.add('hidden');
    });

    // Pause event
    video.addEventListener('pause', () => {
      video.classList.remove('playing');
      playBtn.classList.remove('hidden');
    });

    // Card mouse leave - reset video
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
      video.classList.remove('playing');
      playBtn.classList.remove('hidden');
    });
  });


  /* ──────────────────────────────────────────────────────────
     7. OUR WORK CATEGORY CANVASES
  ────────────────────────────────────────────────────────── */
  const wcatConfig = [
    {
      /* 3D Anamorphic — perspective grid + hexagonal rings */
      bg:        '#060608',
      gridColor: 'rgba(100,110,200,0.09)',
      nodeColor: 'rgba(140,150,255,0.55)',
      lineColor: [100, 110, 255],
      draw(ctx, W, H, t) {
        // perspective vanishing-point floor grid
        const cx = W * 0.5, cy = H * 0.42;
        const cols = 10, rows = 8;
        ctx.strokeStyle = 'rgba(90,100,180,0.07)';
        ctx.lineWidth = 0.6;
        for (let i = 0; i <= cols; i++) {
          const x = (i / cols) * W;
          ctx.beginPath();
          ctx.moveTo(cx + (x - cx) * 0.1, cy + (0 - cy) * 0.1);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let j = 1; j <= rows; j++) {
          const prog = j / rows;
          const y  = cy + (H - cy) * prog;
          const xl = cx - cx * prog;
          const xr = cx + (W - cx) * prog;
          ctx.beginPath();
          ctx.moveTo(xl, y); ctx.lineTo(xr, y);
          ctx.stroke();
        }
        // floating hexagonal rings
        for (let r = 0; r < 3; r++) {
          const rx  = W * (0.25 + r * 0.25);
          const ry  = H * 0.3 + Math.sin(t * 0.6 + r * 2.1) * 18;
          const rad = 28 + r * 14;
          ctx.strokeStyle = `rgba(120,130,230,${0.12 - r * 0.03})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) {
            const ang = (s / 6) * Math.PI * 2 - Math.PI / 6 + t * 0.2 * (r % 2 ? 1 : -1);
            const px = rx + Math.cos(ang) * rad;
            const py = ry + Math.sin(ang) * rad;
            s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      },
    },
    {
      /* Brand Work — diagonal slash + concentric rectangles */
      bg:        '#060806',
      gridColor: 'rgba(80,160,90,0.08)',
      nodeColor: 'rgba(100,220,130,0.5)',
      lineColor: [80, 200, 110],
      draw(ctx, W, H, t) {
        // diagonal slash pattern
        ctx.strokeStyle = 'rgba(70,140,80,0.055)';
        ctx.lineWidth = 0.5;
        for (let x = -H; x < W + H; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0); ctx.lineTo(x + H, H);
          ctx.stroke();
        }
        // breathing concentric rectangles
        for (let i = 1; i <= 4; i++) {
          const margin = i * 28 + Math.sin(t * 0.4 + i) * 4;
          ctx.strokeStyle = `rgba(80,190,100,${0.08 - i * 0.015})`;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);
        }
        // crosshair
        ctx.strokeStyle = 'rgba(80,200,100,0.07)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
      },
    },
    {
      /* Artist Visuals — radial burst + concentric circles */
      bg:        '#080608',
      gridColor: 'rgba(180,80,160,0.07)',
      nodeColor: 'rgba(220,120,200,0.5)',
      lineColor: [200, 80, 180],
      draw(ctx, W, H, t) {
        const cx = W * 0.5, cy = H * 0.45;
        // radial rays
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + t * 0.08;
          const len = 180 + Math.sin(t * 1.2 + i * 0.4) * 40;
          ctx.strokeStyle = `rgba(180,60,160,${0.04 + Math.sin(t * 0.8 + i) * 0.025})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
          ctx.stroke();
        }
        // concentric circles
        for (let r = 1; r <= 5; r++) {
          const rad = r * 38 + Math.sin(t * 0.5 + r) * 5;
          ctx.strokeStyle = `rgba(190,60,170,${0.06 - r * 0.008})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
        // rotating triangle
        ctx.strokeStyle = 'rgba(200,80,180,0.1)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let s = 0; s <= 3; s++) {
          const ang = (s / 3) * Math.PI * 2 + t * 0.15;
          const px  = cx + Math.cos(ang) * 65;
          const py  = cy + Math.sin(ang) * 65;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      },
    },
  ];

  wcatConfig.forEach((config, i) => {
    const cv = document.getElementById(`wcat-canvas-${i}`);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let t = Math.random() * 100;

    const pts = Array.from({ length: 25 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
    }));

    const [lr, lg, lb] = config.lineColor;

    (function renderWcat() {
      const W = cv.offsetWidth  || 360;
      const H = cv.offsetHeight || 520;
      cv.width = W; cv.height = H;
      t += 0.012;

      ctx.fillStyle = config.bg;
      ctx.fillRect(0, 0, W, H);

      // base grid
      ctx.strokeStyle = config.gridColor;
      ctx.lineWidth = 0.4;
      for (let x = 0; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 44) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // custom themed geometry
      config.draw(ctx, W, H, t);

      // floating nodes + connections
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });

      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = (pts[a].x - pts[b].x) * W;
          const dy = (pts[a].y - pts[b].y) * H;
          const d  = Math.hypot(dx, dy);
          if (d < 110) {
            ctx.strokeStyle = `rgba(${lr},${lg},${lb},${(1 - d / 110) * 0.1})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(pts[a].x * W, pts[a].y * H);
            ctx.lineTo(pts[b].x * W, pts[b].y * H);
            ctx.stroke();
          }
        }
        ctx.fillStyle = config.nodeColor;
        ctx.beginPath();
        ctx.arc(pts[a].x * W, pts[a].y * H, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // horizontal sweep
      const sw = ((t * 0.022) % 1.3 - 0.15) * W;
      const sg = ctx.createLinearGradient(sw - 60, 0, sw + 60, 0);
      sg.addColorStop(0,   'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.03)');
      sg.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sw - 60, 0, 120, H);

      requestAnimationFrame(renderWcat);
    })();
  });


  /* ──────────────────────────────────────────────────────────
     8. WIREFRAME CUBE ROTATION (SVG)
  ────────────────────────────────────────────────────────── */
  const cubeGroup = document.getElementById('cube-group');
  if (cubeGroup) {
    let angle = 0;
    (function rotateCube() {
      angle += 0.3;
      cubeGroup.setAttribute('transform', `rotate(${angle}, 70, 66)`);
      requestAnimationFrame(rotateCube);
    })();
  }


  /* ──────────────────────────────────────────────────────────
     9. HERO PARALLAX ON SCROLL
  ────────────────────────────────────────────────────────── */
  const heroTitle = document.querySelector('.hero-title');
  window.addEventListener('scroll', () => {
    if (!heroTitle) return;
    const scrolled = window.scrollY;
    heroTitle.style.transform = `translateY(${scrolled * 0.15}px)`;
    heroTitle.style.opacity   = Math.max(0, 1 - scrolled * 0.002);
  }, { passive: true });

});
