/* Giriraj Automobiles — front-end app (vanilla JS, lazy-loaded catalogue). */
(function () {
  "use strict";

  var META = window.META || { total: 0, categories: [], makes: [], fitment: {}, brands: [], featured: [], prefixMap: {} };
  var STORE = { name: "Giriraj Automobiles", city: "Junagadh", whatsapp: "919375010150" };
  var API_BASE = "api";
  var PAYMENTS_ENABLED = false; // true only when the PHP backend (api/) is deployed

  var CATEGORIES = META.categories.map(function (c) { return c.name; });
  var CSLUG = {}; META.categories.forEach(function (c) { CSLUG[c.name] = c.slug; });
  var CATCOUNT = {}; META.categories.forEach(function (c) { CATCOUNT[c.name] = c.count; });
  var MSLUG = {}; META.makes.forEach(function (m) { MSLUG[m.name] = m.slug; });

  // ---- helpers ----
  var inr = function (n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); };
  var waLink = function (msg) { return "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(msg); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
  var off = function (p) { return p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0; };

  var ICONS = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.5L3.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.5h5l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.6.1-.9z"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    funnel: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
    droplet: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    battery: '<rect x="3" y="8" width="16" height="9" rx="1"/><path d="M7 12h3M8.5 10.5v3M19 11h2v3h-2"/>',
    snow: '<path d="M12 2v20M3 7l18 10M21 7L3 17"/>',
    wave: '<path d="M3 8c3-4 6 4 9 0s6-4 9 0M3 16c3-4 6 4 9 0s6-4 9 0"/>',
    carbody: '<path d="M3 13l2-5h14l2 5v5h-3v-2H6v2H3z"/><circle cx="7.5" cy="16.5" r="1"/><circle cx="16.5" cy="16.5" r="1"/>',
    signal: '<path d="M12 12h.01M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"/>',
    belt: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3"/>',
    engine: '<path d="M6 9h4l3-3h3l2 2h2v4h-2v3h-3l-3 3H6v-3H3v-4h3z"/>',
    spring: '<path d="M6 3v4m0 10v4M6 7c3 0 3 2 0 4s-3 4 0 6"/><path d="M18 3v18"/>',
    pipe: '<path d="M2 15h13a4 4 0 0 1 4 4M19 19h3M6 12v3"/>',
    fuel: '<path d="M3 21h10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM13 9h3l3 3v6a2 2 0 0 1-4 0v-3h-2"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
    box: '<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M3 11h18M9 7V4h6v3"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2z"/>',
    tow: '<circle cx="6" cy="18" r="2"/><path d="M8 17l8-8h4M16 9v4"/>',
    trim: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    hose: '<path d="M4 6v6a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4M4 6h4M16 20h4"/>',
    ac: '<path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9"/>',
    steer: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V3M9.6 13.5l-5.6 3.5M14.4 13.5l5.6 3.5"/>',
    seat: '<path d="M6 4h7a2 2 0 0 1 2 2v6H6zM6 12v6M15 12l3 1v6"/>'
  };
  var CAT_ICON = {
    "Maintenance Service Parts": "wrench", "Filters": "funnel", "Windscreen Cleaning System": "wave",
    "Accessories": "gear", "Lighting": "bulb", "Control Cables": "hose", "Brake System": "disc",
    "Bearings": "belt", "Clutch System": "disc", "Electric Components": "battery", "Engine": "engine",
    "Engine Cooling System": "snow", "Exhaust System": "pipe", "Air Conditioning": "ac",
    "Fuel Supply System": "fuel", "Gaskets and Sealing Rings": "box", "Ignition and Glowplug System": "bulb",
    "Interior and comfort": "seat", "Body": "carbody", "Oils and Fluids": "droplet", "Pipes and Hoses": "hose",
    "Repair Kits": "wrench", "Sensors Relays and Control units": "signal", "Steering": "steer",
    "Suspension and Arms": "spring", "Towbar Parts": "tow", "Transmission": "box", "Trims": "trim",
    "Tyres and Alloys": "wheel", "Universal": "gear", "Wheels": "wheel", "Belts Chains and Rollers": "belt",
    "Workshop Consumables": "wrench", "Car Care and Detailing": "droplet"
  };
  var iconPath = function (cat) { return ICONS[CAT_ICON[cat] || "gear"]; };
  var catIcon = function (c) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconPath(c) + "</svg>"; };

  var xml = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  function placeholderImg(p) {
    var name = p.name || ""; if (name.length > 40) name = name.slice(0, 38) + "…";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
      '<rect width="800" height="600" fill="#f1f5f9"/><rect width="800" height="600" fill="none" stroke="#e2e8f0" stroke-width="4"/>' +
      '<text x="40" y="62" font-family="Arial, sans-serif" font-size="22" font-weight="bold" letter-spacing="3" fill="#94a3b8">' + xml((p.brand || "").toUpperCase()) + '</text>' +
      '<g transform="translate(330,150) scale(5.8)" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconPath(p.category) + '</g>' +
      '<text x="400" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#0f172a">' + xml(name) + '</text>' +
      '<rect x="0" y="540" width="800" height="60" fill="#dc2626"/>' +
      '<text x="400" y="579" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="bold" letter-spacing="2" fill="#ffffff">GIRIRAJ AUTOMOBILES · ' + xml((p.category || "").toUpperCase()) + '</text></svg>';
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }
  var imgSrc = function (p) { return (p.image && p.image.indexOf("unsplash.com") === -1) ? p.image : placeholderImg(p); };

  // ---- data: lazy shards ----
  var BY_ID = {};
  META.featured.forEach(function (p) { BY_ID[p.id] = p; });
  var URLCACHE = {};
  function fetchJSON(url) {
    if (URLCACHE[url]) return URLCACHE[url];
    var pr = fetch(url).then(function (r) { return r.json(); }).then(function (arr) {
      arr.forEach(function (p) { BY_ID[p.id] = p; }); return arr;
    });
    URLCACHE[url] = pr; return pr;
  }
  var fetchMake = function (slug) { return fetchJSON("assets/data/make/" + slug + ".json"); };
  var fetchCat = function (slug) { return fetchJSON("assets/data/cat/" + slug + ".json"); };
  var ALL_PR = null;
  function fetchAll() {
    if (ALL_PR) return ALL_PR;
    ALL_PR = Promise.all(META.makes.map(function (m) { return fetchMake(m.slug); }))
      .then(function (arrs) { return arrs.reduce(function (a, b) { return a.concat(b); }, []); });
    return ALL_PR;
  }
  // pick the smallest dataset that satisfies the query
  function shopData(q) {
    if (q.make && MSLUG[q.make]) return fetchMake(MSLUG[q.make]);
    if (q.category && CSLUG[q.category]) return fetchCat(CSLUG[q.category]);
    return fetchAll();
  }
  function ensureSku(sku) {
    var slug = META.prefixMap[(sku || "").split("-")[0]];
    return slug ? fetchMake(slug) : fetchAll();
  }
  function ensureCart() {
    var slugs = {}; getCart().forEach(function (i) { var s = META.prefixMap[(i.id || "").split("-")[0]]; if (s) slugs[s] = 1; });
    var ks = Object.keys(slugs);
    return ks.length ? Promise.all(ks.map(fetchMake)) : Promise.resolve([]);
  }

  // ---- fitment from META ----
  var makes = function () { return Object.keys(META.fitment).sort(); };
  var modelsFor = function (mk) { return Object.keys(META.fitment[mk] || {}).sort(); };
  var yearsFor = function (mk, md) { var r = (META.fitment[mk] || {})[md]; if (!r) return []; var out = []; for (var y = r[1]; y >= r[0]; y--) out.push(y); return out; };
  var fitsVehicle = function (p, mk, md, yr) {
    return (p.compatibility || []).some(function (c) {
      if (mk && c.make !== mk) return false;
      if (md && c.model !== md) return false;
      if (yr) { if (!((c.year_from || 1990) <= yr && yr <= (c.year_to || 2030))) return false; }
      return true;
    });
  };

  var byId = function (id) { return BY_ID[id]; };

  // ---- cart (localStorage) ----
  var CART_KEY = "giriraj_cart";
  var getCart = function () { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
  var setCart = function (c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartCount(); };
  var cartQty = function () { return getCart().reduce(function (s, i) { return s + i.qty; }, 0); };
  var addToCart = function (id, qty) {
    qty = qty || 1; var prod = byId(id); if (!prod) return;
    var c = getCart(), row = c.find(function (i) { return i.id === id; }), max = prod.stock || 0;
    if (row) row.qty = Math.min(row.qty + qty, max); else c.push({ id: id, qty: Math.min(qty, max) });
    setCart(c); toast(prod.name + " added to cart");
  };
  var setQty = function (id, qty) {
    var c = getCart(), prod = byId(id);
    if (qty <= 0) c = c.filter(function (i) { return i.id !== id; });
    else { var row = c.find(function (i) { return i.id === id; }); if (row) row.qty = Math.min(qty, prod ? prod.stock : qty); }
    setCart(c); render();
  };
  var cartDetailed = function () {
    return getCart().map(function (i) { var p = byId(i.id); return p ? { p: p, qty: i.qty, line: p.price * i.qty } : null; }).filter(Boolean);
  };
  var updateCartCount = function () { var el = document.getElementById("cartCount"); if (el) el.textContent = cartQty(); };

  var toastTimer;
  function toast(msg) { var t = document.getElementById("toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200); }

  var loadingHTML = function (label) { return '<div class="loading">' + (label || "Loading…") + '</div>'; };

  // ---- router ----
  function parseHash() {
    var h = location.hash.replace(/^#/, "") || "/";
    var qi = h.indexOf("?"); var path = qi >= 0 ? h.slice(0, qi) : h; var qs = qi >= 0 ? h.slice(qi + 1) : "";
    var q = {}; qs.split("&").forEach(function (kv) { if (!kv) return; var a = kv.split("="); q[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ""); });
    return { path: path, q: q };
  }
  function setActiveNav(seg) {
    document.querySelectorAll("#navlinks a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-nav") === "/" + (seg[0] || "")); });
    var nl = document.getElementById("navlinks"); if (nl) nl.classList.remove("open");
  }

  function render() {
    var r = parseHash(), app = document.getElementById("app"), seg = r.path.split("/").filter(Boolean);
    window.scrollTo(0, 0); setActiveNav(seg); updateCartCount();
    if (seg[0] === "product" && seg[1]) return renderProduct(decodeURIComponent(seg[1]), app);
    if (seg[0] === "shop") return renderShop(r.q, app);
    if (seg[0] === "cart") return renderCart(app);
    if (seg[0] === "checkout") return renderCheckout(app);
    if (seg[0] === "success") { app.innerHTML = viewSuccess(r.q); return; }
    if (seg[0] === "about") { app.innerHTML = viewAbout(); return; }
    if (seg[0] === "contact") { app.innerHTML = viewContact(); return; }
    app.innerHTML = viewHome(); bindHome();
  }

  // ---- product card ----
  function card(p) {
    var oos = (p.stock || 0) <= 0;
    return '<div class="card">' +
      '<a class="imgwrap" href="#/product/' + encodeURIComponent(p.id) + '"><img loading="lazy" src="' + esc(imgSrc(p)) + '" alt="' + esc(p.name) + '"></a>' +
      '<div class="body"><div class="brand">' + esc(p.brand) + (p.is_featured ? ' · <span style="color:var(--red)">Featured</span>' : '') + '</div>' +
      '<a class="nm" href="#/product/' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a>' +
      '<div class="price">' + inr(p.price) + (off(p) ? '<span class="mrp">' + inr(p.mrp) + '</span><span class="off">' + off(p) + '% off</span>' : '') + '</div>' +
      '<div class="row2">' +
      (oos ? '<span class="badge badge-oos" style="padding:11px;text-align:center;flex:1">Out of stock</span>' : '<button class="btn btn-dark" data-add="' + esc(p.id) + '">Add to cart</button>') +
      '<a class="btn btn-outline" href="#/product/' + encodeURIComponent(p.id) + '">View</a>' +
      '</div></div></div>';
  }
  function bindAdds(scope) {
    (scope || document).querySelectorAll("[data-add]").forEach(function (b) { b.addEventListener("click", function () { addToCart(b.getAttribute("data-add"), 1); }); });
  }

  // ---- HOME ----
  function viewHome() {
    return '<section class="hero"><div class="wrap">' +
      '<div><div class="eyebrow">Junagadh · Since 2014</div><h1>The right part,<br>first time.</h1>' +
      '<p class="lead">Genuine OE and quality aftermarket spares for every major car brand — picked by your vehicle, ready to fit.</p>' +
      '<div class="cta"><a class="btn btn-red" href="#/shop">Browse parts</a><a class="btn btn-light" href="#/shop">Shop by vehicle</a></div>' +
      '<div class="hero-stats"><div><div class="n">' + (META.total || 0) + '+</div><div class="l">Parts in stock</div></div>' +
      '<div><div class="n">' + META.makes.length + '</div><div class="l">Car brands</div></div>' +
      '<div><div class="n">' + CATEGORIES.length + '</div><div class="l">Categories</div></div></div></div>' +
      '<div class="hero-card"><img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900" alt="Workshop"></div></div></section>' +
      '<section class="sec"><div class="wrap">' + fitmentBar() + '</div></section>' +
      '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Categories</div><h2>Shop by category</h2></div></div>' +
      '<div class="cat-grid">' + CATEGORIES.map(function (c) {
        return '<a class="cat-card" href="#/shop?category=' + encodeURIComponent(c) + '"><span class="ic">' + catIcon(c) + '</span><span class="t">' + esc(c) + '</span><span class="c">' + (CATCOUNT[c] || 0) + ' products</span></a>';
      }).join("") + '</div></div></section>' +
      '<section class="sec" style="padding-top:0;background:var(--slate-50)"><div class="wrap" style="padding-top:60px;padding-bottom:60px">' +
      '<div class="sec-head"><div><div class="eyebrow">Popular</div><h2>Featured parts</h2></div><a class="btn btn-outline" href="#/shop">View all</a></div>' +
      '<div class="grid">' + META.featured.map(card).join("") + '</div></div></section>';
  }
  function fitmentBar() {
    return '<div class="fitment"><h3>Find parts for your vehicle</h3><div class="row">' +
      '<select id="fMake"><option value="">Make</option>' + makes().map(function (m) { return '<option>' + esc(m) + '</option>'; }).join("") + '</select>' +
      '<select id="fModel" disabled><option value="">Model</option></select>' +
      '<select id="fYear" disabled><option value="">Year</option></select>' +
      '<button class="btn btn-red" id="fGo">Search</button></div></div>';
  }
  function bindHome() {
    bindAdds(document);
    var fMake = document.getElementById("fMake"); if (!fMake) return;
    var fModel = document.getElementById("fModel"), fYear = document.getElementById("fYear");
    fMake.addEventListener("change", function () {
      fModel.innerHTML = '<option value="">Model</option>' + modelsFor(fMake.value).map(function (m) { return "<option>" + esc(m) + "</option>"; }).join("");
      fModel.disabled = !fMake.value; fYear.innerHTML = '<option value="">Year</option>'; fYear.disabled = true;
    });
    fModel.addEventListener("change", function () {
      fYear.innerHTML = '<option value="">Year</option>' + yearsFor(fMake.value, fModel.value).map(function (y) { return "<option>" + y + "</option>"; }).join("");
      fYear.disabled = !fModel.value;
    });
    document.getElementById("fGo").addEventListener("click", function () {
      var q = []; if (fMake.value) q.push("make=" + encodeURIComponent(fMake.value));
      if (fModel.value) q.push("model=" + encodeURIComponent(fModel.value));
      if (fYear.value) q.push("year=" + encodeURIComponent(fYear.value));
      location.hash = "#/shop" + (q.length ? "?" + q.join("&") : "");
    });
  }

  // ---- SHOP (sidebar sync, grid async) ----
  function renderShop(q, app) {
    var category = q.category || "", brand = q.brand || "", search = q.search || "", mk = q.make || "", md = q.model || "", yr = q.year || "";
    var catRadios = ['<label><input type="radio" name="cat" value=""' + (!category ? " checked" : "") + '> All categories</label>']
      .concat(CATEGORIES.map(function (c) { return '<label><input type="radio" name="cat" value="' + esc(c) + '"' + (category === c ? " checked" : "") + '> ' + esc(c) + '</label>'; })).join("");
    app.innerHTML = '<div class="band"><div class="wrap"><div class="eyebrow">Shop</div><h1>' + esc(category || mk || "All parts") + '</h1></div></div>' +
      '<section class="sec"><div class="wrap"><div class="shop">' +
      '<aside class="filters">' +
      '<h4>Search</h4><input type="search" id="sSearch" placeholder="Part name or SKU" value="' + esc(search) + '">' +
      '<h4>Category</h4>' + catRadios +
      '<h4>Brand</h4><select id="sBrand"><option value="">All brands</option>' + META.brands.map(function (b) { return '<option' + (brand === b ? " selected" : "") + '>' + esc(b) + '</option>'; }).join("") + '</select>' +
      '<h4>Vehicle fitment</h4>' +
      '<select id="sMake"><option value="">Any make</option>' + makes().map(function (m) { return '<option' + (mk === m ? " selected" : "") + '>' + esc(m) + '</option>'; }).join("") + '</select>' +
      '<select id="sModel" style="margin-top:8px"' + (mk ? "" : " disabled") + '><option value="">Any model</option>' + (mk ? modelsFor(mk).map(function (m) { return '<option' + (md === m ? " selected" : "") + '>' + esc(m) + '</option>'; }).join("") : "") + '</select>' +
      '<select id="sYear" style="margin-top:8px"' + (mk && md ? "" : " disabled") + '><option value="">Any year</option>' + (mk && md ? yearsFor(mk, md).map(function (y) { return '<option' + (String(yr) === String(y) ? " selected" : "") + '>' + y + '</option>'; }).join("") : "") + '</select>' +
      '<div style="margin-top:16px"><a class="btn btn-outline btn-block" href="#/shop">Clear all</a></div>' +
      '</aside>' +
      '<div id="gridZone">' + loadingHTML("Loading parts…") + '</div>' +
      '</div></div></section>';
    bindSidebar(q);
    shopData(q).then(function (base) { fillGrid(base, q); }).catch(function () {
      var z = document.getElementById("gridZone"); if (z) z.innerHTML = '<div class="empty">Could not load parts. Please refresh.</div>';
    });
  }

  function applyFilters(list, q) {
    var category = q.category || "", brand = q.brand || "", search = (q.search || "").toLowerCase(), mk = q.make || "", md = q.model || "", yr = q.year ? Number(q.year) : 0;
    return list.filter(function (p) {
      if (category && p.category !== category) return false;
      if (brand && p.brand !== brand) return false;
      if (search && !(p.name.toLowerCase().indexOf(search) >= 0 || p.sku.toLowerCase().indexOf(search) >= 0 || (p.description || "").toLowerCase().indexOf(search) >= 0)) return false;
      if ((mk || md || yr) && !fitsVehicle(p, mk, md, yr)) return false;
      return true;
    });
  }
  function fillGrid(base, q) {
    var list = applyFilters(base, q);
    if (q.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    else if (q.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
    var PAGE = 48, total = list.length, pages = Math.max(1, Math.ceil(total / PAGE));
    var page = Math.min(pages, Math.max(1, parseInt(q.page, 10) || 1));
    var items = list.slice((page - 1) * PAGE, page * PAGE);
    var chips = [];
    if (q.category) chips.push(chip("Category: " + q.category, "category"));
    if (q.brand) chips.push(chip("Brand: " + q.brand, "brand"));
    if (q.search) chips.push(chip('Search: "' + q.search + '"', "search"));
    if (q.make) chips.push(chip("Vehicle: " + q.make + (q.model ? " " + q.model : "") + (q.year ? " " + q.year : ""), "vehicle"));
    var html = '<div class="shop-top"><div class="muted">' + total + ' product' + (total === 1 ? "" : "s") + '</div>' +
      '<select id="sSort" class="filters" style="border-width:2px;padding:9px;width:auto"><option value="">Sort: Featured</option><option value="low"' + (q.sort === "low" ? " selected" : "") + '>Price: Low to High</option><option value="high"' + (q.sort === "high" ? " selected" : "") + '>Price: High to Low</option></select></div>' +
      (chips.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' + chips.join("") + '</div>' : "") +
      (total ? '<div class="grid">' + items.map(card).join("") + '</div>' + pager(page, pages, q) : '<div class="empty">No parts match these filters. <a href="#/shop" style="color:var(--red);font-weight:700">Clear filters</a></div>');
    var z = document.getElementById("gridZone"); z.innerHTML = html;
    bindAdds(z);
    var sSort = document.getElementById("sSort"); if (sSort) sSort.addEventListener("change", function () { navQuery(q, "sort", sSort.value); });
    z.querySelectorAll("[data-clear]").forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-clear"); navQuery(q, k === "vehicle" ? "make" : k, ""); }); });
  }
  function chip(label, key) { return '<span class="chip">' + esc(label) + ' <button data-clear="' + key + '">×</button></span>'; }
  function pager(page, pages, q) {
    if (pages <= 1) return "";
    var href = function (n) { var o = Object.assign({}, q); o.page = n; return "#/shop?" + Object.keys(o).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(o[k]); }).join("&"); };
    var out = [page > 1 ? '<a class="pg" href="' + href(page - 1) + '">‹ Prev</a>' : '<span class="pg disabled">‹ Prev</span>'];
    var nums = [], win = 2; for (var i = 1; i <= pages; i++) { if (i === 1 || i === pages || (i >= page - win && i <= page + win)) nums.push(i); }
    var last = 0; nums.forEach(function (i) { if (last && i - last > 1) out.push('<span class="pg-dots">…</span>'); out.push(i === page ? '<span class="pg active">' + i + '</span>' : '<a class="pg" href="' + href(i) + '">' + i + '</a>'); last = i; });
    out.push(page < pages ? '<a class="pg" href="' + href(page + 1) + '">Next ›</a>' : '<span class="pg disabled">Next ›</span>');
    return '<div class="pager">' + out.join("") + '</div>';
  }
  function navQuery(baseQ, key, val) {
    var q = Object.assign({}, baseQ);
    if (val) q[key] = val; else delete q[key];
    if (key !== "page") delete q.page;
    if (key === "make") { delete q.model; delete q.year; }
    if (key === "model") { delete q.year; }
    var qs = Object.keys(q).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
    location.hash = "#/shop" + (qs ? "?" + qs : "");
  }
  function bindSidebar(q) {
    document.querySelectorAll('input[name="cat"]').forEach(function (el) { el.addEventListener("change", function () { navQuery(q, "category", el.value); }); });
    var g = function (id) { return document.getElementById(id); };
    if (g("sBrand")) g("sBrand").addEventListener("change", function () { navQuery(q, "brand", g("sBrand").value); });
    if (g("sMake")) g("sMake").addEventListener("change", function () { navQuery(q, "make", g("sMake").value); });
    if (g("sModel")) g("sModel").addEventListener("change", function () { navQuery(q, "model", g("sModel").value); });
    if (g("sYear")) g("sYear").addEventListener("change", function () { navQuery(q, "year", g("sYear").value); });
    if (g("sSearch")) g("sSearch").addEventListener("keydown", function (e) { if (e.key === "Enter") navQuery(q, "search", g("sSearch").value.trim()); });
  }

  // ---- PRODUCT ----
  function renderProduct(id, app) {
    app.innerHTML = '<section class="sec"><div class="wrap" id="pdZone">' + loadingHTML("Loading…") + '</div></section>';
    ensureSku(id).then(function () {
      var p = byId(id), z = document.getElementById("pdZone");
      if (!p) { z.innerHTML = 'Product not found. <a href="#/shop" style="color:var(--red);font-weight:700">Back to shop</a>'; return; }
      z.innerHTML = productHtml(p); bindProduct(p);
    });
  }
  function productHtml(p) {
    var oos = (p.stock || 0) <= 0;
    var specRows = Object.keys(p.specs || {}).map(function (k) { return "<tr><td>" + esc(k) + "</td><td>" + esc(p.specs[k]) + "</td></tr>"; }).join("");
    var compat = (p.compatibility || []).map(function (c) { return esc(c.make + " " + c.model + " (" + (c.year_from || "") + "–" + (c.year_to || "") + ")"); }).join(", ");
    var waMsg = "Hello Giriraj Automobiles, I want to enquire about: " + p.name + " (SKU " + p.sku + ").";
    return '<div class="muted" style="margin-bottom:16px;font-size:14px"><a href="#/shop">Shop</a> / <a href="#/shop?category=' + encodeURIComponent(p.category) + '">' + esc(p.category) + '</a> / ' + esc(p.name) + '</div>' +
      '<div class="pd"><div class="img"><img src="' + esc(imgSrc(p)) + '" alt="' + esc(p.name) + '"></div><div>' +
      '<div class="brand" style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--slate-400)">' + esc(p.brand) + ' · ' + esc(p.category) + '</div>' +
      '<h1>' + esc(p.name) + '</h1>' +
      (p.is_featured ? '<span class="badge badge-feat">Featured</span> ' : "") +
      (oos ? '<span class="badge badge-oos">Out of stock</span>' : '<span class="badge" style="background:#dcfce7;color:#15803d">In stock · ' + p.stock + '</span>') +
      '<div class="price">' + inr(p.price) + (off(p) ? '<span class="mrp" style="font-size:18px">' + inr(p.mrp) + '</span> <span class="off" style="font-size:15px">' + off(p) + '% off</span>' : "") + '</div>' +
      '<p class="muted" style="color:var(--slate-700)">' + esc(p.description) + '</p>' +
      (specRows ? '<table>' + specRows + '</table>' : "") +
      (compat ? '<p style="font-size:13px;margin:10px 0"><b>Fits:</b> <span class="muted">' + compat + '</span></p>' : "") +
      '<div style="display:flex;gap:12px;align-items:center;margin:22px 0 12px">' +
      (oos ? '<span class="muted">Currently unavailable — enquire on WhatsApp for restock.</span>' : '<div class="qty"><button data-q="-">−</button><span id="pdQty">1</span><button data-q="+">+</button></div><button class="btn btn-red" id="pdAdd" data-id="' + esc(p.id) + '">Add to cart</button>') +
      '</div><a class="btn btn-wa btn-block" href="' + waLink(waMsg) + '" target="_blank" rel="noreferrer">Enquire on WhatsApp</a></div></div>';
  }
  function bindProduct(p) {
    var pdAdd = document.getElementById("pdAdd"); if (!pdAdd) return;
    var qEl = document.getElementById("pdQty"), n = 1;
    document.querySelectorAll("[data-q]").forEach(function (b) { b.addEventListener("click", function () { n = Math.max(1, n + (b.getAttribute("data-q") === "+" ? 1 : -1)); qEl.textContent = n; }); });
    pdAdd.addEventListener("click", function () { addToCart(pdAdd.getAttribute("data-id"), n); });
  }

  // ---- CART ----
  function renderCart(app) {
    app.innerHTML = '<div class="band"><div class="wrap"><div class="eyebrow">Cart</div><h1>Your cart</h1></div></div><section class="sec"><div class="wrap" id="cartZone">' + loadingHTML("Loading…") + '</div></section>';
    ensureCart().then(function () { document.getElementById("cartZone").innerHTML = cartHtml(); bindCart(); });
  }
  function cartHtml() {
    var items = cartDetailed();
    if (!items.length) return '<div class="empty">Your cart is empty.<br><br><a class="btn btn-red" href="#/shop">Start shopping</a></div>';
    var total = items.reduce(function (s, i) { return s + i.line; }, 0);
    var rows = items.map(function (i) {
      return '<div class="cart-row"><img src="' + esc(imgSrc(i.p)) + '" alt="">' +
        '<div><a class="nm" href="#/product/' + encodeURIComponent(i.p.id) + '" style="font-weight:700">' + esc(i.p.name) + '</a>' +
        '<div class="muted" style="font-size:13px">' + esc(i.p.brand) + ' · ' + inr(i.p.price) + '</div>' +
        '<div class="qty" style="margin-top:8px"><button data-cq="-" data-id="' + esc(i.p.id) + '">−</button><span>' + i.qty + '</span><button data-cq="+" data-id="' + esc(i.p.id) + '">+</button></div></div>' +
        '<div style="text-align:right"><div style="font-weight:800">' + inr(i.line) + '</div><button class="x" data-rm="' + esc(i.p.id) + '" title="Remove">×</button></div></div>';
    }).join("");
    return '<div class="cart-grid2"><div>' + rows + '</div><div class="summary">' +
      '<div class="line"><span>Items</span><span>' + items.reduce(function (s, i) { return s + i.qty; }, 0) + '</span></div>' +
      '<div class="line total"><span>Total</span><span>' + inr(total) + '</span></div>' +
      '<a class="btn btn-red btn-block" style="margin-top:16px" href="#/checkout">Proceed to checkout</a>' +
      '<a class="btn btn-wa btn-block" style="margin-top:10px" id="checkoutWa" href="' + buildCheckoutLink() + '" target="_blank" rel="noreferrer">Order on WhatsApp</a>' +
      '<a class="btn btn-outline btn-block" style="margin-top:10px" href="#/shop">Continue shopping</a>' +
      '<p class="muted" style="font-size:12px;margin-top:14px">Checkout with online payment (UPI / card) or Cash-on-Delivery. Prefer to chat? Order on WhatsApp.</p>' +
      '</div></div>';
  }
  function bindCart() {
    document.querySelectorAll("[data-cq]").forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-id"), cur = (getCart().find(function (i) { return i.id === id; }) || {}).qty || 0; setQty(id, cur + (b.getAttribute("data-cq") === "+" ? 1 : -1)); }); });
    document.querySelectorAll("[data-rm]").forEach(function (b) { b.addEventListener("click", function () { setQty(b.getAttribute("data-rm"), 0); }); });
  }

  // ---- CHECKOUT ----
  function renderCheckout(app) {
    app.innerHTML = '<div class="band"><div class="wrap"><div class="eyebrow">Checkout</div><h1>Checkout</h1></div></div><section class="sec"><div class="wrap" id="ckZone">' + loadingHTML("Loading…") + '</div></section>';
    ensureCart().then(function () { document.getElementById("ckZone").innerHTML = checkoutHtml(); bindCheckout(); });
  }
  function checkoutHtml() {
    var items = cartDetailed();
    if (!items.length) return '<div class="empty">Your cart is empty.<br><br><a class="btn btn-red" href="#/shop">Start shopping</a></div>';
    var total = items.reduce(function (s, i) { return s + i.line; }, 0), c = getCustomer();
    var fld = function (name, label, val, type, ph) {
      return '<label style="display:block;margin-bottom:12px"><span style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--slate-700)">' + label + '</span>' +
        (type === "area" ? '<textarea id="ck_' + name + '" rows="3" placeholder="' + esc(ph) + '" style="width:100%;padding:11px;border:2px solid var(--slate-200);font-family:inherit;font-size:15px;margin-top:5px">' + esc(val) + '</textarea>'
          : '<input id="ck_' + name + '" type="' + (type || "text") + '" placeholder="' + esc(ph) + '" value="' + esc(val) + '" style="width:100%;padding:11px;border:2px solid var(--slate-200);font-family:inherit;font-size:15px;margin-top:5px">') + '</label>';
    };
    var rows = items.map(function (i) { return '<div style="display:flex;justify-content:space-between;font-size:14px;padding:5px 0"><span>' + esc(i.p.name) + ' × ' + i.qty + '</span><span>' + inr(i.line) + '</span></div>'; }).join("");
    return '<div class="cart-grid2"><div>' +
      '<h3 style="font-family:Chivo;font-size:20px;margin-bottom:14px">Delivery details</h3>' +
      fld("name", "Full name", c.name, "text", "Your name") + fld("phone", "Phone (WhatsApp)", c.phone, "tel", "10-digit mobile") +
      fld("email", "Email (optional)", c.email, "email", "you@example.com") + fld("address", "Delivery address", c.address, "area", "House / shop, area, city, pincode") +
      (PAYMENTS_ENABLED ? '<h3 style="font-family:Chivo;font-size:20px;margin:24px 0 12px">Payment method</h3>' +
        '<label class="pay-opt"><input type="radio" name="pay" value="online" checked> <b>Pay online</b> — UPI, card, netbanking <span class="muted" style="font-size:13px">(via Razorpay)</span></label>' +
        '<label class="pay-opt"><input type="radio" name="pay" value="cod"> <b>Cash on Delivery</b></label>' : '') +
      '<div id="ckError" class="ck-error hide"></div></div>' +
      '<div class="summary"><h3 style="font-family:Chivo;font-size:18px;margin-bottom:10px">Order summary</h3>' + rows +
      '<div class="line total"><span>Total</span><span>' + inr(total) + '</span></div>' +
      (PAYMENTS_ENABLED ? '<button class="btn btn-red btn-block" style="margin-top:16px" id="placeOrder">Place order</button><a class="btn btn-wa btn-block" style="margin-top:10px" id="checkoutWa" href="#" target="_blank" rel="noreferrer">Order on WhatsApp instead</a>'
        : '<button class="btn btn-wa btn-block" style="margin-top:16px" id="waCheckout">Place order on WhatsApp</button><p class="muted" style="font-size:12px;margin-top:12px">We\'ll confirm price, availability and delivery on WhatsApp. Cash on Delivery available across Junagadh.</p>') +
      '</div></div>';
  }
  function bindCheckout() {
    var placeBtn = document.getElementById("placeOrder"); if (placeBtn) placeBtn.addEventListener("click", function () { doCheckout(placeBtn); });
    var co = document.getElementById("checkoutWa"); if (co) co.setAttribute("href", buildCheckoutLink());
    var waBtn = document.getElementById("waCheckout");
    if (waBtn) waBtn.addEventListener("click", function () {
      var c = readCheckoutForm();
      if (!c.name || c.phone.length < 7 || c.address.length < 10) return showCkError("Please enter your name, a valid phone number and a complete delivery address.");
      saveCustomer(c);
      var items = cartDetailed(), total = items.reduce(function (s, i) { return s + i.line; }, 0);
      var lines = items.map(function (i, n) { return (n + 1) + ". " + i.p.name + " (" + i.p.sku + ") × " + i.qty + " = " + inr(i.line); });
      window.open(waLink("Hello Giriraj Automobiles, I'd like to order:\n\n" + lines.join("\n") + "\n\nTotal: " + inr(total) + "\n\nName: " + c.name + "\nPhone: " + c.phone + (c.email ? "\nEmail: " + c.email : "") + "\nAddress: " + c.address), "_blank");
    });
  }
  function readCheckoutForm() { var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }; return { name: g("ck_name"), phone: g("ck_phone"), email: g("ck_email"), address: g("ck_address") }; }
  function getCustomer() { try { return JSON.parse(localStorage.getItem("giriraj_customer")) || {}; } catch (e) { return {}; } }
  function saveCustomer(c) { localStorage.setItem("giriraj_customer", JSON.stringify(c)); }
  function showCkError(msg) { var e = document.getElementById("ckError"); if (e) { e.textContent = msg; e.classList.remove("hide"); e.scrollIntoView({ behavior: "smooth", block: "center" }); } else toast(msg); }
  function buildCheckoutLink() {
    var items = cartDetailed(); if (!items.length) return "#";
    var total = items.reduce(function (s, i) { return s + i.line; }, 0);
    var lines = items.map(function (i, n) { return (n + 1) + ". " + i.p.name + " (" + i.p.sku + ") × " + i.qty + " = " + inr(i.line); });
    return waLink("Hello Giriraj Automobiles, I'd like to order:\n\n" + lines.join("\n") + "\n\nTotal: " + inr(total) + "\n\nPlease confirm availability and delivery.");
  }
  function postJSON(path, body) { return fetch(API_BASE + "/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); }); }
  var rzpLoaded = false;
  function loadRazorpay() { return new Promise(function (res, rej) { if (rzpLoaded && window.Razorpay) return res(); var s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = function () { rzpLoaded = true; res(); }; s.onerror = function () { rej(new Error("x")); }; document.body.appendChild(s); }); }
  function doCheckout(btn) {
    var c = readCheckoutForm();
    if (!c.name || c.phone.length < 7 || c.address.length < 10) return showCkError("Please enter your name, a valid phone number and a complete delivery address.");
    saveCustomer(c);
    var method = (document.querySelector('input[name="pay"]:checked') || {}).value || "online";
    var items = getCart().map(function (i) { return { id: i.id, qty: i.qty }; });
    btn.disabled = true; var label = btn.textContent; btn.textContent = "Please wait…";
    var reset = function () { btn.disabled = false; btn.textContent = label; };
    if (method === "cod") {
      postJSON("place-cod.php", { items: items, customer: c }).then(function (res) { if (!res.ok) { reset(); return showCkError(res.data.error || "Could not place order."); } setCart([]); location.hash = "#/success?order=" + encodeURIComponent(res.data.order_id); }).catch(function () { reset(); showCkError("Network error."); });
      return;
    }
    postJSON("create-order.php", { items: items, customer: c }).then(function (res) {
      if (!res.ok) { reset(); return showCkError(res.data.error || "Could not start payment."); }
      var o = res.data;
      loadRazorpay().then(function () {
        reset();
        new window.Razorpay({ key: o.key_id, amount: o.amount, currency: o.currency, name: STORE.name, description: "Auto parts order", order_id: o.order_id, prefill: { name: c.name, email: c.email, contact: c.phone }, theme: { color: "#dc2626" },
          handler: function (resp) { postJSON("verify-payment.php", { razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature, items: items, customer: c }).then(function (vr) { if (vr.ok && vr.data.ok) { setCart([]); location.hash = "#/success?paid=1&order=" + encodeURIComponent(vr.data.order_id); } else showCkError(vr.data.error || "Payment could not be verified."); }); } }).open();
      }).catch(function () { reset(); showCkError("Could not load the payment window."); });
    }).catch(function () { reset(); showCkError("Network error."); });
  }

  function viewSuccess(q) {
    var oid = q.order || "", paid = q.paid === "1";
    return '<section class="sec"><div class="wrap" style="max-width:620px;text-align:center;padding-top:30px">' +
      '<div style="width:72px;height:72px;background:var(--green);border-radius:999px;display:grid;place-items:center;margin:0 auto 20px"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h1 style="font-size:34px">Order placed!</h1><p class="muted" style="margin:14px 0">' + (paid ? "Payment received. " : "We will confirm your order on WhatsApp shortly. ") + 'Thank you for shopping with Giriraj Automobiles.</p>' +
      (oid ? '<p style="font-weight:800;font-size:18px;margin-bottom:24px">Order ID: ' + esc(oid) + '</p>' : "") +
      '<a class="btn btn-red" href="#/shop">Continue shopping</a></div></section>';
  }
  function viewAbout() {
    return '<div class="band"><div class="wrap"><div class="eyebrow">About</div><h1>Junagadh\'s trusted auto-parts counter.</h1></div></div>' +
      '<section class="sec"><div class="wrap prose" style="max-width:760px">' +
      '<p>Giriraj Automobiles has been supplying genuine spare parts and quality aftermarket components to garages and car owners across Saurashtra since 2014.</p>' +
      '<p>What started as a small counter in Timbavadi, near Pramukhswami Gate, has grown into a fully stocked shop carrying parts for all major Indian and global car brands.</p>' +
      '<p>We clearly label every product by brand and fitment, so you get exactly the right part for your vehicle — the first time, with no guesswork.</p>' +
      '<div class="cat-grid" style="margin-top:30px"><div class="cat-card"><span class="t">' + (META.total || 0) + '+</span><span class="c">Parts catalogued</span></div>' +
      '<div class="cat-card"><span class="t">' + META.makes.length + '</span><span class="c">Car brands</span></div>' +
      '<div class="cat-card"><span class="t">' + CATEGORIES.length + '</span><span class="c">Part categories</span></div>' +
      '<div class="cat-card"><span class="t">COD</span><span class="c">Across Junagadh</span></div></div></div></section>';
  }
  function viewContact() {
    var waMsg = "Hello Giriraj Automobiles, I want to enquire about a part.";
    var infoCard = function (icon, t, b) { return '<div class="info-card"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></span><div><div class="t">' + t + '</div><div class="b">' + esc(b) + '</div></div></div>'; };
    return '<div class="band"><div class="wrap"><div class="eyebrow">Contact</div><h1>Visit, call or WhatsApp.</h1></div></div>' +
      '<section class="sec"><div class="wrap contact-grid"><div>' +
      infoCard('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>', "Visit us", "Giriraj Automobiles\nNear Pramukhswami Gate, Timbavadi\nJunagadh, Gujarat 362015") +
      infoCard('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>', "Call", "+91 93750 10150") +
      infoCard('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>', "Email", "sales@girirajautomobiles.in") +
      infoCard('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', "Store hours", "Mon–Sat: 9:00 AM – 8:30 PM\nSunday: 10:00 AM – 2:00 PM") +
      '<a class="btn btn-wa btn-block" href="' + waLink(waMsg) + '" target="_blank" rel="noreferrer" style="margin-top:4px">Chat on WhatsApp</a></div>' +
      '<iframe class="map" title="Giriraj Automobiles Junagadh" loading="lazy" src="https://www.google.com/maps?q=Giriraj+Automobiles+Timbavadi+Junagadh&output=embed"></iframe>' +
      '</div></section>';
  }

  function initGlobal() {
    document.getElementById("yr").textContent = new Date().getFullYear();
    var waMsg = "Hello Giriraj Automobiles, I have a parts enquiry.";
    document.getElementById("waFloat").setAttribute("href", waLink(waMsg));
    document.getElementById("footWa").setAttribute("href", waLink(waMsg));
    document.getElementById("menuToggle").addEventListener("click", function () { document.getElementById("navlinks").classList.toggle("open"); });
  }
  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", function () { initGlobal(); render(); });
})();
