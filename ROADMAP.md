# Rashy Cricket Store: Roadmap aur Prompts

Faisle:
- **Customer login/register nahi hoga.** Har koi bina account ke order karega (guest checkout).
- **Backend: Supabase** (database, admin login, photos ka storage).
- **Admin panel** mein login hoga, magar sirf admin ke liye.

---

## 1. Status: kya ban gaya

| Cheez | File | Haalat |
|---|---|---|
| Home page | `index.html`, `js/main.js` | ✅ Mukammal (Live Supabase + dynamic content) |
| Shop page: nested collections, breadcrumbs, sidebar, sorting | `shop.html`, `js/shop.js` | ✅ Mukammal (Live catalog + leaf categories) |
| Product detail + variants + stock | `product.html`, `js/product.js` | ✅ Mukammal |
| Real Cart (localStorage + live checkout sync) | `cart.html`, `js/cart.js`, `common.js` | ✅ Mukammal |
| Checkout (COD & Bank Transfer with server validation) | `checkout.html`, `js/checkout.js` | ✅ Mukammal |
| Order Success + WhatsApp confirmation | `order-success.html` | ✅ Mukammal |
| Live Search + instant suggestions | `search.html`, `js/search.js` | ✅ Mukammal |
| Wishlist (localStorage + live drawer) | `wishlist.html`, `js/wishlist.js` | ✅ Mukammal |
| Order Tracking (RPC live status & history) | `order-tracking.html`, `js/order-tracking.js` | ✅ Mukammal |
| Contact form + Newsletter subscribers | `contact.html`, `js/contact.js` | ✅ Mukammal |
| About & Policy pages + Custom 404 | `about.html`, `privacy.html`, `terms.html`, `404.html` | ✅ Mukammal |
| Blog & Cricket Guides | `blog.html`, `post.html`, `js/blog.js` | ✅ Mukammal |
| Supabase Backend & Database Schema | `supabase/schema.sql` (23 collections, 14 products, RPCs, RLS) | ✅ Mukammal |
| Admin Panel: Login & Shell Layout | `admin/index.html`, `admin/css/admin.css`, `admin/js/admin-common.js` | ✅ Mukammal |
| Admin Panel: Dashboard & Analytics | `admin/dashboard.html`, `admin/js/dashboard.js` (Chart.js) | ✅ Mukammal |
| Admin Panel: Nested Collections Manager | `admin/collections.html`, `admin/js/collections.js` | ✅ Mukammal |
| Admin Panel: Products Manager & Editor | `admin/products.html`, `admin/product-edit.html`, `admin/js/product-edit.js` | ✅ Mukammal |
| Admin Panel: Orders Manager & Invoicing | `admin/orders.html`, `admin/order-detail.html`, `admin/js/orders.js` | ✅ Mukammal |
| Admin Panel: Customer Directory & Lifetime Profiles | `admin/customers.html`, `admin/js/customers.js` | ✅ Mukammal |
| Admin Panel: Home Page Content Manager | `admin/home-content.html`, `admin/js/home-content.js` | ✅ Mukammal |
| Admin Panel: Coupons & Discounts | `admin/coupons.html`, `admin/js/coupons.js` | ✅ Mukammal |
| Admin Panel: Reviews Moderation | `admin/reviews.html`, `admin/js/reviews.js` | ✅ Mukammal |
| Admin Panel: Blog Manager & Editor | `admin/blog.html`, `admin/blog-edit.html`, `admin/js/blog.js` | ✅ Mukammal |
| Admin Panel: Messages & Subscribers | `admin/messages.html`, `admin/js/messages.js` | ✅ Mukammal |
| Admin Panel: Store Settings & Delivery | `admin/settings.html`, `admin/js/settings.js` | ✅ Mukammal |
| SEO, Robots, Sitemap & Speed | `robots.txt`, `sitemap.xml`, meta tags, JSON-LD | ✅ Mukammal |
| Deployment & Production Security | `_redirects`, `netlify.toml`, CSP headers | ✅ Mukammal |
| Admin Owner Guide (Roman Urdu) | `admin/GUIDE.md`, `admin/guide.html` | ✅ Mukammal |

## 2. All 29 Prompts: Completed! 🚀

---

## 3. Prompts kaise use karein

1. Har prompt se pehle neeche wala **"Common Context"** block copy karein, phir us task ka prompt.
2. Ek waqt mein ek prompt. Kaam hone ke baad browser mein khud check karein, phir agla.
3. Prompts English mein hain kyunki AI inhe zyada theek samajhta hai. Jawab Urdu mein chahiye to aakhir mein likh dein: *"Reply in Roman Urdu."*

---

## 4. Common Context (har prompt se pehle paste karein)

