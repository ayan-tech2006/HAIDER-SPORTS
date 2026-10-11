// Data access layer: connects to Supabase when active; falls back to dummy-data.js when offline or USE_DUMMY = true.

let cachedTree = null;
let cachedTreeTime = 0;
const TREE_CACHE_TTL = 30000; // 30s in-memory cache

// Helper: Normalize Supabase product record to frontend product shape
function normalizeProduct(p) {
  if (!p) return null;
  const images = (p.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const mainImg = (images[0] && images[0].url) || '1593341646647-75b32930e4a1';
  const gallery = images.length > 0 ? images.map(img => img.url) : [mainImg];

  let variants = null;
  if (p.product_variants && p.product_variants.length > 0) {
    const firstLabel = p.product_variants[0].label || 'Option';
    const options = p.product_variants.map(v => v.value);
    variants = { label: firstLabel, options };
  }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    old: p.compare_at_price,
    tag: p.tag,
    img: mainImg,
    images: gallery,
    gallery,
    description: p.description || '',
    stock: p.stock ?? 10,
    is_featured: p.is_featured,
    variants,
    rawVariants: p.product_variants || []
  };
}

// Check if live Supabase is enabled and reachable
function isLiveSupabase() {
  return typeof USE_DUMMY !== 'undefined' && !USE_DUMMY && typeof supabaseClient !== 'undefined' && supabaseClient !== null;
}

