/*
 * Dummy catalogue for the shop.
 *
 * Every collection is { slug, name, img, children: [...] } or, at the last level,
 * { slug, name, img, products: [...] }. Nesting can go as deep as needed.
 *
 * When the backend is ready, only the `api` object at the bottom needs to change:
 * keep the same function names and return the same shapes from fetch() calls.
 */
var PHOTO = window.PHOTO = {
  batWall: '1758791184255-411236a49346',
  batMrf: '1630851278830-c0c9b12933ee',
  batBall: '1593766788306-28561086694e',
  batHit: '1593341646647-75b32930e4a1',
  batHelmet: '1593766832792-804353f52dbf',
  batHands: '1644984785457-facabdba5b16',
  batPlayer: '1643593595725-80986444214e',
  batsman: '1593341646782-e0b495cff86d',
  ballRed: '1743342873510-55d49972b746',
  ballGrass: '1531415074968-036ba1b575da',
  ballGrass2: '1690111354184-cceee42df518',
  tennis1: '1768360647310-2612990f3572',
  tennis2: '1777713174772-73f9da4984ed',
  tennis3: '1519611103964-90f61a50d3e6',
  tennis4: '1614986387975-467d3735addb',
  teeBlack: '1583743814966-8936f5b7be1a',
  teeBlack2: '1618354691373-d851c5c3a990',
  teeWhite: '1586790170083-2f9ceadc732d',
  teeFolded: '1602810318383-e386cc2a3ccf',
  teeMan: '1503341504253-dff4815485f1',
  teePrint: '1576566588028-4147f3842f27',
  pantStripe: '1715532098035-a343b26eaeaa',
  pantRed: '1789110853644-4403e0f1e5fe',
  pantTrack: '1583077864994-9cf6e61f2223',
  pantChino: '1473966968600-fa801b869a1a',
  pantBlack: '1584865288642-42078afe6942',
  pantJogger: '1594633312681-425c7b97ccd1',
  pantDark: '1624378439575-d8705ad7ae80',
  tracksuit: '1760736534441-4d14bf11103e',
  kitHelmet: '1776229705264-6b437229654b',
  kitHelmet2: '1776229705528-9bcd14792045',
  kitIndoor: '1785906359814-d4c467499076',
  kitGloves: '1785906359585-9c053458d551',
  kitFull: '1785906359975-3b9e7fd8d230',
  kitPads: '1785906359458-a03460ad7073',
  kitTeam: '1785906359582-65821d0d469f',
  kitSide: '1785906358745-390f57fc7d15',
  shoeRed: '1542291026-7eec264c27ff',
  shoeSneaker: '1560769629-975ec94e6a86',
  shoeGrey: '1539185441755-769473a23570',
  shoePair: '1595341888016-a392ef81b7de',
  shoeRun: '1476480862126-209bfaa8edc8',
  shoeTie: '1549060279-7e168fcee0c2',
  bottle: '1602143407151-7111542de6e8',
  backpack: '1553062407-98eeb64c6a62',
  watch: '1523275335684-37898b6baf30',
};

// p(name, price, photo, oldPrice?, tag?)
const p = (name, price, img, old, tag) => ({ name, price, img, old, tag });

