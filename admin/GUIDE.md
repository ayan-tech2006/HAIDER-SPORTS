# Haider Sports Cricket Store — Admin Panel Rehnuma Guide (Roman Urdu)

Assalam-o-Alaikum! Yeh guide Haider Sports Cricket Store ke admin panel ko chalane aur orders/products sambhalne ke liye mukammal aur asaan tareeqe se banayi gayi hai.

---

## 1. Login Kaise Karein?
1. Browser mein `https://yourdomain.com/admin/` ya local server pe `http://localhost:8000/admin/` kholein.
2. Apna Admin Email aur Password darj karein.
3. **Login** button par click karein.
4. *Note:* Agar password bhool jayen toh **"Forgot Password?"** par click karein, aapke email par password reset link bhej diya jayega.

---

## 2. Nayi Collection / Category Banana
1. Left sidebar se **Collections** par click karein.
2. **"Add Collection"** button dabayein.
3. Category ka naam likhein (maslan: *Tape Ball Bats*).
4. Parent Category chunein:
   - Agar main category hai (jaise *Cricket*), toh Parent ko khaali chhor dein.
   - Agar subcategory hai (jaise *Bats*), toh Parent mein *Cricket* chunein.
5. **Aham Qanoon (Leaf Node):** Products sirf aakhri category (sub-category) ke andar add ho sakte hain jiske aage mazeed koi sub-category na ho.
6. **Save Collection** dabayein.

---

## 3. Naya Product Add Karna
1. Sidebar se **Products** par click karein aur **"Add Product"** button dabayein.
2. **Product Details:**
   - **Name:** Product ka pura naam (maslan: *Kashmir Willow Tape Bat - Power Hitter*).
   - **URL Slug:** Yeh khud-ba-khud generate ho jata hai.
   - **Description:** Bat ka weight profile, lakdi ki qisam, warranty details likhein.
3. **Media & Photos (Photo Upload Tips):**
   - Hamesha saaf aur achhi roshni wali photos dalein.
   - Square (1:1 ratio) ya 800x800 pixels behtareen rehti hain.
   - Pehli photo hamesha main cover photo hogi jo customer ko catalog mein dikhegi.
4. **Variants (Bat Weights ya Shoe Sizes):**
   - Bat ke liye: `+ Add Bat Weights` dabayein (1050g, 1100g, 1150g waghera khud add ho jayenge).
   - Joots ke liye: `+ Add Shoe Sizes` dabayein.
5. **Pricing & Stock:**
   - **Regular Price:** Asli bikne wali keemat (maslan: Rs. 3500).
   - **Compare Price:** Purani keemat (maslan: Rs. 4200) — system khud discount percentage calculate karega.
   - **Stock:** Dukaan mein mojood tadad. Jab stock 5 ya usse kam hoga, admin panel mein laal alert aayega.
6. **Category:** Aakhri leaf category chunein aur **Save Product** dabayein.

---

## 4. Customer Orders Ko Handle Karna (Pending se Delivery tak)
1. Jab bhi koi naya order aayega, admin panel par ghanti ki aawaz (chime) bajegi aur notification aayegi.
2. Sidebar se **Orders** par jayein.
3. Order ke **"Details"** button par click karein:
   - Customer ka phone number, delivery address aur ordered items nazar aayenge.
   - **WhatsApp button** dabayein — customer ko automatically order confirmation ka mukammal message tayar mil jayega.
4. **Order Status Change Karein:**
   - **Confirmed:** Customer se WhatsApp ya call par tasdeeq karne ke baad.
   - **Shipped:** Jab courier (TCS, Leopards, Trax, PostEx) ko parcel de dein:
     - Courier company select karein.
     - Tracking number darj karein taake customer khud apni website pe track kar sake.
   - **Delivered:** Jab customer ko parcel mil jaye aur COD payment collect ho jaye.
   - **Cancelled / Returned:** Agar parcel wapas aa jaye toh "Restock items back into product inventory" check karein taake inventory theek rahe.
5. **Print Invoice:** **"Print Invoice"** button dabayein. Yeh ek clean A4 packing slip print karega jisme COD amount wazeh likhi hogi.

---

## 5. Discount Coupons Banana
1. Sidebar se **Coupons** par jayein.
2. **"Create Coupon"** dabayein.
3. **Generate Code** dabayein (jaise: `HAIDER15`).
4. Discount Type: Percentage (e.g. 15%) ya Fixed PKR (e.g. Rs. 500).
5. Expiry date aur Minimum order amount set karein aur save karein.

---

## 6. Home Page Banners & Offers Badalna
1. Sidebar se **Home Content** par jayein.
2. **Hero Carousels:** Slider ke banners, text aur button links badlein.
3. **Flash Deal Offer:** Clearance sale ka countdown timer aur end-date set karein.
4. **Featured Products:** Catalog ke kisi bhi product par star dabayein taake woh home page pe sabse upar dikhe.

---

## 7. Delivery Charges & Store Info Badalna
1. Sidebar se **Settings** par jayein.
2. Apna helpline phone, WhatsApp number aur address update karein.
3. **Delivery Charges:** Pura Pakistan ka flat rate (e.g. Rs. 250) aur Free delivery threshold (e.g. Rs. 5000) set karein.
4. **Save Settings** dabayein. Website par har jagah naya number aur delivery rate khud update ho jayega!

---

## 8. Agar Koi Masla Aaye Toh Kya Karein?
- **Site pe nayi cheez nazar nahi aa rahi?** Browser mein `Ctrl + Shift + R` (Hard Refresh) karein.
- **Admin login nahi ho raha?** Apna internet check karein aur check karein ke Supabase service active hai.
- **Stock galat ho gaya?** Products manager mein jakar inline stock quantity ko turant edit kar lein.

Haider Sports Sports — Pakistan's Cricket Equipment Leader.
