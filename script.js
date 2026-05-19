/* ─────────────────────────────────────────────
   PHOTO DATABASE (IndexedDB)
────────────────────────────────────────────── */
class PhotoDB {
  constructor() {
    this.name = 'AyushPatraPhotography';
    this.store = 'photos';
    this.db = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.store)) {
          const s = db.createObjectStore(this.store, { keyPath: 'id' });
          s.createIndex('uploadedAt', 'uploadedAt');
        }
      };
      req.onsuccess = e => { this.db = e.target.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  }

  add(photo) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.store, 'readwrite');
      const req = tx.objectStore(this.store).add(photo);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.store, 'readonly');
      const req = tx.objectStore(this.store).index('uploadedAt').getAll();
      req.onsuccess = () => resolve(req.result.reverse());
      req.onerror = () => reject(req.error);
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.store, 'readwrite');
      const req = tx.objectStore(this.store).delete(id);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  }
}

/* ─────────────────────────────────────────────
   GRAIN ANIMATION
────────────────────────────────────────────── */
function initGrain() {
  const canvas = document.getElementById('grain');
  const ctx = canvas.getContext('2d');
  let frame = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw() {
    frame++;
    if (frame % 2 !== 0) { requestAnimationFrame(draw); return; }

    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ─────────────────────────────────────────────
   CUSTOM CURSOR
────────────────────────────────────────────── */
function initCursor() {
  const ring = document.getElementById('cursorRing');
  const dot = document.getElementById('cursorDot');
  let rx = 0, ry = 0, mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
    requestAnimationFrame(tick);
  }
  tick();

  const hoverEls = () => document.querySelectorAll(
    'a, button, .gallery-item, .btn-upload, .btn-empty-upload, .nav-instagram'
  );

  function attachHovers() {
    hoverEls().forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hovering'));
    });
  }

  attachHovers();
  return attachHovers;
}

/* ─────────────────────────────────────────────
   HEADER SCROLL BEHAVIOR
────────────────────────────────────────────── */
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   GSAP LOADING SEQUENCE
────────────────────────────────────────────── */
function runLoadingSequence(onComplete) {
  const loader = document.getElementById('loader');
  const w1 = document.getElementById('loaderWord1');
  const w2 = document.getElementById('loaderWord2');
  const fill = document.getElementById('loaderBarFill');

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          onComplete();
        }
      });
    }
  });

  tl.to(fill, { width: '100%', duration: 1.2, ease: 'power3.inOut' }, 0)
    .to([w1, w2], {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out'
    }, 0.1)
    .to(fill, { opacity: 0, duration: 0.3 }, '>')
    .to([w2, w1], {
      opacity: 0,
      y: -50,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.in'
    }, '>0.2');
}

/* ─────────────────────────────────────────────
   HERO ANIMATION
────────────────────────────────────────────── */
function animateHero() {
  const tl = gsap.timeline();

  tl.to(['#heroLine1', '#heroLine2'], {
    y: 0,
    opacity: 1,
    stagger: 0.1,
    duration: 1,
    ease: 'power4.out'
  })
    .to('#heroSub', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
    .to('#heroDivider', { width: 80, opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.4')
    .to('#heroTagline', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .to('#scrollIndicator', { opacity: 1, duration: 0.5 }, '-=0.2')
    .to('.header-logo, .header-nav', { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' }, '-=0.8');
}

/* ─────────────────────────────────────────────
   GALLERY
────────────────────────────────────────────── */
const db = new PhotoDB();
let photos = [];
let lightboxIndex = 0;
let refreshCursorHovers = () => {};

function updateCount() {
  const el = document.getElementById('galleryCount');
  const n = photos.length;
  el.textContent = `${n} ${n === 1 ? 'photograph' : 'photographs'}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function buildMetaItems(photo) {
  const items = [];
  if (photo.location) items.push({ prefix: 'At', text: photo.location });
  if (photo.date) items.push({ prefix: 'On', text: formatDate(photo.date) });
  if (photo.device) items.push({ prefix: 'Via', text: photo.device });
  return items;
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');

  // Remove existing items (keep empty state node)
  grid.querySelectorAll('.gallery-item').forEach(el => el.remove());

  if (photos.length === 0) {
    empty.style.display = 'flex';
    updateCount();
    return;
  }

  empty.style.display = 'none';
  updateCount();

  photos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.index = i;

    const url = URL.createObjectURL(photo.blob);
    const metaItems = buildMetaItems(photo);

    item.innerHTML = `
      <img class="gallery-item-img" src="${url}" alt="${photo.caption || ''}" loading="lazy" />
      <div class="gallery-item-caption">
        ${photo.caption ? `<p class="caption-text">${photo.caption}</p>` : ''}
        <div class="caption-meta">
          ${metaItems.map(m =>
            `<span class="caption-meta-item" data-prefix="${m.prefix}">${m.text}</span>`
          ).join('')}
        </div>
      </div>`;

    // Tilt effect
    item.addEventListener('mousemove', e => {
      const r = item.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      item.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale(1.02)`;
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
    item.addEventListener('click', () => openLightbox(i));

    grid.appendChild(item);
  });

  // Scroll-triggered reveal
  if (window.ScrollTrigger) {
    gsap.utils.toArray('.gallery-item').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: (i % 3) * 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      });
    });
  } else {
    document.querySelectorAll('.gallery-item').forEach(el => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  refreshCursorHovers();
}

async function loadPhotos() {
  photos = await db.getAll();
  renderGallery();
}

/* ─────────────────────────────────────────────
   LIGHTBOX
────────────────────────────────────────────── */
function openLightbox(index) {
  lightboxIndex = index;
  showLightboxPhoto();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function showLightboxPhoto() {
  const photo = photos[lightboxIndex];
  if (!photo) return;

  const img = document.getElementById('lightboxImg');
  img.style.transform = 'scale(0.94)';
  img.src = URL.createObjectURL(photo.blob);
  img.alt = photo.caption || '';
  setTimeout(() => { img.style.transform = 'scale(1)'; }, 20);

  document.getElementById('lightboxCaption').textContent = photo.caption || '';

  const info = document.getElementById('lightboxInfo');
  const metaItems = buildMetaItems(photo);
  info.innerHTML = metaItems.map(m =>
    `<span class="lightbox-info-item"><span>${m.prefix}</span>${m.text}</span>`
  ).join('');

  const counter = document.getElementById('lightboxCounter');
  counter.textContent = `${lightboxIndex + 1} / ${photos.length}`;

  document.getElementById('lightboxPrev').disabled = lightboxIndex === 0;
  document.getElementById('lightboxNext').disabled = lightboxIndex === photos.length - 1;
}

function initLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    if (lightboxIndex > 0) { lightboxIndex--; showLightboxPhoto(); }
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    if (lightboxIndex < photos.length - 1) { lightboxIndex++; showLightboxPhoto(); }
  });

  document.getElementById('lightboxDelete').addEventListener('click', async () => {
    if (!confirm('Delete this photograph?')) return;
    const id = photos[lightboxIndex].id;
    await db.delete(id);
    photos.splice(lightboxIndex, 1);
    if (photos.length === 0) { closeLightbox(); renderGallery(); return; }
    lightboxIndex = Math.min(lightboxIndex, photos.length - 1);
    showLightboxPhoto();
    renderGallery();
  });

  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox') ||
        e.target === document.getElementById('lightboxImg').parentElement) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && lightboxIndex > 0) { lightboxIndex--; showLightboxPhoto(); }
    if (e.key === 'ArrowRight' && lightboxIndex < photos.length - 1) { lightboxIndex++; showLightboxPhoto(); }
  });
}

