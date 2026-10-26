var PHOTO = (typeof window !== 'undefined' && window.PHOTO) ? window.PHOTO : {};
const products = {
  tape: [
    { name: 'Tape Ball Bat - Power Hitter', price: 3500, old: 4200, img: PHOTO.batWall, tag: '-17%' },
    { name: 'Kashmir Willow Tape Bat', price: 4500, img: PHOTO.batMrf, tag: 'Hot' },
    { name: 'Tape Ball Bat - Pro Light', price: 2800, img: PHOTO.batBall },
    { name: 'Tamboo Tape Ball Bat', price: 3200, old: 3800, img: PHOTO.batHit, tag: '-16%' },
    { name: 'Tape Ball Bat - Striker', price: 2500, img: PHOTO.batHelmet, tag: 'New' },
    { name: 'Wooden Tape Bat Classic', price: 1800, img: PHOTO.batHands },
    { name: 'Tape Ball Bat - Junior', price: 1500, img: PHOTO.batPlayer },
    { name: 'Tape Ball Combo (Bat + 6 Balls)', price: 4200, old: 5000, img: PHOTO.tennis2, tag: '-16%' },
  ],
  hardball: [
    { name: 'English Willow Grade 1 Bat', price: 38000, old: 45000, img: PHOTO.batMrf, tag: '-15%' },
    { name: 'English Willow Grade 2 Bat', price: 26000, img: PHOTO.batWall, tag: 'Hot' },
    { name: 'Kashmir Willow Hardball Bat', price: 9500, img: PHOTO.batHit },
    { name: 'Players Edition Hardball Bat', price: 32000, old: 36000, img: PHOTO.batPlayer, tag: '-11%' },
    { name: 'Pro Hardball Bat - Big Edge', price: 28500, img: PHOTO.batBall, tag: 'New' },
    { name: 'Junior Hardball Bat (Size 5)', price: 7500, img: PHOTO.batHands },
    { name: 'Hardball Bat - Short Handle', price: 18000, img: PHOTO.batHelmet },
    { name: 'Club Hardball Bat', price: 12500, old: 14500, img: PHOTO.kitPads, tag: '-14%' },
  ],
  balls: [
    { name: 'Red Leather Hardball', price: 2200, img: PHOTO.ballRed, tag: 'Hot' },
    { name: 'Match Hardball (Pack of 2)', price: 4000, old: 4600, img: PHOTO.ballGrass, tag: '-13%' },
    { name: 'Tape Ball Ready (6 Pack)', price: 1500, img: PHOTO.tennis1, tag: 'New' },
    { name: 'Heavy Tennis Ball (6 Pack)', price: 1200, img: PHOTO.tennis3 },
    { name: 'Practice Hardball', price: 1500, img: PHOTO.ballGrass2 },
    { name: 'Light Tennis Ball (12 Pack)', price: 1800, old: 2100, img: PHOTO.tennis4, tag: '-14%' },
    { name: 'Tape Ball (Taped, Single)', price: 300, img: PHOTO.tennis2 },
    { name: 'Club Leather Ball', price: 1800, img: PHOTO.ballRed },
  ],
  shirts: [
    { name: 'Cricket Team Jersey - Black', price: 1800, old: 2200, img: PHOTO.teeBlack, tag: '-18%' },
    { name: 'Dri-Fit Training Shirt', price: 1500, img: PHOTO.teeBlack2, tag: 'New' },
    { name: 'Classic White Cricket Shirt', price: 2200, img: PHOTO.teeWhite },
    { name: 'Team Shirt Pack (3 Colours)', price: 4500, old: 5400, img: PHOTO.teeFolded, tag: '-17%' },
    { name: 'Practice T-Shirt', price: 1200, img: PHOTO.teeMan },
    { name: 'Printed Fan Shirt', price: 1400, img: PHOTO.teePrint, tag: 'Hot' },
    { name: 'Half Sleeve Cricket Polo', price: 1900, img: PHOTO.teeWhite },
    { name: 'Long Sleeve Cricket Shirt', price: 2400, img: PHOTO.teeBlack },
  ],
  trousers: [
    { name: 'Track Trouser - Side Stripe', price: 2200, old: 2600, img: PHOTO.pantStripe, tag: '-15%' },
    { name: 'Red Sports Trouser', price: 2000, img: PHOTO.pantRed, tag: 'New' },
    { name: 'Training Track Trouser', price: 1900, img: PHOTO.pantTrack },
    { name: 'White Cricket Trouser', price: 2500, img: PHOTO.pantChino, tag: 'Hot' },
    { name: 'Black Sports Trouser', price: 1800, img: PHOTO.pantBlack },
    { name: 'Jogger Trouser', price: 1700, old: 2000, img: PHOTO.pantJogger, tag: '-15%' },
    { name: 'Slim Fit Trouser', price: 2100, img: PHOTO.pantDark },
    { name: 'Full Tracksuit Set', price: 4800, img: PHOTO.tracksuit },
  ],
  kits: [
    { name: 'Complete Hardball Kit (Adult)', price: 28000, old: 33000, img: PHOTO.kitFull, tag: '-15%' },
    { name: 'Batting Helmet Pro', price: 6500, img: PHOTO.kitHelmet, tag: 'Hot' },
    { name: 'Batting Helmet - Steel Grill', price: 5200, img: PHOTO.kitHelmet2 },
    { name: 'Batting Gloves Pair', price: 3500, img: PHOTO.kitGloves, tag: 'New' },
    { name: 'Batting Pads (Legguards)', price: 5500, img: PHOTO.kitPads },
    { name: 'Junior Hardball Kit', price: 18000, old: 21000, img: PHOTO.kitIndoor, tag: '-14%' },
    { name: 'Thigh Guard & Abdo Set', price: 2200, img: PHOTO.kitSide },
    { name: 'Cricket Kit Bag', price: 4500, img: PHOTO.kitTeam },
  ],
};

