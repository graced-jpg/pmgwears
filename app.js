// ── Data ──────────────────────────────────────────────────────────────────────

const defaultCollections = [
  { title: 'Dresses', sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
  { title: 'Co-ords & Sets', sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { title: 'Tops', sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1551163943-3f7caeafde04?w=600&q=80' },
  { title: 'Accessories', sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2b91?w=600&q=80' },
];

const defaultLookbook = [
  { title: 'The Morning Look', price: '₦42,000', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80' },
  { title: 'Soft Linen Set', price: '₦58,000', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&q=80' },
  { title: 'Ivory Maxi Dress', price: '₦65,000', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
  { title: 'The Classic Edit', price: '₦38,000', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80' },
  { title: 'Structured Blazer', price: '₦72,000', img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80' },
  { title: 'Summer Wrap', price: '₦34,000', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80' },
];

// ── Collections ────────────────────────────────────────────────────────────────
function renderCollections() {
  const grid = document.getElementById('collectionsGrid');
  if (!grid) return;

  // Merge admin-approved collection images
  const adminImages = getApprovedImages('collections');
  const all = [...defaultCollections, ...adminImages.map(img => ({
    title: img.title,
    sub: img.price || 'View Pieces',
    img: img.src
  }))];

  grid.innerHTML = '';
  all.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'collection-card reveal';
    card.style.transitionDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <img src="${item.img}" alt="${item.title}" loading="lazy"/>
      <div class="collection-overlay">
        <h3>${item.title}</h3>
        <span>${item.sub}</span>
      </div>`;
    grid.appendChild(card);
  });
}

// ── Lookbook ───────────────────────────────────────────────────────────────────
function renderLookbook() {
  const grid = document.getElementById('lookbookGrid');
  if (!grid) return;

  // Merge admin-approved lookbook images
  const adminImages = getApprovedImages('lookbook');
  const all = [...defaultLookbook, ...adminImages.map(img => ({
    title: img.title,
    price: img.price || '',
    img: img.src
  }))];

  grid.innerHTML = '';
  all.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'masonry-item reveal';
    div.style.transitionDelay = `${i * 0.06}s`;
    div.innerHTML = `
      <img src="${item.img}" alt="${item.title}" loading="lazy"/>
      <div class="masonry-caption">
        <h4>${item.title}</h4>
        ${item.price ? `<p>${item.price}</p>` : ''}
      </div>`;
    grid.appendChild(div);
  });
}

// ── Admin image bridge (src = Cloudinary URL, works on any device) ─────────────
function getApprovedImages(section) {
  try {
    const all = JSON.parse(localStorage.getItem('maeve_images') || '[]');
    return all.filter(img => img.status === 'approved' && img.section === section);
  } catch { return []; }
}

// ── Scroll effects ─────────────────────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Re-observe after content is injected
function observeNew() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
    el.classList.add('observed');
    observer.observe(el);
  });
}

// ── Navbar scroll ──────────────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Reveal section headers ─────────────────────────────────────────────────────
function addRevealClasses() {
  document.querySelectorAll('.section-header, .story-inner, .order-inner').forEach(el => {
    el.classList.add('reveal');
  });
}

// ── Refresh both grids ─────────────────────────────────────────────────────────
function refreshSite() {
  renderCollections();
  renderLookbook();
  requestAnimationFrame(() => setTimeout(observeNew, 100));
}

// ── Listen for admin changes (works across tabs in same browser) ───────────────
window.addEventListener('storage', (e) => {
  if (e.key === 'maeve_images') refreshSite();
});

// ── Polling fallback (catches same-tab updates every 3s) ──────────────────────
let lastSnapshot = localStorage.getItem('maeve_images') || '';
setInterval(() => {
  const current = localStorage.getItem('maeve_images') || '';
  if (current !== lastSnapshot) {
    lastSnapshot = current;
    refreshSite();
  }
}, 3000);

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCollections();
  renderLookbook();
  addRevealClasses();

  requestAnimationFrame(() => setTimeout(observeNew, 100));
  initNavbar();
});