```text
PROJECT CONTEXT
- Project: "Rashy", a cricket & sports e-commerce website for Pakistan. Folder: haiderwebfinal.
- Stack: plain HTML + CSS + vanilla JavaScript (no framework, no build step). Backend: Supabase (Postgres, Auth for admin only, Storage for images), used via supabase-js v2 from a CDN.
- No customer login/register. Customers check out as guests (name + phone + address). Only the admin logs in.
- Currency: PKR, shown as "Rs. 12,500" using the existing rs() helper. Main payment: Cash on Delivery.
- Existing files:
  - index.html (home), shop.html (nested collections shop: URL hash like shop.html#/cricket/bats/english-willow)
  - css/style.css: all styles. CSS variables in :root (--primary #f15a24 orange, --dark #111, --pink, --blue, --radius 14px). Fonts: "Exo 2" headings, "Poppins" body. Font Awesome 6.5.1 icons.
  - js/data.js: dummy CATALOG tree + PHOTO ids + `api` object (getTree, getCollection). This `api` object is the ONLY place the data source should change.
  - js/common.js: shared helpers img(), rs(), esc(), productCard(), showToast(), cart/wishlist click handlers, sticky header, mobile menu, newsletter, footer year.
  - js/main.js: home page only. js/shop.js: shop page only.
- Every page uses the same header + footer markup as shop.html (copy it), and loads js/data.js, js/common.js, then its own page script.
- Design rules: match the existing look exactly (orange/black, rounded cards, pill buttons .btn .btn--primary / .btn--dark, section headings with .subtitle + h2). Mobile-first responsive (test at 375px, 768px, 1440px). No horizontal scroll.
- Code rules: match existing code style (small functions, template strings, comments only where needed). Always escape user/DB text with esc() before putting it in HTML. No new libraries unless the prompt says so.
- When done: list the files you changed, and how I can test it in the browser.
```

---

## 5. Prompts: customer side (dummy data pe)

### Prompt 1: Product IDs aur Product Detail page

```text
TASK: Build the product detail page.

1. Data changes (js/data.js):
   - Give every product a unique `id` and a URL-safe `slug` (generate slug from name; make unique if duplicates).
   - Add optional fields: `images` (array of photo ids, first = main), `description` (2-3 sentences), `stock` (number), `variants` (optional), e.g. bats: { label: "Weight", options: ["1100g","1150g","1200g"] }, shirts/trousers: { label: "Size", options: ["S","M","L","XL"] }.
   - Add api.getProduct(slug) -> { product, trail } (trail = collection path so we can show breadcrumbs), and api.getRelated(slug, limit=4) -> products from the same collection.
2. productCard() in common.js: link the image and name to product.html?slug=<slug>.
3. New product.html + js/product.js:
   - Page banner with breadcrumbs: Home > Shop > Cricket > Bats > ... > Product name (collections clickable, linking to shop.html#/...).
   - Left: main image + thumbnail strip (click thumbnail = change main image, zoom on hover on desktop).
   - Right: name, rating stars, price (old price struck through + discount badge), stock status ("In stock" green / "Only 3 left" orange / "Out of stock" red and disable buttons), short description, variant selector as pill buttons (required before adding to cart; show error if not selected), quantity stepper (min 1, max stock), "Add To Cart" and "Buy Now" buttons, WhatsApp "Order on WhatsApp" button (wa.me link with product name + variant + qty pre-filled; WhatsApp number from a single constant in common.js).
   - Below: tabs: Description / Delivery & Returns (COD all over Pakistan, 7 days return) / Reviews (static dummy reviews for now).
   - "Related Products" grid using productCard().
   - Unknown slug -> friendly "Product not found" with a button back to shop.
   - Update document.title and meta description per product.
4. For now "Add To Cart" can keep using the existing counter. Prompt 2 builds the real cart.

DONE WHEN: clicking any product on home or shop opens its detail page with correct data, breadcrumbs work, variant + quantity work, works on mobile.
```

### Prompt 2: Asli Cart (localStorage) + Cart drawer + Cart page