// Where each home tab's "View All" goes in the shop
const shopPath = {
  tape: 'cricket/bats/tape-ball-bats',
  hardball: 'cricket/bats/hardball-bats',
  balls: 'cricket/balls',
  shirts: 'cricket/clothing/shirts',
  trousers: 'cricket/clothing/trousers',
  kits: 'cricket/hardball-kits',
};

// Assign slug and id to home page products
Object.values(products).forEach(list => {
  list.forEach(item => {
    item.slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    item.id = item.id || `home_${item.slug}`;
  });
});

const featured = [products.tape[0], products.hardball[0], products.kits[0], products.shirts[0]];
// The lists above are demo data for offline/dummy mode only; with the live database they must never show
const LIVE = typeof isLiveSupabase === 'function' && isLiveSupabase();

// Category tabs
const grid = document.getElementById('productGrid');
const viewAll = document.getElementById('viewAll');
const renderCat = cat => {
  if (products[cat]) {
    grid.innerHTML = products[cat].map(productCard).join('');
    grid.classList.remove('fade'); void grid.offsetWidth; grid.classList.add('fade');
    viewAll.href = `shop.html#/${shopPath[cat] || ''}`;
  }
};
if (!LIVE) renderCat('tape');

const featGrid = document.getElementById('featuredGrid');
if (featGrid) {
  const featSection = featGrid.closest('section');
  if (!LIVE) featGrid.innerHTML = featured.map(productCard).join('');
  if (typeof api !== 'undefined' && api.getHomeContent) {
    api.getHomeContent().then(res => {
      const list = (res && res.featuredProducts) || [];
      if (list.length) featGrid.innerHTML = list.slice(0, 4).map(productCard).join('');
      else if (LIVE && featSection) featSection.hidden = true; // nothing marked featured: hide the section
      if (res && res.blocks) {
        const offerBlock = res.blocks.find(b => b.section === 'offer');
        if (offerBlock && offerBlock.data && offerBlock.is_active) {
          const offerContent = document.querySelector('.offer__content');
          if (offerContent && offerBlock.data.title) {
            const h2 = offerContent.querySelector('h2');
            if (h2) h2.innerHTML = esc(offerBlock.data.title);
            if (offerBlock.data.coupon) {
              const sub = offerContent.querySelector('.subtitle');
              if (sub) sub.textContent = `Special Coupon: ${offerBlock.data.coupon}`;
            }
          }
        }
      }
    }).catch(() => {});
  }
}

// Category slider with arrows + dots
const track = document.getElementById('catTrack');
const prev = document.getElementById('catPrev');
const next = document.getElementById('catNext');
const dotsWrap = document.getElementById('catDots');
let slideCards = track ? [...track.children] : [];
const step = () => (slideCards.length && slideCards[0]) ? (slideCards[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0)) : 280;
const perView = () => Math.max(1, Math.round((track?.clientWidth || 300) / step()));
const pageCount = () => Math.max(1, slideCards.length - perView() + 1);