const api = {
  // Whole collection tree (cached in memory)
  async getTree() {
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getTree() : [];
    }

    const now = Date.now();
    if (cachedTree && (now - cachedTreeTime < TREE_CACHE_TTL)) {
      return cachedTree;
    }

    try {
      const [colRes, prodCountRes] = await Promise.all([
        supabaseClient.from('collections').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabaseClient.from('products').select('collection_id').eq('is_active', true)
      ]);

      if (colRes.error || !colRes.data || colRes.data.length === 0) {
        throw colRes.error || new Error('No collections returned');
      }

      const counts = {};
      if (prodCountRes.data) {
        prodCountRes.data.forEach(p => {
          counts[p.collection_id] = (counts[p.collection_id] || 0) + 1;
        });
      }

      const map = {};
      const roots = [];

      colRes.data.forEach(c => {
        map[c.id] = {
          id: c.id,
          parent_id: c.parent_id,
          slug: c.slug,
          name: c.name,
          img: c.image_url || '1593341646647-75b32930e4a1',
          children: [],
          products: null,
          productCount: counts[c.id] || 0
        };
      });

      colRes.data.forEach(c => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].children.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });

      // Compute relative URL paths for all nodes
      function assignPaths(nodes, parentPath = '') {
        nodes.forEach(n => {
          n.path = parentPath ? `${parentPath}/${n.slug}` : n.slug;
          if (n.children && n.children.length > 0) {
            assignPaths(n.children, n.path);
          }
        });
      }
      assignPaths(roots);

      cachedTree = roots;
      cachedTreeTime = now;
      return roots;
    } catch (err) {
      console.warn('Falling back to dummy tree:', err);
      return window.DUMMY_API ? window.DUMMY_API.getTree() : [];
    }
  },

  invalidateTree() {
    cachedTree = null;
    cachedTreeTime = 0;
  },

  // path: ['cricket', 'bats', 'english-willow'] -> { node, trail }
  async getCollection(path = []) {
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getCollection(path) : null;
    }

    try {
      const roots = await this.getTree();
      const trail = [];
      let list = roots;
      let targetNode = null;

      for (const slug of path) {
        const found = list.find(c => c.slug === slug);
        if (!found) return null;
        trail.push(found);
        targetNode = found;
        list = found.children || [];
      }

      if (targetNode && targetNode.children.length === 0) {
        // Leaf collection: fetch its products
        const { data: prods, error } = await supabaseClient
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .eq('collection_id', targetNode.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && prods) {
          targetNode.products = prods.map(normalizeProduct);
        }
      }

      return { node: targetNode, trail };
    } catch (err) {
      console.warn('Falling back to dummy collection:', err);
      return window.DUMMY_API ? window.DUMMY_API.getCollection(path) : null;
    }
  },

  // getProduct(slug) -> { product, trail }
  async getProduct(slug) {
    if (!slug) return null;
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getProduct(slug) : null;
    }

    try {
      const cleanSlug = String(slug).toLowerCase().trim();
      const { data: p, error } = await supabaseClient
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .eq('slug', cleanSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !p) {
        // Try fallback search in dummy
        return window.DUMMY_API ? window.DUMMY_API.getProduct(slug) : null;
      }

      const product = normalizeProduct(p);

      // Reconstruct category trail from collection tree
      const roots = await this.getTree();
      let trail = [];

      function findTrail(nodes, parents) {
        for (const n of nodes) {
          const current = [...parents, n];
          if (n.id === p.collection_id) {
            trail = current;
            return true;
          }
          if (n.children && findTrail(n.children, current)) return true;
        }
        return false;
      }
      findTrail(roots, []);

      return { product, trail };
    } catch (err) {
      console.warn('Falling back to dummy getProduct:', err);
      return window.DUMMY_API ? window.DUMMY_API.getProduct(slug) : null;
    }
  },

  // getProductById(id) -> { product, trail }
  async getProductById(id) {
    if (!id) return null;
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getProductById(id) : null;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabaseClient.from('products').select('*, product_images(*), product_variants(*)').eq('is_active', true);
      
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data: p, error } = await query.maybeSingle();
      if (error || !p) {
        return window.DUMMY_API ? window.DUMMY_API.getProductById(id) : null;
      }

      const product = normalizeProduct(p);
      return { product, trail: [] };
    } catch (err) {
      return window.DUMMY_API ? window.DUMMY_API.getProductById(id) : null;
    }
  },

  // getProductsByIds(ids) -> array of products
  async getProductsByIds(ids = []) {
    if (!ids || ids.length === 0) return [];
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getProductsByIds(ids) : [];
    }

    try {
      const validUuids = ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      const slugs = ids.filter(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      const queries = [];
      if (validUuids.length > 0) {
        queries.push(supabaseClient.from('products').select('*, product_images(*), product_variants(*)').in('id', validUuids).eq('is_active', true));
      }
      if (slugs.length > 0) {
        queries.push(supabaseClient.from('products').select('*, product_images(*), product_variants(*)').in('slug', slugs).eq('is_active', true));
      }

      const results = await Promise.all(queries);
      const allRows = [];
      results.forEach(res => {
        if (res.data) allRows.push(...res.data);
      });

      if (allRows.length === 0 && window.DUMMY_API) {
        return window.DUMMY_API.getProductsByIds(ids);
      }

      return allRows.map(normalizeProduct);
    } catch (err) {
      return window.DUMMY_API ? window.DUMMY_API.getProductsByIds(ids) : [];
    }
  },

  // getRelated(product, limit = 4)
  async getRelated(product, limit = 4) {
    if (!product) return [];
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.getRelated(product, limit) : [];
    }

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*, product_images(*), product_variants(*)')
        .neq('slug', product.slug)
        .eq('is_active', true)
        .limit(limit);

      if (error || !data || data.length === 0) {
        return window.DUMMY_API ? window.DUMMY_API.getRelated(product, limit) : [];
      }

      return data.map(normalizeProduct);
    } catch (err) {
      return window.DUMMY_API ? window.DUMMY_API.getRelated(product, limit) : [];
    }
  },

  // search(term) -> { products: [...], collections: [...] }
  async search(query) {
    if (!query || !query.trim()) return { products: [], collections: [] };
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.search(query) : { products: [], collections: [] };
    }

    try {
      const term = query.trim();
      const [pRes, cRes] = await Promise.all([
        supabaseClient
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .or(`name.ilike.%${term}%,description.ilike.%${term}%,slug.ilike.%${term}%`)
          .eq('is_active', true)
          .limit(20),
        supabaseClient
          .from('collections')
          .select('*')
          .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
          .eq('is_active', true)
          .limit(5)
      ]);

      const products = (pRes.data || []).map(normalizeProduct);
      const collections = (cRes.data || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        img: c.image_url,
        trail: [{ name: c.name, slug: c.slug }]
      }));

      return { products, collections };
    } catch (err) {
      return window.DUMMY_API ? window.DUMMY_API.search(query) : { products: [], collections: [] };
    }
  },

  // YouTube videos (admin adds links; stored as the 11-character video id)
  async getVideos({ limit = 0 } = {}) {
    if (!isLiveSupabase()) return [];
    try {
      let q = supabaseClient.from('videos')
        .select('id, title, description, youtube_id')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    } catch (err) {
      // table not created yet, or offline: the site simply shows no videos
      console.warn('Videos unavailable:', err.message || err);
      return [];
    }
  },

  // Contact form submission -> messages table
  async sendMessage(data) {
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.sendMessage(data) : { success: true };
    }

    try {
      const { error } = await supabaseClient.from('messages').insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        subject: data.subject || null,
        message: data.message
      });

      if (error) throw error;
      return { success: true, messageId: `MSG-${Date.now()}` };
    } catch (err) {
      console.warn('Falling back message send:', err);
      return { success: true, messageId: `MSG-OFFLINE` };
    }
  },

  // Newsletter subscription -> subscribers table
  async subscribe(email) {
    if (!email) return { success: false, error: 'Email required' };
    if (!isLiveSupabase()) return { success: true };

    try {
      const { error } = await supabaseClient.from('subscribers').insert({ email: email.toLowerCase().trim() });
      if (error && error.code !== '23505') { // 23505 = unique constraint violation (already subscribed)
        throw error;
      }
      return { success: true };
    } catch (err) {
      return { success: true };
    }
  },

  // Order Tracking -> track_order RPC
  async trackOrder(orderNumber, phone) {
    if (!orderNumber || !phone) return null;
    if (!isLiveSupabase()) {
      return window.DUMMY_API ? window.DUMMY_API.trackOrder(orderNumber, phone) : null;
    }

    try {
      const { data, error } = await supabaseClient.rpc('track_order', {
        p_order_number: orderNumber.trim(),
        p_phone: phone.trim()
      });

      if (error) throw error;
      if (!data) return null;

      // Normalize snake_case RPC return to match order-tracking.js format
      return {
        orderNumber: data.order_number,
        status: data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1)) : 'Pending',
        orderDate: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        customerName: data.customer_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        courier: data.courier,
        trackingNumber: data.tracking_number,
        paymentMethod: data.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Bank Transfer / JazzCash',
        subtotal: data.subtotal,
        deliveryFee: data.delivery_charge,
        discount: data.discount || 0,
        grandTotal: data.total,
        statusHistory: (data.history || []).map(h => ({
          status: h.status ? (h.status.charAt(0).toUpperCase() + h.status.slice(1)) : 'Pending',
          time: new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          note: h.note
        })),
        items: (data.items || []).map(i => ({
          id: i.product_id,
          name: i.product_name,
          variant: i.variant,
          price: i.price,
          qty: i.qty,
          lineTotal: i.line_total
        }))
      };
    } catch (err) {
      console.warn('Falling back to dummy tracking:', err);
      return window.DUMMY_API ? window.DUMMY_API.trackOrder(orderNumber, phone) : null;
    }
  },

  // Place Order -> place_order RPC
  async placeOrder(payload) {
    if (!isLiveSupabase()) {
      // Simulate dummy order placement
      await new Promise(r => setTimeout(r, 600));
      const orderNum = 'RS-' + Math.floor(10000 + Math.random() * 90000);
      const resOrder = {
        orderNumber: orderNum,
        date: new Date().toISOString(),
        paymentMethod: payload.payment?.method || 'cod',
        customer: payload.customer,
        items: payload.items,
        subtotal: payload.subtotal,
        deliveryCharge: payload.deliveryCharge,
        discount: payload.discount || 0,
        total: payload.total
      };
      return { success: true, orderNumber: orderNum, order_number: orderNum, total: payload.total || 0, order: resOrder };
    }

    try {
      // Resolve any non-UUID product IDs (e.g. from homepage quick-add or slug identifiers)
      const isUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const formattedItems = [];
      for (const item of (payload.items || [])) {
        let prodId = item.id;
        if (!isUuidRegex.test(prodId)) {
          const lookupSlug = (item.slug || String(prodId).replace(/^home_/, '')).toLowerCase().trim();
          const { data: foundProd } = await supabaseClient
            .from('products')
            .select('id')
            .eq('slug', lookupSlug)
            .maybeSingle();
          if (foundProd && foundProd.id) {
            prodId = foundProd.id;
          }
        }
        formattedItems.push({
          product_id: prodId,
          variant: item.variant || null,
          qty: item.qty
        });
      }

      // Format payload for PostgreSQL place_order(payload jsonb) RPC
      const rpcPayload = {
        customer_name: payload.customer.name,
        phone: payload.customer.phone,
        whatsapp: payload.customer.whatsapp || null,
        email: payload.customer.email || null,
        city: payload.customer.city,
        address: payload.customer.address,
        landmark: payload.customer.landmark || null,
        notes: payload.customer.notes || null,
        payment_method: payload.payment.method,
        payment_ref: payload.payment.transactionId || null,
        coupon_code: payload.coupon || null,
        idempotency_key: payload.idempotencyKey || null,
        items: formattedItems
      };

      const { data, error } = await supabaseClient.rpc('place_order', { payload: rpcPayload });
      if (error) {
        throw new Error(error.message || 'Failed to place order');
      }

      const orderNum = data.order_number;
      const resOrder = {
        orderNumber: orderNum,
        date: new Date().toISOString(),
        paymentMethod: payload.payment.method,
        customer: payload.customer,
        items: payload.items,
        subtotal: payload.subtotal,
        deliveryCharge: payload.deliveryCharge,
        discount: payload.discount || 0,
        total: data.total
      };

      return {
        success: true,
        orderNumber: orderNum,
        order_number: orderNum,
        total: data.total,
        order_id: data.order_id,
        order: resOrder
      };
    } catch (err) {
      console.error('place_order RPC error:', err);
      throw err;
    }
  },

  // Validate coupon -> validate_coupon RPC
  async validateCoupon(code, subtotal) {
    if (!code || !code.trim()) return 0;
    const cleanCode = code.trim().toUpperCase();

    if (!isLiveSupabase()) {
      if (cleanCode === 'WELCOME10') {
        if (subtotal < 2000) throw new Error('Minimum order of Rs. 2,000 required for WELCOME10');
        return Math.round(subtotal * 0.1);
      }
      if (cleanCode === 'HAIDER500') {
        if (subtotal < 5000) throw new Error('Minimum order of Rs. 5,000 required for HAIDER500');
        return Math.min(500, subtotal);
      }
      throw new Error('Invalid or expired coupon code');
    }

    try {
      const { data, error } = await supabaseClient.rpc('validate_coupon', {
        p_code: cleanCode,
        p_subtotal: subtotal
      });

      if (error) {
        // Strip Postgres exception prefixes if present
        const msg = error.message.replace(/^INVALID_COUPON:\s*/, '');
        throw new Error(msg);
      }
      return data || 0;
    } catch (err) {
      const msg = err.message ? err.message.replace(/^INVALID_COUPON:\s*/, '') : 'Invalid coupon code';
      throw new Error(msg);
    }
  },

  // Reviews: fetch approved reviews
  async getReviews(productId) {
    if (!productId) return [];

    if (!isLiveSupabase()) {
      return [
        {
          name: 'Hamza Tariq',
          rating: 5,
          date: '3 days ago',
          city: 'Lahore',
          comment: 'MashaAllah outstanding quality! The balance and punch are top tier. Delivery took only 2 days to Gulberg Lahore. Highly recommended store.'
        },
        {
          name: 'Zeeshan Malik',
          rating: 5,
          date: '1 week ago',
          city: 'Karachi',
          comment: 'Original brand packaging with genuine stickers. Exactly what was shown in the pictures. The cash on delivery process was smooth.'
        },
        {
          name: 'Bilal Ahmed',
          rating: 4,
          date: '2 weeks ago',
          city: 'Islamabad',
          comment: 'Very comfortable feel and high durability. Great customer service when I contacted them on WhatsApp for size advice.'
        }
      ];
    }

    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(r => ({
        name: r.name,
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        comment: r.comment
      }));
    } catch (err) {
      console.warn('Reviews fallback:', err);
      return [];
    }
  },

  // Reviews: submit new review (is_approved = false)
  async addReview({ productId, name, rating, comment }) {
    if (!productId || !name || !rating || !comment) {
      throw new Error('Please fill in all review fields.');
    }

    if (!isLiveSupabase()) {
      await new Promise(r => setTimeout(r, 400));
      return { success: true, message: 'Your review has been submitted and will appear after approval.' };
    }

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .insert({
          product_id: productId,
          name: name.trim(),
          rating: parseInt(rating, 10),
          comment: comment.trim(),
          is_approved: false
        });

      if (error) throw error;
      return { success: true, message: 'Your review has been submitted and will appear after approval.' };
    } catch (err) {
      console.error('Review submit error:', err);
      throw new Error(err.message || 'Could not submit review');
    }
  },

  // Delivery fee calculator aligning with database RPC calculation and admin settings
  getDeliveryCharge(city = '', subtotal = 0) {
    if (this._cachedSettings && this._cachedSettings.delivery) {
      const d = this._cachedSettings.delivery;
      const freeAbove = Number(d.freeAbove ?? 5000);
      if (subtotal >= freeAbove) return 0;
      const flatRate = Number(d.flatRate ?? 250);
      if (city && d.cityRates && typeof d.cityRates === 'object') {
        const normCity = String(city).trim().toLowerCase();
        for (const [k, v] of Object.entries(d.cityRates)) {
          if (k.toLowerCase() === normCity) return Number(v);
        }
      }
      return flatRate;
    }
    return subtotal >= 5000 ? 0 : 250;
  },

  // Fetch store settings
  async getSettings() {
    if (!isLiveSupabase()) {
      return window.DUMMY_SETTINGS || null;
    }

    try {
      const { data, error } = await supabaseClient.from('settings').select('*').limit(1).maybeSingle();
      if (error || !data) return window.DUMMY_SETTINGS;
      this._cachedSettings = data;
      return data;
    } catch (err) {
      return window.DUMMY_SETTINGS;
    }
  },

  // Fetch dynamic home content
  async getHomeContent() {
    if (!isLiveSupabase()) return null;

    try {
      const [homeRes, featRes] = await Promise.all([
        supabaseClient.from('home_content').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabaseClient.from('products').select('*, product_images(*), product_variants(*)').eq('is_featured', true).eq('is_active', true).limit(8)
      ]);

      return {
        blocks: homeRes.data || [],
        featuredProducts: (featRes.data || []).map(normalizeProduct)
      };
    } catch (err) {
      return null;
    }
  }
};

// Global count helper used by shop router
if (typeof countProducts === 'undefined') {
  var countProducts = function(node) {
    if (!node) return 0;
    if (node.children && node.children.length > 0) {
      return node.children.reduce((acc, c) => acc + countProducts(c), (node.productCount || 0));
    }
    if (node.products) return node.products.length;
    if (typeof node.productCount === 'number') return node.productCount;
    return 0;
  };
} else {
  countProducts = function(node) {
    if (!node) return 0;
    if (node.children && node.children.length > 0) {
      return node.children.reduce((acc, c) => acc + countProducts(c), (node.productCount || 0));
    }
    if (node.products) return node.products.length;
    if (typeof node.productCount === 'number') return node.productCount;
    return 0;
  };
}

if (typeof window !== 'undefined') {
  window.api = api;
}

