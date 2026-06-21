// ── Cloudinary Config ─────────────────────────────────────────────────────────
const CLOUD_NAME = 'dswahfm99';

// ── Default placeholder data (shown before admin images load) ─────────────────
const defaultCollections = [
  { title: 'Dresses',      sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
  { title: 'Sets', sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { title: 'Tops',         sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1551163943-3f7caeafde04?w=600&q=80' },
  { title: 'Accessories',  sub: 'View Pieces', img: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2b91?w=600&q=80' },
];

const defaultLookbook = [
  { title: 'The Morning Look',  price: '₦42,000', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80' },
  { title: 'Soft Linen Set',    price: '₦58,000', img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&q=80' },
  { title: 'Ivory Maxi Dress',  price: '₦65,000', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
  { title: 'The Classic Edit',  price: '₦38,000', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80' },
  { title: 'Structured Blazer', price: '₦72,000', img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&q=80' },
  { title: 'Summer Wrap',       price: '₦34,000', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80' },
];

// ── Fetch approved images from Cloudinary (via localStorage metadata) ──────────
// Strategy: Cloudinary holds the actual images. localStorage holds the metadata
// (title, price, section, status). We read metadata, filter approved ones,
// and use their Cloudinary URLs — which work on ANY device/browser.
function getApprovedImages(section) {
  try {
    const all = JSON.parse(localStorage.getItem('pmg_wears_images') || '[]');
    return all.filter(img => img.status === 'approved' && img.section === section);
  } catch { return []; }
}

// ── BUT: if localStorage is empty (different device), fetch from Cloudinary ────
async function fetchCloudinaryImages(section) {
  try {
    // Use Cloudinary's resource listing via the client-side search API
    // We tag images by section when uploading, then fetch by tag
    const res = await fetch(
      `https://res.cloudinary.com/${CLOUD_NAME}/image/list/pmg_wears_${section}.json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.resources || []).map(r => ({
      src: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${r.public_id}.${r.format}`,
      title: r.context?.custom?.title || r.public_id.split('/').pop(),
      price: r.context?.custom?.price || '',
    }));
  } catch { return []; }
}

// ── Render Collections ────────────────────────────────────────────────────────
async function renderCollections() {
  const grid = document.getElementById('collectionsGrid');
  if (!grid) return;

  // Start with defaults immediately
  buildCollectionCards(grid, defaultCollections);

  // Layer in admin images from localStorage (same device) or Cloudinary (any device)
  let adminImages = getApprovedImages('collections');
  if (!adminImages.length) {
    adminImages = await fetchCloudinaryImages('collections');
  }

  if (adminImages.length) {
    const extra = adminImages.map(img => ({
      title: img.title,
      sub: img.price || 'View Pieces',
      img: img.src
    }));
    buildCollectionCards(grid, [...defaultCollections, ...extra]);
  }

  observeNew();
}

function buildCollectionCards(grid, items) {
  grid.innerHTML = '';
  items.forEach((item, i) => {
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

// ── Render Lookbook ───────────────────────────────────────────────────────────
async function renderLookbook() {
  const grid = document.getElementById('lookbookGrid');
  if (!grid) return;

  // Start with defaults immediately
  buildLookbookItems(grid, defaultLookbook);

  // Layer in admin images
  let adminImages = getApprovedImages('lookbook');
  if (!adminImages.length) {
    adminImages = await fetchCloudinaryImages('lookbook');
  }

  if (adminImages.length) {
    const extra = adminImages.map(img => ({
      title: img.title,
      price: img.price || '',
      img: img.src
    }));
    buildLookbookItems(grid, [...defaultLookbook, ...extra]);
  }

  observeNew();
}

function buildLookbookItems(grid, items) {
  grid.innerHTML = '';
  items.forEach((item, i) => {
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

// ── Listen for admin approvals (same browser, cross-tab) ──────────────────────
window.addEventListener('storage', (e) => {
  if (e.key === 'pmg_wears_images') {
    renderCollections();
    renderLookbook();
  }
});

// ── Polling fallback (catches same-tab updates) ───────────────────────────────
let lastSnapshot = localStorage.getItem('pmg_wears_images') || '';
setInterval(() => {
  const current = localStorage.getItem('pmg_wears_images') || '';
  if (current !== lastSnapshot) {
    lastSnapshot = current;
    renderCollections();
    renderLookbook();
  }
}, 3000);

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function observeNew() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
    el.classList.add('observed');
    observer.observe(el);
  });
}

// ── Navbar scroll ─────────────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── Reveal static section headers ─────────────────────────────────────────────
function addRevealClasses() {
  document.querySelectorAll('.section-header, .story-inner, .order-inner').forEach(el => {
    el.classList.add('reveal');
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  addRevealClasses();
  renderCollections();
  renderLookbook();
  requestAnimationFrame(() => setTimeout(observeNew, 100));
  initNavbar();
});
   