const buildDots = () => {
  slideCards = track ? [...track.children] : [];
  if (!dotsWrap || !slideCards.length) return;
  dotsWrap.innerHTML = Array.from({ length: pageCount() }, (_, i) => `<button aria-label="Go to slide ${i + 1}"></button>`).join('');
  dotsWrap.querySelectorAll('button').forEach((d, i) => d.addEventListener('click', () => track.scrollTo({ left: i * step(), behavior: 'smooth' })));
  updateSlider();
};
const updateSlider = () => {
  if (!track || !prev || !next) return;
  const i = Math.round(track.scrollLeft / step());
  prev.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  if (dotsWrap) {
    dotsWrap.querySelectorAll('button').forEach((d, n) => d.classList.toggle('active', n === i));
  }
};
if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
if (track) track.addEventListener('scroll', () => requestAnimationFrame(updateSlider));
addEventListener('resize', buildDots);
buildDots();

// Auto-slide every 4s, pauses while hovering, loops back to start
if (track && next) {
  setInterval(() => !track.matches(':hover') && (next.disabled ? track.scrollTo({ left: 0, behavior: 'smooth' }) : next.click()), 4000);
}

// Dynamic Category Slider from Live Supabase / Admin Content
const promoColors = ['orange', 'blue', 'dark', 'pink', 'green', 'yellow'];
async function initDynamicCategorySlider() {
  if (!track || typeof api === 'undefined' || !api.getTree) return;
  try {
    const [tree, homeRes] = await Promise.all([
      api.getTree().catch(() => []),
      api.getHomeContent ? api.getHomeContent().catch(() => null) : null
    ]);

    const customBlocks = (homeRes && homeRes.blocks)
      ? homeRes.blocks.filter(b => b.section === 'category_slider' && b.is_active && b.data)
      : [];

    let cardsHtml = '';

    if (customBlocks.length > 0) {
      cardsHtml = customBlocks.map((b, idx) => {
        const d = b.data;
        const color = d.bg_color || promoColors[idx % promoColors.length];
        return `
          <div class="promo__card promo__card--${color}">
            <div class="promo__text">
              <span class="subtitle">${esc(d.subtitle || 'Featured')}</span>
              <h3>${esc(d.title || '')}</h3>
              <a href="${esc(d.link || 'shop.html')}" class="btn btn--${color === 'dark' ? 'primary' : 'dark'} btn--sm">
                Shop Now <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
            <img src="${img(d.image_url)}" alt="${esc(d.title || '')}" loading="lazy">
          </div>
        `;
      }).join('');
    } else if (tree && tree.length > 0) {
      const list = [];
      tree.forEach(root => {
        list.push(root);
        if (root.children && root.children.length > 0) {
          root.children.forEach(sub => list.push(sub));
        }
      });

      cardsHtml = list.map((c, idx) => {
        const color = promoColors[idx % promoColors.length];
        const isDark = color === 'dark';
        const count = c.products ? c.products.length : (typeof c.productCount === 'number' ? c.productCount : (c.children ? countProducts(c) : 0));
        const sub = c.children && c.children.length > 0
          ? `${c.children.length} Sub-Collections`
          : `${count} Products`;
        const href = `shop.html#/${c.path || c.slug}`;

        return `
          <div class="promo__card promo__card--${color}">
            <div class="promo__text">
              <span class="subtitle">${esc(sub)}</span>
              <h3>${esc(c.name)}</h3>
              <a href="${href}" class="btn btn--${isDark ? 'primary' : 'dark'} btn--sm">
                Shop Now <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
            <img src="${img(c.img || c.image_url)}" alt="${esc(c.name)}" loading="lazy">
          </div>
        `;
      }).join('');
    }

    if (cardsHtml) {
      track.innerHTML = cardsHtml;
      buildDots();
    }
  } catch (err) {
    console.warn('Failed to load dynamic category slider:', err);
  }
}
initDynamicCategorySlider();

