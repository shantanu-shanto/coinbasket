/* ===== Coinbasket: shared code for every page ===== */

/* ---------- Settings: edit these ---------- */
var CONFIG = {
  SITE_NAME: "Coinbasket",
  WALLET: "0xDEMO000000000000000000000000000000000000", // your store wallet address
  NETWORK: "USDC on Base",                               // shown in large text at checkout
  COIN: "USDC",
  QR_IMAGE: "",                                          // e.g. "img/wallet-qr.png" (leave empty for a placeholder)
  FORM_URL: "",                                          // your Google Form link
  CONTACT_EMAIL: "hello@example.com"
};

/* ---------- Small helpers ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function usd(n) { return "$" + Number(n).toFixed(2); }
function param(key) { return new URLSearchParams(location.search).get(key); }
function $(id) { return document.getElementById(id); }

var CATALOG = { categories: [], products: [] };
function findCategory(id) { return CATALOG.categories.filter(function (c) { return c.id === id; })[0]; }
function findProduct(id) { return CATALOG.products.filter(function (p) { return p.id === id; })[0]; }

/* ---------- Shared header and footer ---------- */
function renderChrome(page) {
  var links = [
    ["index.html", "Shop", "home"],
    ["how-it-works.html", "How it works", "how"],
    ["policies.html", "Policies", "policies"],
    ["about.html", "About", "about"]
  ];
  var header = $("site-header");
  if (header) {
    header.innerHTML =
      '<div class="bar"><a class="logo" href="index.html">' + esc(CONFIG.SITE_NAME.slice(0, 4)) +
      "<b>" + esc(CONFIG.SITE_NAME.slice(4)) + "</b></a><nav>" +
      links.map(function (l) {
        var on = (l[2] === page || (l[2] === "home" && (page === "category" || page === "product" || page === "checkout")));
        return '<a href="' + l[0] + '"' + (on ? ' class="on"' : "") + ">" + l[1] + "</a>";
      }).join("") + "</nav></div>";
  }
  var footer = $("site-footer");
  if (footer) {
    footer.innerHTML = "<p>" + esc(CONFIG.SITE_NAME) + ". Questions? " +
      '<a href="mailto:' + esc(CONFIG.CONTACT_EMAIL) + '">' + esc(CONFIG.CONTACT_EMAIL) + "</a></p>";
  }
}

/* ---------- Building blocks ---------- */
function visual(p, c) {
  if (p.images && p.images.length) return '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '">';
  return esc(p.emoji || c.emoji);
}
function productCard(p) {
  var c = findCategory(p.category);
  return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
    '<div class="tile" style="background:' + esc(c.color) + '">' + visual(p, c) + "</div>" +
    '<div class="cb"><b>' + esc(p.name) + "</b>" +
    '<span class="price">' + usd(p.price_usd) + '</span> <span class="mt">+ ' + usd(p.shipping_usd) + " shipping</span>" +
    (p.available ? "" : '<br><span class="chip">Unavailable</span>') + "</div></a>";
}

/* ---------- Pages ---------- */
function renderHome(app) {
  app.innerHTML =
    "<h1>Spend your crypto on real everyday products.</h1>" +
    '<p class="mt">No card, no bank account. Pick something, pay in stablecoins, and it ships to your door.</p>' +
    '<div class="flow"><div><b>You pay</b><span class="mt">Crypto, straight to our wallet</span></div>' +
    "<div><b>We buy</b><span>From the original seller</span></div>" +
    '<div><b>It ships</b><span class="mt">Directly to your address</span></div></div>' +
    "<h2>Shop by category</h2>" +
    '<div class="grid">' + CATALOG.categories.map(function (c) {
      var n = CATALOG.products.filter(function (p) { return p.category === c.id; }).length;
      return '<a class="card" href="category.html?c=' + encodeURIComponent(c.id) + '">' +
        '<div class="tile" style="background:' + esc(c.color) + '">' + esc(c.emoji) + "</div>" +
        '<div class="cb"><b>' + esc(c.name) + '</b><span class="mt">' + n + " products</span></div></a>";
    }).join("") + "</div>" +
    '<p class="mt" style="margin-top:22px">Launching in the United States first.</p>';
}

function renderCategory(app) {
  var c = findCategory(param("c"));
  if (!c) { app.innerHTML = '<h1>Category not found</h1><p><a href="index.html">Back to all categories</a></p>'; return; }
  document.title = c.name + " | " + CONFIG.SITE_NAME;
  app.innerHTML = '<p><a href="index.html">All categories</a></p><h1>' + esc(c.name) + "</h1>" +
    '<div class="grid">' + CATALOG.products.filter(function (p) { return p.category === c.id; }).map(productCard).join("") + "</div>";
}

