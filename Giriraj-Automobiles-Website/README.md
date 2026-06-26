# Giriraj Automobiles — Website

A fast, self-contained storefront for Giriraj Automobiles (car spare parts, Timbavadi, Junagadh).
Pure HTML + CSS + JavaScript — **no build step, no server, no database.** It just opens and runs.

## Files
```
index.html         Page shell (header, footer, WhatsApp button)
assets/styles.css  All styling (industrial red/slate theme)
assets/app.js      App logic: routing, filters, fitment, cart, checkout
assets/products.js The 80-product catalogue (edit this to add/change products)
api/               PHP payment backend (Razorpay + COD) — see PAYMENTS.md
```

## Checkout & payments
Customers can **pay online (UPI/card via Razorpay)**, choose **Cash on Delivery**, or **order on WhatsApp**.
COD and WhatsApp work immediately; online payment needs Razorpay keys. Full setup + Hostinger
deploy steps are in **[PAYMENTS.md](PAYMENTS.md)**.

## Run it
For browsing only, open `index.html` directly. For the **checkout/orders** to work you need PHP
(the `api/` scripts), so serve it with PHP:
```bash
cd Giriraj-Automobiles-Website
php -S 127.0.0.1:4173      # brew install php if needed
# then open http://127.0.0.1:4173
```

## Features
- Home with hero, vehicle fitment search, category grid, featured parts
- Shop with filters: category, brand, vehicle (make/model/year), search, price sort
- Product detail pages with specs, fitment list, quantity, add-to-cart
- Cart (saved in the browser) → **checkout sends the order to WhatsApp** (919375010150)
- About + Contact (real Timbavadi address, hours, map) and a floating WhatsApp button
- Fully responsive (mobile / tablet / desktop)

## Editing the catalogue
Open `assets/products.js`. Each product is an object:
```js
{ id, sku, name, category, brand, price, mrp, stock, description,
  image, compatibility: [{make, model, year_from, year_to}], specs:{}, is_featured }
```
Categories must be one of: Engine, Brakes, Suspension, Electricals, Filters, Body, Accessories.

## Hosting (free options)
Upload the folder to **Netlify Drop** (drag-and-drop), **GitHub Pages**, **Cloudflare Pages**,
or any shared web host. No backend needed.

## Change the WhatsApp number / contact details
- WhatsApp number: `STORE.whatsapp` near the top of `assets/app.js`
- Address, phone, email, hours: the `viewContact()` function in `assets/app.js` and the footer in `index.html`