// Dynamic Category Tabs from Live Supabase Collections
const catsEl = document.getElementById('cats');
async function initDynamicCategoryTabs() {
  if (!catsEl || typeof api === 'undefined' || !api.getTree) return;
  try {
    const tree = await api.getTree();
    if (!tree || tree.length === 0) return;

    const candidates = [];
    tree.forEach(r => {
      candidates.push(r);
      if (r.children && r.children.length) {
        r.children.forEach(ch => candidates.push(ch));
      }
    });

    if (candidates.length === 0) return;

    const getCatIcon = name => {
      const n = name.toLowerCase();
      if (n.includes('shoe') || n.includes('footwear')) return '<i class="fa-solid fa-shoe-prints"></i>';
      if (n.includes('bat')) return '<i class="fa-solid fa-baseball-bat-ball"></i>';
      if (n.includes('ball')) return '<i class="fa-solid fa-baseball"></i>';
      if (n.includes('shirt') || n.includes('clothing') || n.includes('jersey')) return '<i class="fa-solid fa-shirt"></i>';
      if (n.includes('kit') || n.includes('helmet')) return '<i class="fa-solid fa-helmet-safety"></i>';
      return '<i class="fa-solid fa-layer-group"></i>';
    };

    catsEl.innerHTML = candidates.map((c, idx) => `
      <button class="cat ${idx === 0 ? 'active' : ''}" data-path="${esc(c.path || c.slug)}" data-id="${esc(c.id)}">
        <span>${getCatIcon(c.name)}</span>${esc(c.name)}
      </button>
    `).join('');

    async function loadCategoryTabProducts(c) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 48px; color: #94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 26px; margin-bottom: 8px; display: block;"></i>Loading ${esc(c.name)}...</div>`;
      viewAll.href = `shop.html#/${c.path || c.slug}`;

      const res = await api.getCollection((c.path || c.slug).split('/'));
      let prods = (res && res.node && res.node.products) ? res.node.products : [];

      // A parent collection holds no products itself: show products from everything inside it
      if (prods.length === 0 && c.children && c.children.length > 0) {
        const ids = [];
        (function collect(n) { (n.children || []).forEach(k => { ids.push(k.id); collect(k); }); })(c);
        if (typeof supabaseClient !== 'undefined' && supabaseClient && ids.length) {
          const { data: cProds } = await supabaseClient
            .from('products')
            .select('*, product_images(*), product_variants(*)')
            .in('collection_id', ids)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(8);
          if (cProds && cProds.length > 0) prods = cProds.map(normalizeProduct);
        } else {
          (function gather(n) { (n.products || []).forEach(x => prods.push(x)); (n.children || []).forEach(gather); })(res && res.node ? res.node : c);
        }
      }

      if (prods.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: #64748b;">
            <i class="fa-solid fa-box-open" style="font-size: 32px; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
            <p style="font-size: 15px; font-weight: 500;">No products in ${esc(c.name)} yet.</p>
            <a href="shop.html#/${c.path || c.slug}" class="btn btn--outline btn--sm" style="margin-top: 10px;">Explore Collection</a>
          </div>
        `;
      } else {
        grid.innerHTML = prods.slice(0, 8).map(productCard).join('');
      }
      grid.classList.remove('fade'); void grid.offsetWidth; grid.classList.add('fade');
    }

    catsEl.onclick = e => {
      const btn = e.target.closest('.cat');
      if (!btn || btn.classList.contains('active')) return;
      catsEl.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = candidates.find(c => (c.path || c.slug) === btn.dataset.path || String(c.id) === btn.dataset.id);
      if (target) loadCategoryTabProducts(target);
    };

    loadCategoryTabProducts(candidates[0]);

  } catch (err) {
    console.warn('Fallback to static category tabs:', err);
  }
}
initDynamicCategoryTabs();


// Hero slider
const slides = document.querySelectorAll('.hero__slide');
const dots = document.querySelectorAll('#heroDots button');
let current = 0, heroTimer;
const goTo = i => {
  slides[current].classList.remove('active'); dots[current].classList.remove('active');
  current = (i + slides.length) % slides.length;
  slides[current].classList.add('active'); dots[current].classList.add('active');
};
const autoplay = () => { clearInterval(heroTimer); heroTimer = setInterval(() => goTo(current + 1), 5000); };
dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); autoplay(); }));
autoplay();

// Countdown: demo deadline 6 days 14 hours after page load
const end = Date.now() + 1000 * 60 * 60 * (24 * 6 + 14);
const cd = document.getElementById('countdown');
const tick = () => {
  const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
  const vals = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  for (const k in vals) cd.querySelector(`[data-u="${k}"]`).textContent = String(vals[k]).padStart(2, '0');
};
tick(); setInterval(tick, 1000);

// Reveal on scroll
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.cat-slider, .cats, .section-head, .arrivals__left, .arrivals__right, .offer__content, .brand, .feature')
  .forEach(el => { el.classList.add('reveal'); io.observe(el); });

