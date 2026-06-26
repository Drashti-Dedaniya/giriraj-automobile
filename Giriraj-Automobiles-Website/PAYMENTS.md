# Payments & Orders — setup guide

The site supports **three** ways for a customer to order:

1. **Pay online** — UPI / card / netbanking / wallets, via **Razorpay** (secure)
2. **Cash on Delivery (COD)** — order is recorded, pay on delivery
3. **Order on WhatsApp** — opens a chat with the shop (no payment needed)

COD and WhatsApp work out of the box. Online payment needs Razorpay keys (below).

---

## How it works (architecture)

- The website (HTML/CSS/JS) is static.
- The `api/` folder holds small **PHP** scripts that run on Hostinger:
  - `create-order.php` — creates a Razorpay order (server-side, prices recomputed so totals can't be faked)
  - `verify-payment.php` — verifies the Razorpay signature and records the paid order
  - `place-cod.php` — records a Cash-on-Delivery order
  - `config.php` — your keys + shared helpers
  - `products.json` — trusted price list (used to compute totals)
  - `orders/orders.jsonl` — every order is appended here (one JSON line per order)

Orders are saved to `api/orders/orders.jsonl`. That folder is protected from public web access by `.htaccess`.

---

## Turn on online payments (Razorpay)

1. Create a free account at **razorpay.com**.
2. Dashboard → **Settings → API Keys → Generate Key**.
   - Start in **Test mode** (keys look like `rzp_test_xxxx`).
3. Open `api/config.php` and paste both values:
   ```php
   const RAZORPAY_KEY_ID     = 'rzp_test_xxxxxxxxxxxxx';
   const RAZORPAY_KEY_SECRET = 'your_test_secret_here';
   ```
4. Test with Razorpay's test UPI / card (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV).
5. When ready for real money: complete Razorpay KYC, switch the dashboard to **Live mode**,
   generate **live** keys (`rzp_live_…`), and replace the two values in `config.php`.

> The **secret key** lives only in `config.php` on the server. It is never sent to the browser. Keep it private.

---

## Deploy to Hostinger

1. In hPanel, make sure the domain uses **PHP 7.4+** (8.x recommended).
2. Upload the **entire site folder contents** into `public_html/` (via File Manager or FTP):
   - `index.html`, the `assets/` folder, and the `api/` folder.
3. Ensure `api/orders/` is **writable** (File Manager → permissions `755`/`775` on the folder).
4. Visit your domain — the site loads. Online payment works once keys are set in `api/config.php`.

That's it. No Node, no database server — Hostinger's standard PHP hosting is enough.

---

## Viewing orders — the Admin page

Go to **`yourdomain.com/admin/`** and sign in. You'll see every order (newest first) with items,
totals, customer name/phone/address, payment status, and a **WhatsApp** button to message the buyer.
You can change each order's status (Pending → Confirmed → Shipped → Delivered / Cancelled).

**Set the admin password** in `api/config.php` before going live:
```php
const ADMIN_PASSWORD = 'giriraj-admin-2026';   // change this
```

(Raw orders are also in `api/orders/orders.jsonl` if you ever want to export them. That file is
blocked from public web access by `.htaccess`.)

---

## Local testing (optional, on this Mac)

```bash
cd Giriraj-Automobiles-Website
php -S 127.0.0.1:8090     # needs PHP installed (brew install php)
# open http://127.0.0.1:8090
```
COD + WhatsApp work immediately. Online payment works after you put test keys in `api/config.php`.
