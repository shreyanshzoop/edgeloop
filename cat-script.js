/* ============================================================
   EDGELOOP — cat-script.js
   Shared JS for category sub-pages (anamorphic / brand / artist)

   What this does:
     1. Reads category data from window.EDGELOOP_PROJECTS
        (loaded from projects.js).
     2. Identifies the current category from <body data-cat="...">.
     3. Renders the 6-slot grid from the manifest — videos when
        present, "coming soon" placeholder otherwise.
     4. Hover plays video, leave pauses + resets.
     5. Background canvas + custom cursor + scroll reveals.

   What was removed:
     - The old file-picker drag-and-drop on empty slots, because
       URL.createObjectURL() blobs are local-only, don't persist
       across reloads, and don't show up for any other visitor.
       Production content belongs in /videos/ and in projects.js.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. RENDER GRID FROM MANIFEST ─────────────────────────── */
  const catKey = document.body.dataset.cat;
  const data   = (window.EDGELOOP_PROJECTS || {})[catKey];
  const grid   = document.getElementById('cat-grid');

  if (data && grid) {
    // hero meta (in case the HTML uses placeholders)
    setText('cat-eyebrow', data.meta.eyebrow);
    setText('cat-title',   data.meta.title);

    const meta = document.getElementById('cat-meta');
    if (meta) {
      meta.innerHTML =
        data.meta.tags.map(t => `<div class="cat-tag-pill">${escapeHtml(t)}</div>`).join('') +
        `<p class="cat-desc">${escapeHtml(data.meta.desc)}</p>`;
    }

    setText('cat-grid-count', String(data.projects.length).padStart(2, '0') + ' projects');

    grid.innerHTML = data.projects.map((p, i) => slotMarkup(p, i)).join('');

    const footerLinks = document.getElementById('cat-footer-links');
    if (footerLinks) {
      footerLinks.innerHTML = data.meta.footerLinks
        .map(l => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('');
    }
  }

  function slotMarkup(p, i) {
    const num = String(i + 1).padStart(2, '0');
    let media = '';

    if (p.video) {
      const poster = p.poster ? ` poster="images/${p.poster}"` : '';
      media = `
        <video
          src="videos/${p.video}"${poster}
          muted loop playsinline preload="metadata"
          onerror="this.parentNode.classList.add('media-failed')">
        </video>`;
    } else if (p.image) {
      media = `<img src="images/${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">`;
    } else {
      media = `
        <div class="vid-slot-empty">
          <div class="vid-slot-icon">▶</div>
          <span class="vid-slot-label">${p.title === 'Coming soon' ? 'coming soon' : 'in production'}</span>
        </div>`;
    }

    return `
      <div class="vid-slot" data-has-media="${!!(p.video || p.image)}">
        <span class="vid-slot-num">${num}</span>
        ${media}
        <div class="vid-slot-overlay"></div>
        <div class="vid-slot-play">▶</div>
        <div class="vid-slot-info">
          <div class="vid-slot-title">${escapeHtml(p.title)}</div>
          <div class="vid-slot-cat">${escapeHtml(p.cat)}</div>
        </div>
        <div class="vid-slot-border"></div>
      </div>`;
  }

  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function escapeHtml(s)  { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ── 2. SLOT HOVER PLAY/PAUSE ─────────────────────────────── */
  document.querySelectorAll('.vid-slot').forEach(slot => {
    const video = slot.querySelector('video');
    if (!video) return;
    slot.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
    slot.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    slot.addEventListener('click', () => {
      // optional: fullscreen request
      if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
    });
  });

  /* ── 3. CURSOR ────────────────────────────────────────────── */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  if (cursor && cursorRing) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });
    (function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    })();
  }

  /* ── 4. BACKGROUND CANVAS ─────────────────────────────────── */
  (function initBg() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, time = 0;
    let nmx = 0.5, nmy = 0.5;

    const nodes = Array.from({ length: 50 }, () => ({
      x:  Math.random(), y:  Math.random(),
      vx: (Math.random() - 0.5) * 0.00010,
      vy: (Math.random() - 0.5) * 0.00010,
      r:  Math.random() * 1.4 + 0.4,
      a:  Math.random() * 0.35 + 0.08,
    }));

    const COLS = 18, ROWS = 11;
    let gpts = [];

    function buildGrid() {
      gpts = [];
      for (let r = 0; r <= ROWS; r++)
        for (let c = 0; c <= COLS; c++)
          gpts.push({ x: c/COLS*W, y: r/ROWS*H, ox: c/COLS, oy: r/ROWS, ph: Math.random()*Math.PI*2 });
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildGrid();
    }
    window.addEventListener('resize', resize);
    resize();
    document.addEventListener('mousemove', e => {
      nmx = e.clientX / window.innerWidth;
      nmy = e.clientY / window.innerHeight;
    });

    function getPt(r, c) {
      const p = gpts[r * (COLS + 1) + c];
      const w = Math.sin(time + p.ph) * 0.011;
      return {
        x: p.x + (nmx - p.ox) * 0.013 * W + w * W,
        y: p.y + (nmy - p.oy) * 0.013 * H + w * H,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      time += 0.007;

      ctx.strokeStyle = 'rgba(255,255,255,0.022)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= ROWS; r += 2) {
        ctx.beginPath();
        for (let c = 0; c <= COLS; c++) {
          const p = getPt(r, c);
          c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (let c = 0; c <= COLS; c += 2) {
        ctx.beginPath();
        for (let r = 0; r <= ROWS; r++) {
          const p = getPt(r, c);
          r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W;
          const dy = (nodes[i].y - nodes[j].y) * H;
          const d  = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d/120) * 0.06})`;
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(255,255,255,${nodes[i].a * 0.45})`;
        ctx.beginPath();
        ctx.arc(nodes[i].x * W, nodes[i].y * H, nodes[i].r, 0, Math.PI * 2);
        ctx.fill();
      }

      const sw = ((time * 0.035) % 1.4 - 0.2) * W;
      const sg = ctx.createLinearGradient(sw - 70, 0, sw + 70, 0);
      sg.addColorStop(0,   'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.015)');
      sg.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sw - 70, 0, 140, H);

      requestAnimationFrame(draw);
    }
    draw();
  })();

  /* ── 5. SCROLL REVEAL ─────────────────────────────────────── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

});