/* ─────────────────────────────────────────────
   UPLOAD MODAL
────────────────────────────────────────────── */
let selectedFiles = [];

function openUploadModal() {
  selectedFiles = [];
  document.getElementById('dropPreview').innerHTML = '';
  document.getElementById('dropZoneInner').style.display = 'flex';
  document.getElementById('fieldCaption').value = '';
  document.getElementById('fieldLocation').value = '';
  document.getElementById('fieldDate').value = '';
  document.getElementById('fieldDevice').value = '';
  document.getElementById('uploadModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('open');
  document.body.style.overflow = '';
}

function previewFiles(files) {
  selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  const preview = document.getElementById('dropPreview');
  const inner = document.getElementById('dropZoneInner');
  preview.innerHTML = '';

  if (selectedFiles.length > 0) {
    inner.style.display = 'none';
    selectedFiles.forEach(file => {
      const img = document.createElement('img');
      img.className = 'preview-thumb';
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      preview.appendChild(img);
    });
  } else {
    inner.style.display = 'flex';
  }
}

function initUploadModal() {
  const modal = document.getElementById('uploadModal');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  document.getElementById('btnOpenUpload').addEventListener('click', openUploadModal);
  document.getElementById('btnEmptyUpload').addEventListener('click', openUploadModal);
  document.getElementById('modalClose').addEventListener('click', closeUploadModal);
  document.getElementById('dropBrowse').addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', e => {
    if (e.target === dropZone || e.target.closest('.drop-zone-inner')) fileInput.click();
  });

  fileInput.addEventListener('change', e => previewFiles(e.target.files));

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    previewFiles(e.dataTransfer.files);
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) closeUploadModal();
  });

  document.getElementById('btnSubmit').addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
      document.getElementById('dropZone').style.borderColor = '#c55';
      setTimeout(() => document.getElementById('dropZone').style.borderColor = '', 1200);
      return;
    }

    const btn = document.getElementById('btnSubmit');
    const text = document.getElementById('submitText');
    const spinner = document.getElementById('submitSpinner');
    btn.disabled = true;
    text.style.display = 'none';
    spinner.hidden = false;

    const caption = document.getElementById('fieldCaption').value.trim();
    const location = document.getElementById('fieldLocation').value.trim();
    const date = document.getElementById('fieldDate').value;
    const device = document.getElementById('fieldDevice').value.trim();

    for (const file of selectedFiles) {
      const photo = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        blob: file,
        caption,
        location,
        date,
        device,
        uploadedAt: Date.now()
      };
      await db.add(photo);
      photos.unshift(photo);
    }

    btn.disabled = false;
    text.style.display = '';
    spinner.hidden = true;
    closeUploadModal();
    renderGallery();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeUploadModal();
  });
}

/* ─────────────────────────────────────────────
   INIT
────────────────────────────────────────────── */
async function main() {
  gsap.registerPlugin(ScrollTrigger);

  initGrain();
  refreshCursorHovers = initCursor();
  initHeader();
  initUploadModal();
  initLightbox();

  await db.open();

  runLoadingSequence(async () => {
    animateHero();
    await loadPhotos();
  });
}

main();