function renderProduct(app) {
  var p = findProduct(param("id"));
  if (!p) { app.innerHTML = '<h1>Product not found</h1><p><a href="index.html">Back to the shop</a></p>'; return; }
  var c = findCategory(p.category);
  document.title = p.name + " | " + CONFIG.SITE_NAME;
  var opts = Object.keys(p.options || {}).map(function (k) {
    return "<label>" + esc(k) + '</label><select data-opt="' + esc(k) + '">' +
      p.options[k].map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("") + "</select>";
  }).join("");
  app.innerHTML =
    '<p><a href="category.html?c=' + encodeURIComponent(c.id) + '">' + esc(c.name) + "</a></p>" +
    '<div class="two"><div class="big" style="background:' + esc(c.color) + '">' + visual(p, c) + "</div><div>" +
    '<h1 style="font-size:36px">' + esc(p.name) + "</h1><p>" + esc(p.description) + "</p>" +
    '<p><span class="price" style="font-size:24px">' + usd(p.price_usd) + '</span> <span class="mt">+ ' + usd(p.shipping_usd) + " flat US shipping</span></p>" +
    opts +
    (p.available
      ? '<a class="btn" id="buy" href="#">Buy with crypto</a><p class="mt small">One item per order.</p>'
      : '<p><span class="chip">Currently unavailable</span></p>') +
    "</div></div>";

  var buy = $("buy");
  if (buy) {
    buy.addEventListener("click", function (e) {
      e.preventDefault();
      var q = new URLSearchParams({ id: p.id });
      app.querySelectorAll("select").forEach(function (s) { q.set(s.getAttribute("data-opt"), s.value); });
      location.href = "checkout.html?" + q.toString();
    });
  }
}

function uniqueAmount(p, optText) {
  var key = "amt:" + p.id + ":" + optText, saved = null;
  try { saved = sessionStorage.getItem(key); } catch (e) {}
  if (saved) return saved;
  var amt = (p.price_usd + p.shipping_usd + (Math.floor(Math.random() * 90) + 10) / 1000).toFixed(3);
  try { sessionStorage.setItem(key, amt); } catch (e) {}
  return amt;
}

function renderCheckout(app) {
  var p = findProduct(param("id"));
  if (!p || !p.available) {
    app.innerHTML = '<h1>This item can’t be ordered</h1><p><a href="index.html">Back to the shop</a></p>';
    return;
  }
  document.title = "Pay | " + CONFIG.SITE_NAME;
  // Read options from the address bar, but only accept values that exist in the catalog.
  var chosen = Object.keys(p.options || {}).map(function (k) {
    var v = param(k);
    if (p.options[k].indexOf(v) === -1) v = p.options[k][0];
    return k + ": " + v;
  }).join(", ");
  var total = p.price_usd + p.shipping_usd;
  var amount = uniqueAmount(p, chosen);

  var qr = CONFIG.QR_IMAGE
    ? '<div class="qr"><img src="' + esc(CONFIG.QR_IMAGE) + '" alt="Wallet QR code"></div>'
    : '<div class="qr">QR code goes here</div>';
  var form = CONFIG.FORM_URL
    ? '<a class="btn" href="' + esc(CONFIG.FORM_URL) + '" target="_blank" rel="noopener">Open order form</a>'
    : '<a class="btn" aria-disabled="true">Open order form</a><p class="mt small">Demo: add your Google Form link in <code>CONFIG.FORM_URL</code> in js/app.js.</p>';

  app.innerHTML =
    '<p><a href="product.html?id=' + encodeURIComponent(p.id) + '">Back to product</a></p>' +
    '<h1 style="font-size:36px">Pay with crypto</h1>' +
    '<div class="box"><table>' +
    "<tr><td>" + esc(p.name) + "</td><td>" + usd(p.price_usd) + "</td></tr>" +
    '<tr><td class="mt">' + esc(chosen || "No options") + "</td><td></td></tr>" +
    "<tr><td>Shipping</td><td>" + usd(p.shipping_usd) + "</td></tr>" +
    "<tr><td><b>Order total</b></td><td><b>" + usd(total) + "</b></td></tr></table></div>" +
    '<div class="box"><b>1. Send exactly this amount</b><div class="net" style="margin:6px 0">' + amount + " " + esc(CONFIG.COIN) + "</div>" +
    '<span class="mt">The extra digits help us match your payment to your order.</span> ' +
    '<button class="btn o" data-copy="' + amount + '">Copy</button></div>' +
    '<div class="warn"><div class="net">Network: ' + esc(CONFIG.NETWORK) + "</div>Funds sent on any other network can’t be recovered.</div>" +
    '<div class="box"><b>2. To this address</b><div style="margin:8px 0"><span class="addr">' + esc(CONFIG.WALLET) + "</span>" +
    '<button class="btn o" data-copy="' + esc(CONFIG.WALLET) + '">Copy</button></div>' + qr + "</div>" +
    '<div class="box"><b>3. Tell us where to ship</b>' +
    '<p class="mt">Fill in the order form with your address and the transaction hash from your wallet.</p>' + form + "</div>" +
    '<p class="mt small">Underpayments must be topped up. Overpayments are refunded or credited. See <a href="policies.html">policies</a>.</p>';

  app.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var label = b.textContent;
      try { navigator.clipboard.writeText(b.getAttribute("data-copy")); b.textContent = "Copied"; }
      catch (e) { b.textContent = "Select and copy"; }
      setTimeout(function () { b.textContent = label; }, 1500);
    });
  });
}

/* ---------- Start ---------- */
(function () {
  var page = document.body.getAttribute("data-page");
  renderChrome(page);
  var app = $("app");
  if (!app) return; // static pages (How it works, Policies, About) only need the header and footer

  fetch("data/products.json")
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      CATALOG = data;
      if (page === "home") renderHome(app);
      else if (page === "category") renderCategory(app);
      else if (page === "product") renderProduct(app);
      else if (page === "checkout") renderCheckout(app);
    })
    .catch(function () {
      app.innerHTML = "<h1>Catalog couldn’t load</h1>" +
        "<p>If you opened this file directly from your computer, serve the folder instead: " +
        "<code>python3 -m http.server</code>, then open <code>http://localhost:8000</code>.</p>";
    });
})();