```text
TASK: Build a real cart that survives page refresh. No login, so store it in localStorage.

1. In js/common.js create a small cart module:
   - Cart item: { id, slug, name, img, price, variant (string or null), qty }. Same product + same variant = same line (increase qty).
   - Functions: cart.get(), cart.add(product, variant, qty), cart.setQty(lineKey, qty), cart.remove(lineKey), cart.clear(), cart.count(), cart.subtotal().
   - Save to localStorage key "rashy_cart"; wrap localStorage in try/catch (site must still work if storage is blocked).
   - Update the header #cartCount badge on every page load and every change. Sync across tabs using the "storage" event.
2. Replace the old counter logic: every "Add To Cart" (productCard buttons, product page) uses cart.add. Product cards need data-id so we can find the product (add api.getProductById(id) in data.js).
3. Cart drawer: clicking the header cart icon opens a slide-in panel from the right (dark overlay behind, close on X / overlay click / Esc). Shows items (image, name, variant, price, qty stepper, remove), subtotal, buttons "View Cart" and "Checkout". Empty state with "Continue Shopping".
4. New cart.html + js/cart.js: full cart page with a table on desktop and stacked cards on mobile, qty stepper, remove, "Clear cart", order summary box (subtotal, delivery charges "calculated at checkout", total), coupon code input (UI only for now, show "Coupons coming soon"), "Proceed to Checkout" button.
5. When the cart is empty, the Checkout button is disabled.

DONE WHEN: add items from different pages, refresh: cart is still there; qty and remove work in both drawer and cart page; badge always correct.
```

### Prompt 3: Checkout page (guest, COD)

```text
TASK: Build checkout.html + js/checkout.js (guest checkout, no account).

1. Form (left side):
   - Full name (required), Phone (required, Pakistani format 03XXXXXXXXX: validate and normalize), WhatsApp number (optional, checkbox "same as phone"), Email (optional), City (select with major Pakistani cities + "Other" with text field), Full address (required), Nearest landmark (optional), Order notes (optional).
   - Payment method: radio cards: "Cash on Delivery" (default). Also show "Bank Transfer / JazzCash / EasyPaisa" as an option that displays account details from a settings constant and asks for transaction ID (optional field).
   - Inline validation messages under each field; scroll to the first error on submit.
2. Order summary (right side, sticky on desktop): items from the cart (image, name, variant, qty, line total), subtotal, delivery charges, discount (0 for now), total.
   - Delivery charges come from a settings object in data.js: e.g. { flatRate: 250, freeAbove: 5000, cityRates: { Karachi: 200 } }. Recalculate when city changes.
3. Place order button:
   - For now (dummy mode) add api.placeOrder(orderData) in data.js that returns a fake order number like "RS-10234" after 800ms (simulate network). Show a loading spinner on the button and prevent double submit.
   - On success: clear cart, save the last order summary in sessionStorage, redirect to order-success.html?order=RS-10234.
   - On error: show the error message and keep the form data.
4. Empty cart -> redirect to cart.html.
5. Remember the customer's details in localStorage (name, phone, city, address) so the form is pre-filled next time (with a "Not you? Clear" link).

DONE WHEN: full flow cart -> checkout -> success works; validation catches bad phone numbers; delivery charge changes with city.
```

### Prompt 4: Order Success page

```text
TASK: Build order-success.html + js/order-success.js.

- Big success icon + "Thank you, <name>! Your order is placed."
- Order number (large, with a copy button), date, payment method, delivery address, items list, totals: read from sessionStorage saved by checkout (if missing, show just the order number from the URL).
- "What happens next" steps: 1) We call/WhatsApp you to confirm 2) Order is packed & shipped 3) Delivered in 3-5 working days, pay on delivery.
- Buttons: "Track Your Order" (order-tracking.html?order=...), "Continue Shopping", and "Confirm on WhatsApp" (wa.me link with order number pre-filled).
- Page must not be indexed (meta robots noindex).

DONE WHEN: after checkout I land here with all my order details shown.
```

### Prompt 5: Search

```text
TASK: Add product search.

1. Header search icon opens a full-width search overlay (input autofocused, close on Esc / X).
2. Live suggestions as the user types (debounce 250ms, min 2 characters): top 6 matching products (image, name, price) + matching collections (name + path like "Cricket > Bats"). Arrow keys + Enter to navigate suggestions.
3. Pressing Enter / "See all results" goes to shop.html#/search?q=<term>. Teach js/shop.js to render a search results view there: title "Search: <term>", breadcrumb Home > Shop > Search, product grid with sorting, empty state with suggestions ("Try: bat, ball, helmet").
4. Add api.search(term) in data.js: case-insensitive match on product name, description and collection names; ignore extra spaces; rank name matches first.

DONE WHEN: searching "willow", "ball", "helmet" gives correct results from any page.
```

### Prompt 6: Wishlist page

```text
TASK: Make the wishlist real (localStorage, no login).

- In common.js add a wishlist module (store product ids in localStorage "rashy_wishlist", try/catch).
- Heart buttons on product cards and product page toggle the wishlist and show a filled heart if the product is already saved (also after refresh / on every page).
- Header heart badge shows the real count; clicking it opens wishlist.html.
- New wishlist.html + js/wishlist.js: product grid of saved items with "Remove" and "Add To Cart" (if the product has variants, link to the product page instead), "Add all to cart", and an empty state.

DONE WHEN: wishlist survives refresh and badge is correct on every page.
```

### Prompt 7: Order Tracking page