const CATALOG = [
  {
    slug: 'cricket', name: 'Cricket', img: PHOTO.batsman,
    children: [
      {
        slug: 'bats', name: 'Bats', img: PHOTO.batWall,
        children: [
          {
            slug: 'hardball-bats', name: 'Hardball Bats', img: PHOTO.batMrf,
            children: [
              {
                slug: 'english-willow', name: 'English Willow', img: PHOTO.batMrf,
                products: [
                  p('English Willow Grade 1 Bat', 38000, PHOTO.batMrf, 45000, '-15%'),
                  p('English Willow Grade 2 Bat', 26000, PHOTO.batWall, null, 'Hot'),
                  p('Players Edition Bat', 32000, PHOTO.batPlayer, 36000, '-11%'),
                  p('Pro Big Edge Bat', 28500, PHOTO.batBall, null, 'New'),
                  p('English Willow Short Handle', 22000, PHOTO.batHelmet),
                  p('English Willow Long Handle', 23500, PHOTO.batHit),
                ],
              },
              {
                slug: 'kashmir-willow', name: 'Kashmir Willow', img: PHOTO.batHit,
                products: [
                  p('Kashmir Willow Hardball Bat', 9500, PHOTO.batHit, null, 'Hot'),
                  p('Kashmir Willow Club Bat', 12500, PHOTO.batWall, 14500, '-14%'),
                  p('Kashmir Willow Practice Bat', 7800, PHOTO.batBall),
                  p('Kashmir Willow Power Bat', 11000, PHOTO.batHands),
                ],
              },
            ],
          },
          {
            slug: 'tape-ball-bats', name: 'Tape Ball Bats', img: PHOTO.batWall,
            children: [
              {
                slug: 'tamboo-bats', name: 'Tamboo Bats', img: PHOTO.batBall,
                products: [
                  p('Tamboo Tape Ball Bat', 3200, PHOTO.batBall, 3800, '-16%'),
                  p('Tamboo Bat - Power Hitter', 3500, PHOTO.batWall, null, 'Hot'),
                  p('Tamboo Bat - Light Weight', 2900, PHOTO.batHit),
                  p('Tamboo Bat - Pro', 4200, PHOTO.batMrf, null, 'New'),
                ],
              },
              {
                slug: 'wooden-tape-bats', name: 'Wooden Tape Bats', img: PHOTO.batHelmet,
                products: [
                  p('Wooden Tape Bat Classic', 1800, PHOTO.batHelmet),
                  p('Kashmir Willow Tape Bat', 4500, PHOTO.batMrf, null, 'Hot'),
                  p('Tape Ball Bat - Striker', 2500, PHOTO.batHands, 2900, '-14%'),
                ],
              },
              {
                slug: 'fiber-tape-bats', name: 'Fiber Tape Bats', img: PHOTO.batHands,
                products: [
                  p('Fiber Tape Bat - Light', 2200, PHOTO.batHands, null, 'New'),
                  p('Fiber Tape Bat - Pro', 2800, PHOTO.batPlayer),
                  p('Fiber Tape Bat - Junior', 1500, PHOTO.batBall),
                ],
              },
            ],
          },
          {
            slug: 'junior-bats', name: 'Junior Bats', img: PHOTO.batPlayer,
            products: [
              p('Junior Hardball Bat (Size 5)', 7500, PHOTO.batPlayer),
              p('Junior Hardball Bat (Size 3)', 6200, PHOTO.batHands, 6900, '-10%'),
              p('Junior Tape Ball Bat', 1500, PHOTO.batBall, null, 'New'),
              p('Kids Plastic Bat Set', 900, PHOTO.batWall),
            ],
          },
        ],
      },
      {
        slug: 'balls', name: 'Balls', img: PHOTO.ballRed,
        children: [
          {
            slug: 'hard-ball', name: 'Hard Ball', img: PHOTO.ballRed,
            products: [
              p('Red Leather Hardball', 2200, PHOTO.ballRed, null, 'Hot'),
              p('Match Hardball (Pack of 2)', 4000, PHOTO.ballGrass, 4600, '-13%'),
              p('Practice Hardball', 1500, PHOTO.ballGrass2),
              p('Club Leather Ball', 1800, PHOTO.ballRed),
              p('Test Match Ball', 3500, PHOTO.ballGrass, null, 'New'),
            ],
          },
          {
            slug: 'tape-ball', name: 'Tape Ball', img: PHOTO.tennis2,
            products: [
              p('Tape Ball Ready (6 Pack)', 1500, PHOTO.tennis1, null, 'New'),
              p('Tape Ball (Taped, Single)', 300, PHOTO.tennis2),
              p('Tape Ball Combo (12 Pack)', 2800, PHOTO.tennis3, 3200, '-13%'),
              p('Electrical Tape Roll (5 Pack)', 450, PHOTO.tennis4),
            ],
          },
          {
            slug: 'tennis-ball', name: 'Tennis Ball', img: PHOTO.tennis1,
            products: [
              p('Heavy Tennis Ball (6 Pack)', 1200, PHOTO.tennis3),
              p('Light Tennis Ball (12 Pack)', 1800, PHOTO.tennis4, 2100, '-14%'),
              p('Hard Tennis Ball Single', 220, PHOTO.tennis1, null, 'Hot'),
              p('Practice Tennis Ball Bucket', 3500, PHOTO.tennis2),
            ],
          },
        ],
      },
      {
        slug: 'hardball-kits', name: 'Hardball Kits', img: PHOTO.kitHelmet,
        children: [
          {
            slug: 'complete-kits', name: 'Complete Kits', img: PHOTO.kitFull,
            products: [
              p('Complete Hardball Kit (Adult)', 28000, PHOTO.kitFull, 33000, '-15%'),
              p('Junior Hardball Kit', 18000, PHOTO.kitIndoor, 21000, '-14%'),
              p('Club Hardball Kit', 22500, PHOTO.kitTeam, null, 'Hot'),
              p('Starter Hardball Kit', 14500, PHOTO.kitSide),
            ],
          },
          {
            slug: 'helmets', name: 'Helmets', img: PHOTO.kitHelmet2,
            products: [
              p('Batting Helmet Pro', 6500, PHOTO.kitHelmet, null, 'Hot'),
              p('Batting Helmet - Steel Grill', 5200, PHOTO.kitHelmet2),
              p('Junior Batting Helmet', 3800, PHOTO.kitSide, 4300, '-12%'),
            ],
          },
          {
            slug: 'gloves', name: 'Batting Gloves', img: PHOTO.kitGloves,
            products: [
              p('Batting Gloves Pair', 3500, PHOTO.kitGloves, null, 'New'),
              p('Pro Batting Gloves', 5500, PHOTO.kitPads),
              p('Wicket Keeping Gloves', 4200, PHOTO.kitIndoor),
            ],
          },
          {
            slug: 'pads-guards', name: 'Pads & Guards', img: PHOTO.kitPads,
            products: [
              p('Batting Pads (Legguards)', 5500, PHOTO.kitPads),
              p('Thigh Guard & Abdo Set', 2200, PHOTO.kitSide, null, 'Hot'),
              p('Arm Guard', 1500, PHOTO.kitGloves),
              p('Cricket Kit Bag', 4500, PHOTO.kitTeam, 5200, '-13%'),
            ],
          },
        ],
      },
      {
        slug: 'clothing', name: 'Cricket Clothing', img: PHOTO.teeWhite,
        children: [
          {
            slug: 'shirts', name: 'Shirts', img: PHOTO.teeBlack,
            products: [
              p('Cricket Team Jersey - Black', 1800, PHOTO.teeBlack, 2200, '-18%'),
              p('Dri-Fit Training Shirt', 1500, PHOTO.teeBlack2, null, 'New'),
              p('Classic White Cricket Shirt', 2200, PHOTO.teeWhite),
              p('Team Shirt Pack (3 Colours)', 4500, PHOTO.teeFolded, 5400, '-17%'),
              p('Practice T-Shirt', 1200, PHOTO.teeMan),
              p('Printed Fan Shirt', 1400, PHOTO.teePrint, null, 'Hot'),
            ],
          },
          {
            slug: 'trousers', name: 'Trousers', img: PHOTO.pantChino,
            products: [
              p('White Cricket Trouser', 2500, PHOTO.pantChino, null, 'Hot'),
              p('Track Trouser - Side Stripe', 2200, PHOTO.pantStripe, 2600, '-15%'),
              p('Training Track Trouser', 1900, PHOTO.pantTrack),
              p('Black Sports Trouser', 1800, PHOTO.pantBlack),
              p('Slim Fit Trouser', 2100, PHOTO.pantDark, null, 'New'),
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'footwear', name: 'Footwear', img: PHOTO.shoeRed,
    children: [
      {
        slug: 'running-shoes', name: 'Running Shoes', img: PHOTO.shoeRun,
        products: [
          p('Red Running Shoes', 11900, PHOTO.shoeRed, 14900, '-20%'),
          p('Road Runner Shoes', 9500, PHOTO.shoeRun),
          p('Light Trainer', 8200, PHOTO.shoeGrey, null, 'New'),
          p('Marathon Pro', 13500, PHOTO.shoeTie),
        ],
      },
      {
        slug: 'cricket-shoes', name: 'Cricket Shoes', img: PHOTO.shoeTie,
        products: [
          p('Cricket Spikes Shoes', 9800, PHOTO.shoeTie, null, 'Hot'),
          p('Rubber Studs Cricket Shoes', 7500, PHOTO.shoeGrey),
          p('All-Rounder Cricket Shoes', 8900, PHOTO.shoePair, 9900, '-10%'),
        ],
      },
      {
        slug: 'sneakers', name: 'Sneakers', img: PHOTO.shoeSneaker,
        products: [
          p('Street Sneakers', 9500, PHOTO.shoeSneaker),
          p('Classic White Sneakers', 7800, PHOTO.shoePair, null, 'New'),
          p('Grey Casual Sneakers', 6900, PHOTO.shoeGrey),
          p('Court Sneakers', 13500, PHOTO.shoeSneaker, 16000, '-15%'),
        ],
      },
    ],
  },
  {
    slug: 'sportswear', name: 'Sportswear', img: PHOTO.tracksuit,
    children: [
      {
        slug: 't-shirts', name: 'T-Shirts', img: PHOTO.teeMan,
        products: [
          p('Black Sports Tee', 1200, PHOTO.teeMan),
          p('White Training Tee', 1100, PHOTO.teeWhite, null, 'New'),
          p('Printed Gym Tee', 1300, PHOTO.teePrint, 1600, '-19%'),
        ],
      },
      {
        slug: 'track-trousers', name: 'Track Trousers', img: PHOTO.pantStripe,
        products: [
          p('Red Sports Trouser', 2000, PHOTO.pantRed, null, 'New'),
          p('Jogger Trouser', 1700, PHOTO.pantJogger, 2000, '-15%'),
          p('Track Trouser - Side Stripe', 2200, PHOTO.pantStripe),
        ],
      },
      {
        slug: 'tracksuits', name: 'Tracksuits', img: PHOTO.tracksuit,
        products: [
          p('Full Tracksuit Set', 4800, PHOTO.tracksuit, null, 'Hot'),
          p('Training Tracksuit', 4200, PHOTO.pantTrack),
        ],
      },
    ],
  },
  {
    slug: 'accessories', name: 'Accessories', img: PHOTO.backpack,
    children: [
      {
        slug: 'bags', name: 'Bags', img: PHOTO.backpack,
        products: [
          p('Training Backpack', 5900, PHOTO.backpack, null, 'New'),
          p('Cricket Kit Bag', 4500, PHOTO.kitTeam),
        ],
      },
      {
        slug: 'water-bottles', name: 'Water Bottles', img: PHOTO.bottle,
        products: [
          p('Steel Water Bottle', 1800, PHOTO.bottle, 2400, '-25%'),
          p('Insulated Sports Bottle', 2200, PHOTO.bottle),
        ],
      },
      {
        slug: 'watches', name: 'Fitness Watches', img: PHOTO.watch,
        products: [
          p('Smart Fitness Watch', 12900, PHOTO.watch, 15900, '-18%'),
        ],
      },
    ],
  },
];

// Total products inside a collection, counting every level below it.
var countProducts = node =>
  node.products ? node.products.length : (node.children || []).reduce((n, c) => n + countProducts(c), 0);

// Initialize all products with unique id, slug, images, description, stock, and variants
(function initCatalog() {
  const slugCounts = {};
  let nextId = 1;
  const photoKeys = Object.keys(PHOTO);

  function walk(nodes, trail) {
    for (const node of nodes) {
      const currentTrail = [...trail, node];
      if (node.products) {
        node.products.forEach((prod, idx) => {
          // Unique id
          prod.id = `prod_${nextId++}`;

          // URL-safe unique slug
          const baseSlug = prod.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          if (slugCounts[baseSlug]) {
            slugCounts[baseSlug]++;
            prod.slug = `${baseSlug}-${slugCounts[baseSlug]}`;
          } else {
            slugCounts[baseSlug] = 1;
            prod.slug = baseSlug;
          }

          // Images array (main + 2-3 relevant additional photos)
          if (!prod.images || !prod.images.length) {
            const extraPhotos = [];
            for (let i = 1; i <= 3; i++) {
              const k = photoKeys[(nextId * 3 + i * 2) % photoKeys.length];
              if (PHOTO[k] && PHOTO[k] !== prod.img && !extraPhotos.includes(PHOTO[k])) {
                extraPhotos.push(PHOTO[k]);
              }
            }
            prod.images = [prod.img, ...extraPhotos];
          }

          // Description (2-3 sentences)
          if (!prod.description) {
            prod.description = `The ${prod.name} delivers championship-grade performance, precision weight distribution, and rugged durability tailored for Pakistani conditions. Engineered to provide maximum sweet spot feel and unmatched comfort during high-intensity matches. Every unit undergoes rigorous quality inspection before dispatch.`;
          }

          // Stock count (some with low stock <= 3 for urgency testing)
          if (prod.stock === undefined) {
            if (nextId % 6 === 0) prod.stock = 2;
            else if (nextId % 9 === 0) prod.stock = 3;
            else prod.stock = 14;
          }

          // Variants based on collection path
          if (!prod.variants) {
            const slugs = currentTrail.map(c => c.slug);
            if (slugs.includes('bats')) {
              prod.variants = { label: 'Weight', options: ['1100g', '1150g', '1200g'] };
            } else if (slugs.includes('shirts') || slugs.includes('trousers') || slugs.includes('clothing') || slugs.includes('sportswear')) {
              prod.variants = { label: 'Size', options: ['S', 'M', 'L', 'XL'] };
            } else if (slugs.includes('footwear') || slugs.includes('running-shoes') || slugs.includes('cricket-shoes') || slugs.includes('sneakers')) {
              prod.variants = { label: 'Size', options: ['7', '8', '9', '10', '11'] };
            } else if (slugs.includes('helmets') || slugs.includes('gloves') || slugs.includes('pads-guards') || slugs.includes('hardball-kits')) {
              prod.variants = { label: 'Size', options: ['Youth', 'Standard Adult'] };
            } else if (slugs.includes('balls') || slugs.includes('tape-ball') || slugs.includes('hard-ball') || slugs.includes('tennis-ball')) {
              prod.variants = { label: 'Pack', options: ['Single', 'Pack of 3', 'Pack of 6'] };
            } else if (slugs.includes('accessories') || slugs.includes('bags') || slugs.includes('water-bottles') || slugs.includes('watches')) {
              prod.variants = { label: 'Edition', options: ['Standard', 'Pro Edition'] };
            }
          }
        });
      }
      if (node.children) {
        walk(node.children, currentTrail);
      }
    }
  }

  walk(CATALOG, []);
})();

const DUMMY_API = {
  // Whole collection tree (for the sidebar).
  async getTree() {
    return CATALOG;
  },

  // path: ['cricket', 'bats'] -> { node, trail } or null if not found.
  // node is null for the shop root; trail is every collection from the top down to node.
  async getCollection(path) {
    const trail = [];
    let list = CATALOG;
    for (const slug of path) {
      const node = list.find(c => c.slug === slug);
      if (!node) return null;
      trail.push(node);
      list = node.children || [];
    }
    return { node: trail[trail.length - 1] || null, trail };
  },

  // getProduct(slug) -> { product, trail } or null
  async getProduct(slug) {
    if (!slug) return null;
    const clean = String(slug).toLowerCase().trim();
    let result = null;
    let fallback = null;
    function search(nodeList, trail) {
      for (const node of nodeList) {
        const currentTrail = [...trail, node];
        if (node.products) {
          for (const p of node.products) {
            if (p.slug === clean) {
              result = { product: p, trail: currentTrail };
              return;
            }
            if (!fallback) {
              const pBase = p.slug.replace(/-\d+$/, '');
              const cleanBase = clean.replace(/-\d+$/, '');
              if (pBase === cleanBase || p.slug.includes(clean) || clean.includes(p.slug)) {
                fallback = { product: p, trail: currentTrail };
              }
            }
          }
        }
        if (node.children) {
          search(node.children, currentTrail);
          if (result) return;
        }
      }
    }
    search(CATALOG, []);
    return result || fallback;
  },

  // getProductById(id) -> { product, trail } or null
  async getProductById(id) {
    if (!id) return null;
    let result = null;
    function search(nodeList, trail) {
      for (const node of nodeList) {
        const currentTrail = [...trail, node];
        if (node.products) {
          const found = node.products.find(p => p.id === id || p.slug === id || (id.startsWith('home_') && p.slug === id.replace('home_', '')));
          if (found) {
            result = { product: found, trail: currentTrail };
            return;
          }
        }
        if (node.children) {
          search(node.children, currentTrail);
          if (result) return;
        }
      }
    }
    search(CATALOG, []);
    return result;
  },

  // getProductById(id) -> { product, trail }
  async getProductById(id) {
    if (!id) return null;
    const strId = String(id);
    let result = null;
    function walk(nodes, trail) {
      for (const node of nodes) {
        const nextTrail = [...trail, node];
        if (node.products) {
          const match = node.products.find(p => String(p.id) === strId);
          if (match) {
            result = { product: match, trail: nextTrail };
            return;
          }
        }
        if (node.children) walk(node.children, nextTrail);
        if (result) return;
      }
    }
    walk(CATALOG, []);
    return result;
  },

  // getProductsByIds(ids) -> array of products
  async getProductsByIds(ids) {
    if (!ids || !ids.length) return [];
    const idSet = new Set(ids.map(String));
    const list = [];
    function walk(nodes) {
      for (const node of nodes) {
        if (node.products) {
          for (const p of node.products) {
            if (idSet.has(String(p.id))) {
              list.push(p);
            }
          }
        }
        if (node.children) walk(node.children);
      }
    }
    walk(CATALOG);
    return list;
  },

  // getRelated(slug, limit = 4) -> array of products from the same collection
  async getRelated(slug, limit = 4) {
    const found = await this.getProduct(slug);
    if (!found) return [];
    const leaf = found.trail[found.trail.length - 1];
    let list = (leaf.products || []).filter(p => p.slug !== slug);
    if (list.length < limit && found.trail.length > 1) {
      const parent = found.trail[found.trail.length - 2];
      const collect = n => {
        let res = [];
        if (n.products) res.push(...n.products);
        if (n.children) n.children.forEach(c => res.push(...collect(c)));
        return res;
      };
      const more = collect(parent).filter(p => p.slug !== slug && !list.some(x => x.slug === p.slug));
      list = [...list, ...more];
    }
    return list.slice(0, limit);
  },

  // Calculate delivery charge according to city and subtotal
  getDeliveryCharge(city, subtotal) {
    if (subtotal >= SETTINGS.delivery.freeAbove) return 0;
    const c = String(city || '').trim();
    if (c && SETTINGS.delivery.cityRates[c] !== undefined) {
      return SETTINGS.delivery.cityRates[c];
    }
    return SETTINGS.delivery.flatRate;
  },

  // Simulate network order placement
  async placeOrder(orderData) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const orderNumber = `RS-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullOrder = {
      orderNumber,
      createdAt: new Date().toISOString(),
      ...orderData
    };
    return {
      success: true,
      orderNumber,
      order: fullOrder
    };
  },

  // Track order: returns order details and status timeline or null
  async trackOrder(orderNumber, phone) {
    await new Promise(resolve => setTimeout(resolve, 600));

    const normOrder = String(orderNumber || '').trim().toUpperCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (!normOrder || cleanPhone.length < 10) {
      return null;
    }

    // 1. Check if user just placed an order in this browser session
    try {
      const lastRaw = sessionStorage.getItem('rashy_last_order');
      if (lastRaw) {
        const lastOrder = JSON.parse(lastRaw);
        const lastPhone = String(lastOrder.customer?.phone || '').replace(/\D/g, '');
        const lastNum = String(lastOrder.orderNumber || '').toUpperCase();
        if ((lastNum === normOrder || normOrder.includes(lastNum.replace(/\D/g, ''))) &&
            (lastPhone.endsWith(cleanPhone.slice(-10)) || cleanPhone.endsWith(lastPhone.slice(-10)))) {
          return {
            orderNumber: lastOrder.orderNumber,
            status: 'Confirmed',
            createdAt: lastOrder.createdAt || new Date().toISOString(),
            customer: lastOrder.customer,
            items: lastOrder.items || [],
            subtotal: lastOrder.subtotal,
            deliveryCharge: lastOrder.deliveryCharge,
            total: lastOrder.total,
            courier: 'TCS Express',
            trackingNumber: `TCS-${lastOrder.orderNumber.replace(/\D/g, '')}98`,
            statusHistory: [
              { status: 'Pending', label: 'Order Placed', time: 'Received by store', at: 'Just now', done: true },
              { status: 'Confirmed', label: 'Order Confirmed', time: 'Verified via WhatsApp/Call', at: 'Just now', done: true, current: true },
              { status: 'Shipped', label: 'Handed to Courier', time: 'Awaiting parcel pickup', at: 'Expected tomorrow', done: false },
              { status: 'Delivered', label: 'Doorstep Delivery', time: 'COD payment on arrival', at: 'Est. 2-3 business days', done: false },
            ]
          };
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Built-in test mock orders
    const dummyDatabase = {
      'RS-10234': {
        orderNumber: 'RS-10234',
        phone: '03001234567',
        status: 'Shipped',
        createdAt: '2026-10-07T14:30:00Z',
        courier: 'TCS Express',
        trackingNumber: 'TCS-98421034',
        customer: {
          name: 'Haider Ali',
          phone: '03001234567',
          city: 'Lahore',
          address: 'House 42-B, Street 5, Model Town',
          paymentMethod: 'Cash on Delivery (COD)',
        },
        items: [
          { name: 'English Willow Cricket Bat - Edition Pro', variant: '1150g', qty: 1, price: 18500, img: '1531415074868-8369cdd257c6' },
          { name: 'Red Leather Cricket Ball (Pack of 2)', variant: '2-Pack', qty: 1, price: 1800, img: '1540747913346-39e1bf896636' },
        ],
        subtotal: 20300,
        deliveryCharge: 0,
        total: 20300,
        statusHistory: [
          { status: 'Pending', label: 'Order Placed', time: '7 Oct 2026, 02:30 PM', done: true },
          { status: 'Confirmed', label: 'Order Verified', time: '7 Oct 2026, 04:15 PM', done: true },
          { status: 'Shipped', label: 'Shipped via TCS', time: '8 Oct 2026, 11:20 AM', done: true, current: true },
          { status: 'Delivered', label: 'Doorstep Delivery', time: 'Estimated delivery tomorrow', done: false },
        ]
      },
      'RS-73759': {
        orderNumber: 'RS-73759',
        phone: '03001234567',
        status: 'Confirmed',
        createdAt: '2026-10-09T10:15:00Z',
        courier: 'Leopards Courier',
        trackingNumber: 'LCS-4491028',
        customer: {
          name: 'Muhammad Ayan',
          phone: '03001234567',
          city: 'Karachi',
          address: 'Plot 12, Block 4, Clifton',
          paymentMethod: 'Cash on Delivery (COD)',
        },
        items: [
          { name: 'Club Leather Cricket Ball', variant: 'Single', qty: 2, price: 1200, img: '1540747913346-39e1bf896636' },
          { name: 'Pro Cricket Batting Gloves', variant: 'Men', qty: 1, price: 3200, img: '1587280501635-68a0e82cd5ff' },
        ],
        subtotal: 5600,
        deliveryCharge: 0,
        total: 5600,
        statusHistory: [
          { status: 'Pending', label: 'Order Placed', time: '9 Oct 2026, 10:15 AM', done: true },
          { status: 'Confirmed', label: 'Order Verified', time: '9 Oct 2026, 11:45 AM', done: true, current: true },
          { status: 'Shipped', label: 'Dispatched to Courier', time: 'Packing in progress', done: false },
          { status: 'Delivered', label: 'Delivered', time: 'Est. in 2–3 days', done: false },
        ]
      },
      'RS-48201': {
        orderNumber: 'RS-48201',
        phone: '03129876543',
        status: 'Delivered',
        createdAt: '2026-10-02T09:00:00Z',
        courier: 'M&P Express',
        trackingNumber: 'MNP-10928374',
        customer: {
          name: 'Babar Azam',
          phone: '03129876543',
          city: 'Islamabad',
          address: 'Sector F-7/2, Street 19',
          paymentMethod: 'Bank Transfer (Meezan Bank)',
        },
        items: [
          { name: 'Titanium Pro Cricket Helmet', variant: 'Medium', qty: 1, price: 6500, img: '1593786267440-5a33994326f2' },
        ],
        subtotal: 6500,
        deliveryCharge: 0,
        total: 6500,
        statusHistory: [
          { status: 'Pending', label: 'Order Placed', time: '2 Oct 2026, 09:00 AM', done: true },
          { status: 'Confirmed', label: 'Payment Verified', time: '2 Oct 2026, 10:30 AM', done: true },
          { status: 'Shipped', label: 'In Transit', time: '3 Oct 2026, 01:00 PM', done: true },
          { status: 'Delivered', label: 'Delivered & Signed', time: '5 Oct 2026, 03:45 PM', done: true, current: true },
        ]
      },
      'RS-99999': {
        orderNumber: 'RS-99999',
        phone: '03335555555',
        status: 'Cancelled',
        createdAt: '2026-10-05T12:00:00Z',
        cancelReason: 'Order cancelled upon customer request (duplicate order).',
        customer: {
          name: 'Ahmed Raza',
          phone: '03335555555',
          city: 'Rawalpindi',
          address: 'Commercial Market, Satellite Town',
          paymentMethod: 'Cash on Delivery',
        },
        items: [
          { name: 'Practice T-Shirt', variant: 'L', qty: 2, price: 1200, img: '1521572267360-ee0c2909d518' },
        ],
        subtotal: 2400,
        deliveryCharge: 200,
        total: 2600,
        statusHistory: []
      }
    };

    const orderKey = Object.keys(dummyDatabase).find(k => k === normOrder || normOrder.includes(k.replace(/\D/g, '')));
    if (orderKey) {
      const ord = dummyDatabase[orderKey];
      const ordCleanPhone = ord.phone.replace(/\D/g, '');
      if (ordCleanPhone.endsWith(cleanPhone.slice(-10)) || cleanPhone.endsWith(ordCleanPhone.slice(-10))) {
        return ord;
      }
    }

    // Dynamic fallback for any valid order format when matched with phone
    if (/^RS-\d{4,6}$/i.test(normOrder)) {
      return {
        orderNumber: normOrder,
        phone: cleanPhone,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        courier: 'TCS Express Courier',
        trackingNumber: `TCS-${normOrder.replace(/\D/g, '')}77`,
        customer: {
          name: 'Valued Customer',
          phone: cleanPhone,
          city: 'Delivery City',
          address: 'Verified shipping address on record',
          paymentMethod: 'Cash on Delivery (COD)',
        },
        items: [
          { name: 'Cricket Gear Item', variant: 'Standard', qty: 1, price: 4500, img: '1531415074868-8369cdd257c6' }
        ],
        subtotal: 4500,
        deliveryCharge: 250,
        total: 4750,
        statusHistory: [
          { status: 'Pending', label: 'Order Placed', time: 'Recorded in database', done: true },
          { status: 'Confirmed', label: 'Order Confirmed', time: 'Verified for dispatch', done: true, current: true },
          { status: 'Shipped', label: 'Dispatched to Courier', time: 'In progress', done: false },
          { status: 'Delivered', label: 'Doorstep Delivery', time: 'Estimated 2-3 working days', done: false },
        ]
      };
    }

    return null;
  },

  // Case-insensitive search on product name, description, and collection names
  async search(term) {
    const raw = String(term || '').trim().toLowerCase();
    if (!raw) return { products: [], collections: [] };

    // Ignore extra spaces
    const query = raw.replace(/\s+/g, ' ');
    const queryTokens = query.split(' ').filter(Boolean);

    const matchedProducts = [];
    const matchedCollections = [];
    const seenProductIds = new Set();
    const seenCollectionPaths = new Set();

    function walk(nodes, trail) {
      for (const node of nodes) {
        const currentTrail = [...trail, node];
        const trailStr = currentTrail.map(t => t.name).join(' > ');
        const pathSlug = currentTrail.map(t => t.slug).join('/');
        const colName = node.name.toLowerCase();

        // Check if collection matches
        if (colName.includes(query) || queryTokens.every(tk => colName.includes(tk))) {
          if (!seenCollectionPaths.has(pathSlug)) {
            seenCollectionPaths.add(pathSlug);
            matchedCollections.push({
              name: node.name,
              path: pathSlug,
              trailStr,
              count: node.products ? node.products.length : (node.children ? node.children.length : 0),
            });
          }
        }

        if (node.products) {
          for (const prod of node.products) {
            if (seenProductIds.has(prod.id)) continue;
            const pName = prod.name.toLowerCase();
            const pDesc = (prod.description || '').toLowerCase();
            const inTrail = currentTrail.some(t => t.name.toLowerCase().includes(query));

            let score = 0;
            if (pName === query) score = 100;
            else if (pName.startsWith(query)) score = 80;
            else if (pName.includes(query)) score = 60;
            else if (queryTokens.every(tk => pName.includes(tk))) score = 50;
            else if (inTrail) score = 30;
            else if (pDesc.includes(query)) score = 20;
            else if (queryTokens.some(tk => pDesc.includes(tk))) score = 10;

            if (score > 0) {
              seenProductIds.add(prod.id);
              matchedProducts.push({ product: prod, score, trail: currentTrail });
            }
          }
        }

        if (node.children) {
          walk(node.children, currentTrail);
        }
      }
    }

    walk(CATALOG, []);

    // Rank name matches first, then higher scores
    matchedProducts.sort((a, b) => b.score - a.score);

    return {
      products: matchedProducts.map(m => m.product),
      collections: matchedCollections.slice(0, 4),
    };
  },

  // Contact form message submission (simulates network delay)
  async sendMessage(data) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      messageId: `MSG-${Date.now()}`,
      receivedAt: new Date().toISOString()
    };
  },

  // Blog API methods
  async getPosts({ page = 1, limit = 6, category = null } = {}) {
    let filtered = [...BLOG_POSTS];
    if (category && category !== 'all' && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * limit;
    const posts = filtered.slice(start, start + limit);
    const categories = ['All', ...new Set(BLOG_POSTS.map(p => p.category))];

    return {
      posts,
      total,
      page: currentPage,
      totalPages,
      categories
    };
  },

  async getPost(slug) {
    const post = BLOG_POSTS.find(p => p.slug === slug);
    if (!post) return null;

    const relatedPosts = BLOG_POSTS
      .filter(p => p.slug !== slug)
      .slice(0, 3);

    // Pick 4 recommended gear products from catalog
    const slugList = [
      'tape-ball-bat-power-hitter',
      'english-willow-grade-1-bat',
      'complete-hardball-kit-adult',
      'cricket-spikes-shoes'
    ];
    const results = await Promise.all(slugList.map(s => DUMMY_API.getProduct(s)));
    const recommendedProducts = results.filter(Boolean).map(r => r.product);

    return {
      ...post,
      relatedPosts,
      recommendedProducts
    };
  },
};

const BLOG_POSTS = [
  {
    slug: 'how-to-choose-tape-ball-bat',
    title: 'How To Choose The Right Tape Ball Bat For Your Game',
    excerpt: 'From blade thickness and scoop depth to handle flex and pickup balance, here is everything you need to hit longer sixes in tape ball cricket tournaments.',
    cover: PHOTO.batWall,
    author: 'Coach Haider Ali',
    date: 'October 12, 2026',
    day: '12',
    month: 'Oct',
    category: 'Bat Care & Selection',
    readTime: '5 min read',
    content: `
      <p>Tape ball cricket across Pakistan—from the floodlit Ramadan night tournaments of Karachi to the gullies of Lahore and Rawalpindi—demands a very specific set of batting skills and equipment. Unlike traditional hardball cricket where timing and weight placement drive the ball, tape ball demands explosive bat speed, aerodynamic scoops, and supreme balance.</p>
      
      <h2>1. Weight Matters: Light vs Heavy Blade</h2>
      <p>The standard tape ball bat weighs between <strong>780 grams to 860 grams</strong>. If you play predominantly on tight street pitches or cement tracks where express pace bowlers bowl short-pitch bouncers, a lighter bat (under 800g) allows you to pull, hook, and slash with rapid wrists.</p>
      <p>Conversely, in open ground tournaments with deep boundaries (over 65 meters), an 820g–850g bat with a fuller spine gives you the sheer punching power required to clear the ropes even with thick, double-taped balls.</p>

      <h2>2. Blade Length and Handle Flexibility</h2>
      <p>Most premier Pakistani tape ball batsmen prefer a <strong>long blade (35–36 inches)</strong> with a double or triple cane handle. Cane handles absorb the jarring vibrations that occur when meeting a 130 km/h taped tennis ball on the bottom or toe edge.</p>
      <ul>
        <li><strong>Full Cane Handle:</strong> Maximum shock absorption and whip effect.</li>
        <li><strong>Semi-Oval Grip:</strong> Provides directional stability so the bat doesn't twist in your hands during power strokes.</li>
        <li><strong>Scooped Back (Aerodynamic V-cuts):</strong> Removes dead weight from the spine while keeping 45mm+ thick edges.</li>
      </ul>

      <h2>3. Inspecting the Grain &amp; Wood Grade</h2>
      <p>While top hardball bats rely on English Willow, premium tape ball bats are hand-carved from seasoned <strong>Pakistani Kashmir Willow or Sialkot Poplar Willow</strong>. Look for straight wood fibers, no knots in the sweet spot, and natural oil seasoning before making your selection.</p>

      <div class="policy-callout">
        <strong>Pro Tip from Haider Sports Workshop:</strong>
        Always bind your tape ball bat handle with high-grip friction tape or a dual-layer rubber grip. A secure grip prevents blisters during fast-paced 6-over night matches.
      </div>
    `
  },
  {
    slug: 'english-willow-vs-kashmir-willow',
    title: 'English Willow vs Kashmir Willow: Which Bat Is Better?',
    excerpt: 'Comparing grain structure, ping, rebound speed, durability, and cost between Grade 1 English Willow and Pakistani Kashmir Willow.',
    cover: PHOTO.batMrf,
    author: 'Haider Sports Master Craftsman',
    date: 'October 18, 2026',
    day: '18',
    month: 'Oct',
    category: 'Bat Care & Selection',
    readTime: '6 min read',
    content: `
      <p>One of the most frequent questions we receive from cricketers across Pakistan is: <em>"Should I invest in an imported English Willow bat, or is a domestic Kashmir Willow bat sufficient for my hardball cricket matches?"</em></p>
      <p>Both types of willow have distinctive cellular structures, rebound characteristics, and price points. Let's break down the real-world differences so you can make an informed decision.</p>

      <h2>1. The Wood: Salix Alba Caerulea vs Salix Alba</h2>
      <p><strong>English Willow</strong> is harvested from the Salix Alba Caerulea tree grown in the United Kingdom. The wood is naturally softer, lighter in color, and possesses higher elasticity. When struck by a 156g red leather cricket ball, the fibers compress and spring back instantly, producing the signature "ping" and sound that professional batsmen love.</p>
      <p><strong>Kashmir Willow</strong> is grown in the Kashmir valley. Due to colder, drier growing conditions, Kashmir willow is denser, darker in color with reddish tones, and inherently stiffer. It has slightly lower rebound power compared to Grade 1 English Willow, but boasts impressive structural toughness.</p>

      <h2>2. Performance &amp; "Ping" Comparison</h2>
      <p>In side-by-side ball bounce tests with an 8-pound bat mallet:</p>
      <ul>
        <li><strong>Grade 1 English Willow:</strong> Exceptional rebound from the first knocking session; ball travels 10–15% farther off the sweet spot.</li>
        <li><strong>Kashmir Willow:</strong> Requires 2–3 weeks of diligent knocking-in to open up the grain fibers, but delivers solid mid-range performance once broken in.</li>
      </ul>

      <h2>3. Price-to-Value Comparison in Pakistan</h2>
      <p>A Grade 1 English Willow bat typically ranges between <strong>Rs. 25,000 to Rs. 50,000+</strong>, making it the weapon of choice for district, club, and first-class league players. A top-tier Kashmir Willow bat costs between <strong>Rs. 6,500 and Rs. 14,000</strong>, offering unbeatable value for academy youngsters, school tournaments, and weekend leather-ball warriors.</p>
    `
  },
  {
    slug: 'complete-hardball-kit-guide-beginners',
    title: 'Complete Hardball Kit Guide: Everything A Beginner Needs',
    excerpt: 'Stepping into club or academy cricket? Here is your essential checklist for helmet safety, pads, gloves, and protective gear.',
    cover: PHOTO.kitFull,
    author: 'Captain Salman',
    date: 'October 24, 2026',
    day: '24',
    month: 'Oct',
    category: 'Match Gear',
    readTime: '7 min read',
    content: `
      <p>Transitioning from tape ball to hard leather ball cricket is a thrilling milestone for every young cricketer. However, facing a 5.5-ounce leather ball hurtling toward you at 120 km/h requires certified protective equipment to keep you safe and confident at the crease.</p>

      <h2>The Essential 7-Piece Safety Checklist</h2>
      <ol>
        <li><strong>Cricket Batting Helmet:</strong> Never compromise on head safety. Ensure your helmet features an adjustable steel or titanium face grille that leaves less than a ball's width gap between the peak and the grille.</li>
        <li><strong>Batting Gloves:</strong> Look for multi-split finger rolls reinforced with high-density foam (HDF) and polyurethane inserts on the lead hand fingers.</li>
        <li><strong>Leg Guards (Batting Pads):</strong> Traditional cane-rod inserts or modern lightweight moulded foam with pre-curved knee rolls provide superior shin and knee cap defense.</li>
        <li><strong>Thigh Guard &amp; Inner Thigh Guard:</strong> Essential for defending against rising deliveries and back-of-a-length deliveries on bouncy pitches.</li>
        <li><strong>Abdominal Guard (L-Guard) &amp; Supporter:</strong> High-impact ABS plastic shell with padded rubber edges for maximum groin protection.</li>
        <li><strong>Arm Guard &amp; Chest Guard:</strong> Optional for slow pitches, but crucial for academy youngsters facing seam bowling.</li>
        <li><strong>Wheelie Kit Bag:</strong> Heavy-duty 1000D polyester with separate bat compartments and heavy-duty zips to keep all your gear organized and dry.</li>
      </ol>

      <h2>Fit &amp; Sizing Rule of Thumb</h2>
      <p>Protective gear that is too large will slip during quick singles; gear that is too tight restricts agility. When wearing batting pads, your knee cap should fit snugly into the center of the padded knee roll while standing upright.</p>
    `
  },
  {
    slug: 'cricket-bat-knocking-and-oiling-guide',
    title: 'The Ultimate Guide to Knocking-In and Oiling Your New Cricket Bat',
    excerpt: 'Protect your investment: step-by-step instructions on raw linseed oil application, mallet knocking, and edge protection to prevent willow cracks.',
    cover: PHOTO.batHit,
    author: 'Haider Sports Workshop Team',
    date: 'November 02, 2026',
    day: '02',
    month: 'Nov',
    category: 'Bat Care & Selection',
    readTime: '8 min read',
    content: `
      <p>A brand new English or Kashmir willow bat is not ready for match action straight off the shelf. Even bats pre-pressed at our Sialkot factory require careful knocking-in and light oiling to compress the cellular wood fibers and build resistance against high-speed ball impacts.</p>

      <h2>Step 1: Oiling with Raw Linseed Oil</h2>
      <p>Apply half a teaspoon (approximately 5ml) of <strong>raw linseed oil</strong> to the face, edges, and toe of the bat using a clean cloth or your fingertips. <em>Do not apply oil to the splice, handle, or back stickers.</em></p>
      <ul>
        <li>Store the bat horizontally overnight to allow the oil to seep uniformly into the wood fibers.</li>
        <li>Never over-oil; over-saturation rots the timber and makes the blade soggy and heavy.</li>
      </ul>

      <h2>Step 2: Knocking In with a Wooden Mallet</h2>
      <p>Using a hardwood cricket bat mallet, begin striking the sweet spot with light, repetitive taps. Gradually increase the force over 4 to 6 hours spread across several days.</p>
      <p><strong>Crucial Edge Tapping:</strong> Tilt the mallet at a 45-degree angle when tapping the edges. Never strike the side of the edge directly at 90 degrees, as this can shear the grain.</p>

      <h2>Step 3: Net Testing and Anti-Scuff Sheet</h2>
      <p>Before facing a hard new match ball, test the bat in the nets using old leather balls or throwdowns. Apply an anti-scuff sheet and fiberglass edge tape to guard against surface moisture and edge nicks.</p>
    `
  },
  {
    slug: 'fast-bowling-footwear-spikes-vs-rubber-studs',
    title: 'Fast Bowling Footwear: Spikes vs Rubber Studs on Pakistani Pitches',
    excerpt: 'Ankle support, toe impact protection, and grip dynamics for turf wickets versus cemented and matting grounds across Pakistan.',
    cover: PHOTO.shoeTie,
    author: 'Physio Tariq Mehmood',
    date: 'November 10, 2026',
    day: '10',
    month: 'Nov',
    category: 'Footwear & Fitness',
    readTime: '4 min read',
    content: `
      <p>Fast bowlers endure ground reaction forces up to 8 to 10 times their body weight at front-foot landing. Choosing the right footwear is essential not just for run-up rhythm, but to prevent severe injuries such as shin splints, stress fractures, and bruised toenails.</p>

      <h2>1. Turf Wickets: Full Metal Spikes</h2>
      <p>On grass wickets and prepared clay pitches (such as those at National Stadium Karachi or Gaddafi Stadium Lahore), fast bowlers require <strong>full metal spikes (front and rear)</strong>. The heel spikes prevent the landing foot from slipping forward, while forefoot spikes provide propulsion at gather.</p>

      <h2>2. Cemented Pitches and Coir Matting: Rubber Studs</h2>
      <p>Over 70% of club cricket in Pakistan is played on cemented pitches or traditional coir matting tracks. <strong>Never wear metal spikes on cement</strong>—the spikes cannot penetrate, leading to instant slips, bent ankles, and damaged shoe soles.</p>
      <p>For these surfaces, high-traction <strong>rubber stud shoes with EVA midsoles</strong> provide both multi-directional grip and impact absorption.</p>
    `
  },
  {
    slug: 'mastering-the-yorker-tape-ball-bowling-tactics',
    title: 'Mastering The Toe-Crushing Yorker: Tape Ball Bowling Secrets',
    excerpt: 'How to swing the taped tennis ball both ways, execute reverse swing at pace, and nail toe-crushing yorkers in tense death overs.',
    cover: PHOTO.tennis1,
    author: 'Coach Haider Ali',
    date: 'November 18, 2026',
    day: '18',
    month: 'Nov',
    category: 'Training & Tips',
    readTime: '5 min read',
    content: `
      <p>In modern Pakistani tape ball cricket, batsmen can clear 70-meter boundaries with slight bottom-hand chips. When defending 12 runs in the final over, nothing is more lethal than the pinpoint, toe-crushing yorker delivered at 135 km/h.</p>

      <h2>1. The Science of the Taped Ball Seam</h2>
      <p>To achieve sharp late swing, the ball must be taped properly. One half of the tennis ball is covered in smooth electrical tape, while the other half retains the natural rough felt. Running your thumb along the shiny side creates asymmetrical airflow, producing reverse swing into right-handed batsmen.</p>

      <h2>2. Wrist Position and Release Angle</h2>
      <p>Keep your wrist cocked and locked until the moment of release. Pull down hard through the crease with a high arm action. Aim your eyes not at the stumps, but at the batsman's toes or the popping crease chalk line.</p>

      <h2>3. Death-Over Field Traps</h2>
      <p>Pair your yorkers with a deep mid-wicket, long-on, and backward point. A batsman who knows you can nail the yorker will hesitate to step out, making your slower-ball bouncer even more destructive.</p>
    `
  }
];


const SETTINGS = {
  delivery: {
    flatRate: 250,
    freeAbove: 5000,
    cityRates: {
      'Karachi': 200,
      'Lahore': 200,
      'Rawalpindi': 200,
      'Islamabad': 200,
      'Sialkot': 150,
      'Faisalabad': 220,
      'Peshawar': 250,
      'Multan': 230,
      'Quetta': 280,
    }
  },
  bankDetails: {
    bankName: 'Meezan Bank Ltd',
    accountTitle: 'Haider Sports Pakistan',
    accountNumber: '02010108923451',
    iban: 'PK45MEZN0002010108923451',
    branch: 'Sialkot Cantt Branch',
    jazzcash: '03001234567 (Haider Sports)',
    easypaisa: '03001234567 (Haider Sports)',
  }
};

if (typeof window !== 'undefined') {
  window.DUMMY_API = DUMMY_API;
  window.DUMMY_CATALOG = CATALOG;
  window.DUMMY_SETTINGS = SETTINGS;
  window.DUMMY_PHOTO = PHOTO;
  window.DUMMY_BLOG_POSTS = BLOG_POSTS;
}