```text
TASK: Build order-tracking.html + js/order-tracking.js (no login, so customer proves ownership with order number + phone).

- Form: Order number + Phone number. Pre-fill order number from ?order= in the URL.
- Add api.trackOrder(orderNumber, phone) in data.js returning dummy data: { orderNumber, status, createdAt, items, total, statusHistory: [{status, at}] } or null.
- Result: visual progress timeline: Pending -> Confirmed -> Shipped -> Delivered (current step highlighted in orange, done steps with check icon, dates under each). Cancelled/Returned shown as a red banner instead. Show items and total. If shipped, show courier name + tracking number if available.
- Wrong number/phone: "No order found with these details" (do not reveal whether the order number exists).

DONE WHEN: the dummy order can be found and the timeline renders correctly on mobile.
```

### Prompt 8: Contact aur About pages

```text
TASK: Build contact.html and about.html.

contact.html (+ js/contact.js):
- Page banner + breadcrumbs. Info cards: Phone, WhatsApp, Email, Shop address, Opening hours (all from one constant in common.js so they're easy to change).
- Contact form: name, phone, email (optional), subject, message; validation; submit calls api.sendMessage(data) (dummy in data.js, resolves after 600ms), success toast, reset form.
- Embedded Google Map iframe (placeholder location, lazy loaded) and a big "Chat on WhatsApp" button.

about.html:
- Banner, "Our Story" section (image + text), stats row (e.g. 5000+ happy customers, 300+ products, 50+ cities: animate counting up when scrolled into view), "Why choose us" 4 cards (Original quality, COD all over Pakistan, Easy returns, Expert advice), a short team/founder block, and a call-to-action banner to the shop.

Update header nav and footer links on ALL pages to point to these pages.

DONE WHEN: both pages look like the rest of the site and the form shows success.
```

### Prompt 9: Policy pages + 404

```text
TASK: Build policy pages and a 404 page.

- Create one reusable layout: banner + breadcrumbs + a readable content column (max-width ~800px, good line height, h2/h3/ul styles) + a side box "Need help? WhatsApp us".
- Pages: return-policy.html, shipping-policy.html, privacy-policy.html, terms.html. Write sensible placeholder content for a Pakistani COD sports store (7-day returns on unused items, bats are not returnable once used/knocked-in, delivery 3-5 working days, charges by city, etc.). Mark each page with a "Last updated" date.
- 404.html: big "404", cricket-themed line ("That one went out of the ground!"), search box, buttons to Home and Shop.
- Link all policy pages from the footer on every page.

DONE WHEN: all footer links work and pages are readable on mobile.
```

### Prompt 10: Blog list + Blog post

```text
TASK: Build the blog.

- Add BLOG_POSTS dummy data in data.js (6 posts: slug, title, excerpt, cover image, author, date, category, read time, content as simple HTML paragraphs/headings) and api.getPosts({ page, category }) + api.getPost(slug).
- blog.html + js/blog.js: banner, category filter pills, post cards grid (reuse the .news__card style from home), pagination (6 per page).
- post.html + js/post.js: cover image, title, meta (author, date, read time), content with nice typography, share buttons (WhatsApp, Facebook, copy link), "Related posts", and "Shop the gear" product strip (3-4 products).
- Home page "Latest News" section: render the 3 newest posts from api.getPosts and link to post.html?slug=...

DONE WHEN: home -> blog post works, blog list filters and paginates.
```

---

## 6. Prompts: Supabase backend

> **Supabase se pehle aapko khud karna hai:** [supabase.com](https://supabase.com) pe free account aur naya project banayen (region: Mumbai ya Singapore). Phir **Project Settings → API** se `Project URL` aur `anon public key` copy karke AI ko dein. **`service_role` key kabhi frontend ya chat mein na dein.**

### Prompt 11: Database schema, security (RLS), storage

```text
TASK: Write the complete Supabase SQL (one file: supabase/schema.sql) that I will run in the Supabase SQL editor. Explain each part briefly.

Tables (uuid primary keys, created_at/updated_at timestamps with an update trigger):
- collections: id, parent_id (self reference, null = top level, on delete restrict), name, slug (unique per parent), image_url, sort_order, is_active.
- products: id, collection_id (must be a LEAF collection: enforce with a trigger), name, slug (unique), description, price (integer PKR), compare_at_price (nullable), tag (nullable: 'New','Hot' or auto discount), stock, is_active, is_featured, sort_order.
- product_images: id, product_id, url, sort_order.
- product_variants: id, product_id, label (e.g. 'Weight'), value (e.g. '1150g'), price_override (nullable), stock.
- orders: id, order_number (unique, human readable like RS-10234 from a sequence), customer_name, phone, whatsapp, email, city, address, landmark, notes, payment_method ('cod','bank'), payment_ref, subtotal, delivery_charge, discount, total, coupon_code, status ('pending','confirmed','shipped','delivered','cancelled','returned'), courier, tracking_number, admin_notes.
- order_items: id, order_id, product_id (nullable on delete set null), product_name, variant, price, qty, line_total (snapshot values so old orders never change).
- order_status_history: id, order_id, status, note, created_at.
- coupons: id, code (unique, uppercase), type ('percent','fixed'), value, min_order, max_uses, used_count, starts_at, ends_at, is_active.
- reviews: id, product_id, name, rating 1-5, comment, is_approved (default false).
- blog_posts: id, slug, title, excerpt, cover_url, content (html), category, author, is_published, published_at.
- home_content: id, section ('hero','category_slider','offer'), data jsonb, sort_order, is_active.
- settings: single row: store_name, phone, whatsapp, email, address, delivery jsonb ({ flatRate, freeAbove, cityRates }), bank_details jsonb, social jsonb.
- messages (contact form), subscribers (newsletter, unique email).
- admins: user_id (references auth.users) - list of who is an admin.

Functions:
- is_admin(): returns true if auth.uid() is in admins.
- place_order(payload jsonb): SECURITY DEFINER. Takes customer details + [{product_id, variant, qty}] + coupon_code. Re-reads prices FROM THE DATABASE (never trust client prices), checks is_active and stock, validates the coupon, calculates delivery from settings, inserts order + items + first status history row, decreases stock, increments coupon used_count, all in one transaction. Returns { order_number, total }. Raises clear errors ('OUT_OF_STOCK: <name>', 'INVALID_COUPON').
- track_order(p_order_number text, p_phone text): SECURITY DEFINER. Returns status, dates, items, totals, courier, tracking number and status history ONLY if both match; otherwise returns nothing.
- validate_coupon(code text, subtotal int): returns discount amount or an error.
- Add a rate-limit friendly design note (e.g. max 5 orders per phone per hour inside place_order).

Row Level Security (enable on ALL tables):
- Public (anon) can SELECT only active collections/products/images/variants, approved reviews, published blog posts, active home_content, and settings.
- Public can INSERT into messages, subscribers and reviews (is_approved forced to false), nothing else.
- Public can NOT select/insert/update orders directly (only through place_order / track_order).
- Admin (is_admin()) can do everything on every table.

Storage: a public bucket "images" (public read, only admins can upload/update/delete; max 5MB; only image mime types).

Also: indexes on foreign keys, slug and order_number; seed SQL that inserts the CURRENT dummy CATALOG from js/data.js (collections tree + products + images) and default settings, so the site looks the same after switching.

Finally tell me step by step: where to paste the SQL, and how to make my own user an admin (create user in Authentication -> Users, then insert its id into admins).
```

### Prompt 12: Website ko Supabase se jorna

```text
TASK: Switch the customer website from dummy data to Supabase. Supabase URL: <PASTE_URL>, anon key: <PASTE_ANON_KEY>.

1. Create js/config.js with SUPABASE_URL and SUPABASE_ANON_KEY (anon key is safe in the frontend because RLS protects data). Load supabase-js v2 from cdn.jsdelivr.net (pinned version) on every page, before data.js.
2. Rewrite ONLY the `api` object in js/data.js so every function (getTree, getCollection, getProduct, getProductById, getRelated, search, getPosts, getPost, sendMessage, trackOrder, placeOrder, settings, home content) reads from Supabase and returns EXACTLY the same shapes the pages already use. Keep the dummy CATALOG in a separate file js/dummy-data.js as a fallback for development (switch with a USE_DUMMY flag in config.js).
   - Build the collection tree from the flat collections table (parent_id) in one query, cache it in memory for the page.
   - Product counts per collection: compute from products (one query), not one query per collection.
   - Images: use the Supabase public URL. Update img() in common.js to accept either a full URL or the old Unsplash id.
3. Home page: hero slides, category slider cards, offer countdown (end date from DB), featured products and latest blog posts all come from Supabase (home_content, products.is_featured, blog_posts).
4. Loading states: skeleton cards while loading; friendly error box with "Retry" if the network fails. No page should break if Supabase is down.
5. Keep all existing features working (sorting, breadcrumbs, cart, wishlist, search).

DONE WHEN: with USE_DUMMY=false the site shows data from Supabase, and changing a product price in the Supabase table editor changes it on the site after refresh.
```

### Prompt 13: Order Supabase mein save karna

```text
TASK: Connect checkout, coupons, tracking, contact form and newsletter to Supabase.

- checkout: api.placeOrder calls the place_order RPC. Send only product ids, variants, qty, coupon and customer details (never prices). Show the server's total on the success page. Handle errors nicely: OUT_OF_STOCK -> tell the customer which item and update the cart; INVALID_COUPON -> show under the coupon field; network error -> retry message. Prevent double orders (disable button + idempotency: send a client-generated uuid and make place_order ignore duplicates).
- cart + checkout coupon field: call validate_coupon and show the discount live.
- order-tracking: use the track_order RPC.
- contact form -> messages table; footer newsletter -> subscribers (handle "already subscribed" duplicate gracefully).
- product page reviews: show approved reviews from DB + a "Write a review" form (name, rating stars, comment) that inserts with is_approved=false and says "Your review will appear after approval".

DONE WHEN: I place an order on the site and see it (with items) in the Supabase orders table, and can track it with order number + phone.
```

---

## 7. Prompts: Admin panel

> Admin panel ek alag folder `admin/` mein hoga: `admin/index.html` login, `admin/dashboard.html` waghera. Design website wala hi rahega.

### Prompt 14: Admin login + layout

```text
TASK: Build the admin panel shell and login.

- Folder admin/ with its own admin/css/admin.css (reuse the same CSS variables, fonts, buttons from css/style.css) and admin/js/admin-common.js.
- admin/index.html: login page (email + password) using Supabase Auth signInWithPassword. After login check is_admin() (RPC). Not an admin -> sign out and show "Access denied". Show/hide password toggle, loading state, error messages. "Forgot password" -> Supabase reset email.
- Shared layout for all admin pages (generated by admin-common.js so it's written once): left sidebar (logo, links with icons: Dashboard, Orders (with pending count badge), Products, Collections, Customers, Home Content, Coupons, Reviews (pending badge), Blog, Messages (unread badge), Settings, "View Store" opens site in new tab, Logout), top bar with page title + admin email. Sidebar collapses to a hamburger drawer on mobile.
- Auth guard: every admin page redirects to admin/index.html if not logged in or not admin. Session persists (Supabase handles it).
- Shared admin UI helpers in admin-common.js: toast, confirm dialog (for deletes), modal, data table helper (search box, sort by column, pagination 20/page), loading skeleton, empty state, image upload helper (upload to the "images" bucket with a unique file name, show preview + progress, return public URL), slug generator.
- All pages: <meta name="robots" content="noindex">.

DONE WHEN: only my admin account can enter; a non-admin account is rejected; layout works on mobile.
```

### Prompt 15: Dashboard

```text
TASK: Build admin/dashboard.html.

- Stat cards: Today's sales (Rs.), Today's orders, Pending orders, This month's sales, Total products, Low stock products (stock <= 5).
- Sales chart: last 30 days revenue per day (bar or line) using Chart.js from cdnjs (pinned version); exclude cancelled/returned orders.
- "Recent orders" table (last 10: order number, customer, city, total, status badge, time ago) -> click opens the order.
- "Low stock" list with quick link to edit the product.
- "Top selling products" (last 30 days, from order_items).
- Date range filter (Today / 7 days / 30 days / This month) that updates the cards and chart.
- Do aggregation with SQL (create Postgres functions/views if needed, admin-only) instead of downloading all orders.

DONE WHEN: numbers match what's in the orders table.
```

### Prompt 16: Collections manager (nested tree)

```text
TASK: Build admin/collections.html to manage nested collections.

- Show collections as an expandable tree (like the shop sidebar): name, image thumbnail, product count, active/hidden badge, actions (Add sub-collection, Edit, Delete).
- Add/Edit in a modal: name, slug (auto from name, editable), parent (dropdown showing the full path, e.g. "Cricket > Bats"; cannot choose itself or its own children), image upload, sort order, active toggle.
- Reorder siblings with drag & drop (or up/down buttons) and save sort_order.
- Delete rules: cannot delete a collection that has sub-collections or products; show a clear message saying what to move first.
- A collection that has products cannot get sub-collections (products must live in the last level); explain this in the UI.
- Search box to find a collection in the tree.

DONE WHEN: I can create Cricket > Bats > English Willow from the admin and see it immediately on the shop page with correct breadcrumbs.
```

### Prompt 17: Products manager

```text
TASK: Build admin/products.html (list) and admin/product-edit.html (add/edit).

List:
- Table: thumbnail, name, collection path, price (+ old price), stock (red if <= 5), status (active/hidden), featured star, actions (Edit, Duplicate, Delete).
- Search, filter by collection (tree dropdown), status and stock (in/low/out), sort, pagination. Bulk select -> hide/show/delete.
- Quick inline edit for price and stock.

Add/Edit page:
- Name, slug (auto), collection (only leaf collections selectable, shown as full path), description (simple rich text: bold, lists, links; use a small editor or contenteditable with basic buttons), price, compare-at price (show calculated discount %), tag, stock, active, featured.
- Images: multi-upload with drag & drop, previews, drag to reorder (first = main), delete.
- Variants: add rows (label + value + optional price override + stock), e.g. Weight 1100g/1150g/1200g.
- Validation (required fields, price > 0, unique slug), "Save" and "Save & add another", unsaved-changes warning when leaving the page.
- "View on site" link after saving.

DONE WHEN: a product added here appears in the right shop collection with its images and variants.
```

### Prompt 18: Orders manager

```text
TASK: Build admin/orders.html (list) and admin/order.html?id=... (detail).

List:
- Tabs with counts: All, Pending, Confirmed, Shipped, Delivered, Cancelled, Returned.
- Table: order number, date, customer name, phone, city, items count, total, payment method, status badge.
- Search by order number / name / phone; filter by date range and city; pagination; export current filter to CSV.
- New orders: poll every 60 seconds (or use Supabase realtime) and show a toast + sound "New order received".

Detail:
- Customer info with buttons: Call (tel:), WhatsApp (wa.me with a pre-written message: order confirmation including items and total), copy address.
- Items table (snapshot names/prices), subtotal, delivery, discount, total, coupon.
- Change status with a note -> writes order_status_history; when moving to Shipped ask for courier + tracking number. Cancelling/returning an order asks whether to put stock back.
- Status history timeline, admin notes (private).
- Print invoice / packing slip (print-friendly CSS: store logo, order number, customer address, items, total, "Cash on Delivery: collect Rs. X").

DONE WHEN: I can take an order from Pending to Delivered, the customer's tracking page shows each step, and the invoice prints cleanly on A4.
```

### Prompt 19: Customers

```text
TASK: Build admin/customers.html. There are no customer accounts, so customers = unique phone numbers from orders.

- Create an admin-only SQL view/function that groups orders by normalized phone: name (latest), phone, city, total orders, total spent (excluding cancelled), last order date.
- Table with search, sort (most spent, most orders, latest) and pagination; CSV export.
- Click a customer -> side panel with all their orders (links to the order page) and WhatsApp/Call buttons.
- Flag repeat customers (3+ orders) with a badge; flag phones with 2+ cancelled/returned orders as "risky" (useful for COD).

DONE WHEN: the list matches the orders in the database.
```

### Prompt 20: Home page content manager

```text
TASK: Build admin/home-content.html so the home page can be changed without code.

Sections (each stored in home_content):
- Hero slides: add/edit/delete/reorder; image upload, subtitle, title, button text, button link (pick a collection or product, or custom URL), active toggle.
- Category slider cards: same idea: title, subtitle, image, background colour (choose from the site's colour set: orange, blue, dark, pink, green, yellow), link to a collection.
- Offer section: title, subtitle, image, end date/time for the countdown, button link, show/hide.
- Featured products: search & pick products, drag to order (uses products.is_featured + sort).
- Live preview link: "Open home page" in a new tab.

DONE WHEN: changing a hero slide here changes the home page after refresh.
```

### Prompt 21: Coupons

```text
TASK: Build admin/coupons.html.

- Table: code, type (percent/fixed), value, min order, used / max uses, valid dates, status (Active / Scheduled / Expired / Disabled computed from dates and flag).
- Add/Edit modal with validation (code uppercase, no spaces, unique; percent 1-100; end date after start date). "Generate code" button.
- Enable/disable toggle, delete (only if never used; otherwise just disable).

DONE WHEN: a coupon created here works at checkout and its used count goes up after an order.
```

### Prompt 22: Reviews

```text
TASK: Build admin/reviews.html.

- Tabs: Pending, Approved, All, with counts. Each review: product (thumbnail + link), name, star rating, comment, date.
- Actions: Approve, Unapprove, Delete; bulk approve/delete.
- Filter by rating and product; search text.
- Product page shows the average rating and count from approved reviews only (update the product page/card stars to use real data).

DONE WHEN: a review written on the site appears here as pending and shows on the product page after approval.
```

### Prompt 23: Blog manager

```text
TASK: Build admin/blog.html (list) and admin/blog-edit.html.

- List: cover thumbnail, title, category, status (Draft/Published), published date, actions (Edit, View, Delete).
- Editor: title, slug (auto), category, author, excerpt, cover image upload, content editor (headings, bold, italic, lists, links, images uploaded to storage), publish toggle + publish date, SEO fields (meta title, meta description) with character counters.
- Preview button opens post.html with the draft (admin only).

DONE WHEN: a post published here shows on the blog page and home "Latest News".
```

### Prompt 24: Messages aur Subscribers

```text
TASK: Build admin/messages.html with two tabs.

- Messages (contact form): list with unread in bold, open in a side panel, mark read/unread, reply buttons (WhatsApp / email mailto with subject pre-filled), delete. Unread count badge in the sidebar.
- Subscribers: email list with date, search, delete, "Copy all emails" and CSV export.

DONE WHEN: a contact form message from the site appears here as unread.
```

### Prompt 25: Settings

```text
TASK: Build admin/settings.html (single settings row).

- Store info: store name, phone, WhatsApp number, email, address, opening hours, social links (Facebook, Instagram, TikTok, YouTube).
- Delivery: flat rate, free-delivery minimum, per-city rates table (add/remove rows).
- Payments: enable/disable COD and bank transfer; bank/JazzCash/EasyPaisa account details shown at checkout.
- Admin account: change my password.
- Save button with success toast; the website must read these values everywhere (header/footer contact info, WhatsApp buttons, checkout delivery charges, payment options) instead of hard-coded constants. Replace all hard-coded values in common.js.

DONE WHEN: changing the WhatsApp number here changes every WhatsApp button on the site.
```

---

## 8. Prompts: aakhri kaam

### Prompt 26: SEO aur speed

```text
TASK: SEO and performance pass on the whole site.

- Every page: unique <title> and meta description, Open Graph + Twitter tags (image, title, description) so links look good on WhatsApp/Facebook, canonical URL, favicon + apple-touch-icon, theme-color.
- Product pages: JSON-LD Product schema (name, image, price in PKR, availability, rating). Breadcrumb JSON-LD on shop/product pages. Organization JSON-LD on home.
- sitemap.xml (generate from Supabase: a small script or Supabase edge function) and robots.txt (block /admin/).
- Images: request the right size from Unsplash/Supabase (width parameter / Supabase image transformation), loading="lazy" below the fold, width/height attributes to avoid layout shift, hero image preloaded.
- Fonts: font-display swap (already), preconnect. Defer non-critical scripts.
- Accessibility: alt texts, labels on all inputs, visible focus states, colour contrast check, keyboard-usable menus, drawers and modals.
- Run Lighthouse (mobile) on home, shop, product and fix issues until Performance, SEO, Accessibility, Best Practices are all 90+.

DONE WHEN: Lighthouse scores are 90+ and sharing a product link on WhatsApp shows its image and price.
```

### Prompt 27: Website online karna (deploy)

```text
TASK: Help me deploy the site.

- Recommend Netlify, Vercel or Cloudflare Pages for a static HTML site (free plan) and give step-by-step instructions (connect GitHub repo or drag-and-drop folder).
- Add the needed config file (e.g. netlify.toml / _redirects) for: 404.html as not-found page, cache headers for css/js/images, security headers (X-Frame-Options, Referrer-Policy, a Content-Security-Policy that allows Supabase, jsdelivr, cdnjs, Google Fonts, Unsplash).
- Supabase settings to update after going live: Authentication -> URL configuration (site URL + redirect URLs for admin password reset), allowed origins.
- Connecting a custom domain (.pk or .com) + free HTTPS.
- A checklist: USE_DUMMY=false, no service_role key anywhere in the code, admin account has a strong password, test order placed on the live site.

DONE WHEN: the site is live on my domain with HTTPS and an order from the live site reaches the admin panel.
```

### Prompt 28: Final testing

```text
TASK: Full QA of the live site and admin panel. Go through every page on mobile (375px) and desktop and report a checklist with pass/fail:

- Customer flow: home -> collection -> sub-collection -> product -> variant -> add to cart -> cart -> coupon -> checkout (COD) -> success -> track order.
- Edge cases: out-of-stock product, invalid coupon, wrong phone format, empty cart checkout, double-clicking Place Order, very long product names, 0 search results, unknown URLs (404), slow network (throttle to Slow 3G).
- Admin flow: login, add collection, add product with images and variants, see it on site, take an order through all statuses, print invoice, approve a review, change settings.
- Security: as a logged-out visitor try to read the orders table via the Supabase JS client in the browser console: must fail. Non-admin login to admin must fail.
- Browsers: Chrome, Safari (iPhone), Firefox.

Fix every failure you find and list what you fixed.
```

### Prompt 29: Admin ke liye guide (optional)

```text
TASK: Write a simple admin guide in Roman Urdu (admin/GUIDE.md and a printable admin/guide.html) for the shop owner: how to log in, add a collection and product, upload good photos (size tips), handle an order from start to delivery, use coupons, change the home page banners and delivery charges, and what to do if something breaks. Use screenshots placeholders and short steps.
```

---

## 9. Ek nazar mein

| Step | Kaam | Prompt |
|---|---|---|
| 1 | Customer pages (dummy data) | 1 → 10 |
| 2 | Supabase database + connection | 11 → 13 |
| 3 | Admin panel | 14 → 25 |
| 4 | SEO, live karna, testing | 26 → 28 |
| 5 | Admin guide (optional) | 29 |
