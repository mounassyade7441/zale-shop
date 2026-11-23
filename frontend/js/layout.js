/* =====================================================================
   Éléments communs à toutes les pages : bandeau, en-tête, menu mobile,
   recherche, panier latéral, pied de page, bouton WhatsApp.
   → Pour modifier le menu, éditez la liste NAV ci-dessous.
   ===================================================================== */
import { $, $$, payLogo, sizeLabel, cart, esc, favorites, icon, img, loadConfig, loadProducts, money, norm, photo, setCurrency, waLink } from "./core.js?v=3";

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/boutique.html", label: "Boutique" },
  { href: "/nouveautes.html", label: "Nouveautés" },
  { href: "/collections.html", label: "Collections" },
  { href: "/promotions.html", label: "Promotions", promo: true },
  { href: "/contact.html", label: "Contact" },
];

let SHOP = null;
let CATEGORIES = [];

const isActive = (href) => {
  const p = location.pathname.replace(/\/index\.html$/, "/");
  if (href === "/") return p === "/";
  if (href === "/collections.html") return p.startsWith("/collection");
  return p === href || p === href.replace(".html", "");
};

function logo() {
  return `<a href="/" class="logo" aria-label="${esc(SHOP.name)} — accueil">
    <span class="logo-name">${esc(SHOP.shortName)}</span>
    <span class="logo-sub">${esc(SHOP.baseline)}</span>
  </a>`;
}

function socialLinks(cls = "social-btn") {
  const s = SHOP.social || {};
  return [
    ["instagram", "Instagram", s.instagram],
    ["facebook", "Facebook", s.facebook],
    ["tiktok", "TikTok", s.tiktok],
    ["whatsapp", "WhatsApp", waLink(SHOP.whatsapp)],
  ]
    .filter(([, , url]) => url)
    .map(([ic, label, url]) => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${icon(ic)}</a>`)
    .join("");
}

/* ------------------------------ En-tête ------------------------------ */
function renderHeader() {
  const msgs = SHOP.announcements?.length ? SHOP.announcements : [];
  const loop = [...msgs, ...msgs, ...msgs, ...msgs].map((m) => `<span>${esc(m)} <b>✦</b></span>`).join("");
  const link = (n) => `<a href="${n.href}" class="link ${n.promo ? "promo" : ""} ${isActive(n.href) ? "active" : ""}">${n.label}</a>`;
  const el = document.getElementById("header");
  el.innerHTML = `
    <a href="#contenu" class="skip-link">Aller au contenu</a>
    ${msgs.length ? `<div class="announcement"><div class="marquee">${loop}</div></div>` : ""}
    <header class="header">
      <div class="container header-inner">
        <div class="header-left">
          <button class="icon-btn menu-toggle" data-action="menu" aria-label="Ouvrir le menu">${icon("menu")}</button>
          <nav class="nav" aria-label="Navigation principale">${NAV.slice(0, 3).map(link).join("")}</nav>
        </div>
        ${logo()}
        <div class="header-right">
          <nav class="nav nav-right" aria-label="Navigation secondaire">${NAV.slice(3).map(link).join("")}</nav>
          <button class="icon-btn" data-action="search" aria-label="Rechercher">${icon("search")}</button>
          <a class="icon-btn fav-link" href="/favoris.html" aria-label="Mes favoris">${icon("heart")}<span class="badge-count blush" data-fav-count hidden></span></a>
          <button class="icon-btn" data-action="cart" aria-label="Panier">${icon("bag")}<span class="badge-count" data-cart-count hidden></span></button>
        </div>
      </div>
    </header>`;
  const header = $(".header", el);
  const onScroll = () => header.classList.toggle("scrolled", scrollY > 10);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function updateCounts() {
  const c = cart.count();
  $$("[data-cart-count]").forEach((b) => {
    b.textContent = c;
    b.hidden = c === 0;
  });
  $$("[data-action='cart']").forEach((b) => b.setAttribute("aria-label", `Panier (${c} article${c > 1 ? "s" : ""})`));
  const f = favorites.ids().length;
  $$("[data-fav-count]").forEach((b) => {
    b.textContent = f;
    b.hidden = f === 0;
  });
}

/* ------------------------------ Panneaux ------------------------------ */
function openOverlay(html, { onClose } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.innerHTML = `<div class="overlay-bg"></div>${html}`;
  document.body.append(wrap);
  document.body.classList.add("no-scroll");
  const close = () => {
    wrap.remove();
    if (!$(".overlay")) document.body.classList.remove("no-scroll");
    removeEventListener("keydown", onKey);
    onClose?.();
  };
  const onKey = (e) => e.key === "Escape" && close();
  addEventListener("keydown", onKey);
  wrap.addEventListener("click", (e) => {
    if (e.target.classList.contains("overlay-bg") || e.target.closest("[data-close]")) close();
  });
  return { el: wrap, close };
}

function openMenu() {
  const items = NAV.map(
    (n, i) => `<a href="${n.href}" class="fade-up ${isActive(n.href) ? "active" : ""}" style="animation-delay:${i * 50}ms">${n.label}<span class="small muted">→</span></a>`,
  ).join("");
  openOverlay(`
    <div class="panel panel-left" aria-label="Menu">
      <div class="panel-head"><span class="serif" style="font-size:22px;letter-spacing:.3em">${esc(SHOP.shortName)}</span>
        <button class="icon-btn" data-close aria-label="Fermer le menu">${icon("x")}</button></div>
      <nav class="panel-body mobile-nav">${items}
        <a href="/favoris.html" style="font-family:var(--font-sans);font-size:14px;letter-spacing:.15em;text-transform:uppercase;border:0;justify-content:flex-start;gap:12px">${icon("heart")} Mes favoris (${favorites.ids().length})</a>
      </nav>
      <div class="panel-foot"><p class="eyebrow">Suivez-nous</p><div class="socials">${socialLinks()}</div></div>
    </div>`);
}

export function openCart() {
  const { el, close } = openOverlay(`<aside class="panel panel-right" aria-label="Panier"></aside>`, {
    onClose: () => removeEventListener("cart:change", render),
  });
  const panel = $(".panel", el);
  function render() {
    const items = cart.items();
    const sub = cart.subtotal();
    const remaining = SHOP.delivery.freeFrom - sub;
    panel.innerHTML = `
      <div class="panel-head"><h2>Votre panier <span class="muted">(${cart.count()})</span></h2>
        <button class="icon-btn" data-close aria-label="Fermer le panier">${icon("x")}</button></div>
      ${
        items.length === 0
          ? `<div class="panel-body empty-state">${icon("bag")}<p class="serif" style="font-size:26px">Votre panier est vide</p>
             <p class="small muted mt-2">Laissez-vous inspirer par nos dernières pièces.</p>
             <a href="/boutique.html" class="btn btn-dark mt-6">Découvrir la boutique</a></div>`
          : `<div class="free-ship">${remaining > 0 ? `Plus que <strong>${money(remaining)}</strong> pour la livraison offerte` : "✦ Félicitations, la livraison vous est offerte !"}
               <div class="progress"><div style="width:${Math.min(100, (sub / (SHOP.delivery.freeFrom || 1)) * 100)}%"></div></div></div>
             <ul class="panel-body" style="padding-top:0;padding-bottom:0">${items
               .map(
                 (i) => `<li class="cart-line">
                   <a href="/produit.html?slug=${encodeURIComponent(i.slug)}"><img class="thumb" src="${esc(img(i.image, 200))}" alt="${esc(i.name)}"></a>
                   <div class="cart-line-info">
                     <div style="display:flex;justify-content:space-between;gap:8px">
                       <a class="cart-line-name" href="/produit.html?slug=${encodeURIComponent(i.slug)}">${esc(i.name)}</a>
                       <button class="icon-btn" style="width:28px;height:28px" data-remove="${esc(i.key)}" aria-label="Retirer ${esc(i.name)}">${icon("x")}</button>
                     </div>
                     <p class="xs muted mt-1">Taille ${esc(sizeLabel(i.size))} · ${esc(i.color)}</p>
                     <div class="cart-line-bottom">
                       <div class="qty"><button data-dec="${esc(i.key)}" ${i.quantity <= 1 ? "disabled" : ""} aria-label="Diminuer la quantité">${icon("minus")}</button><span>${i.quantity}</span><button data-inc="${esc(i.key)}" aria-label="Augmenter la quantité">${icon("plus")}</button></div>
                       <span class="small">${money(i.price * i.quantity)}</span>
                     </div>
                   </div></li>`,
               )
               .join("")}</ul>
             <div class="panel-foot">
               <div style="display:flex;justify-content:space-between" class="small"><span>Sous-total</span><strong style="font-weight:500">${money(sub)}</strong></div>
               <p class="xs muted">Frais de livraison calculés à l'étape suivante.</p>
               <a href="/commande.html" class="btn btn-dark btn-block">Commander</a>
               <a href="/panier.html" class="btn btn-outline btn-block">Voir le panier</a>
             </div>`
      }`;
  }
  panel.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const item = (k) => cart.items().find((i) => i.key === k);
    if (t.dataset.remove) cart.remove(t.dataset.remove);
    if (t.dataset.inc) cart.setQty(t.dataset.inc, item(t.dataset.inc).quantity + 1);
    if (t.dataset.dec) cart.setQty(t.dataset.dec, item(t.dataset.dec).quantity - 1);
  });
  addEventListener("cart:change", render);
  render();
  return close;
}

async function openSearch() {
  const { el, close } = openOverlay(`
    <div class="search-panel"><div class="container">
      <form class="search-form" role="search">
        ${icon("search")}
        <input type="search" placeholder="Rechercher une robe, un blazer, un sac…" aria-label="Rechercher un article" autocomplete="off">
        <button type="button" class="icon-btn" data-close aria-label="Fermer la recherche">${icon("x")}</button>
      </form>
      <div class="search-results mt-8"></div>
    </div></div>`);
  const input = $("input", el);
  const out = $(".search-results", el);
  setTimeout(() => input.focus(), 50);
  const products = await loadProducts().catch(() => []);
  const idle = () => {
    out.innerHTML = `<p class="eyebrow mb-4">Recherches populaires</p>
      <div class="chips">${["Robe de soirée", "Blazer", "Jean mom", "Robe fleurie", "Sac"].map((s) => `<button class="chip" data-term="${s}">${s}</button>`).join("")}</div>
      <p class="eyebrow mb-4 mt-8">Catégories</p>
      <div class="chips">${CATEGORIES.map((c) => `<a class="chip" href="/boutique.html?categorie=${c.slug}">${esc(c.name)}</a>`).join("")}</div>`;
  };
  const run = () => {
    const q = input.value.trim();
    if (q.length < 2) return idle();
    const res = searchProducts(products, q).slice(0, 6);
    out.innerHTML = res.length
      ? `<p class="eyebrow mb-4">${res.length} résultat(s)</p>
         <div class="grid-products cols-4" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${res
           .map((p) => `<a href="/produit.html?slug=${encodeURIComponent(p.slug)}"><div class="zoom-wrap">${photo(p.images[0], p.name, { cls: "photo ratio-34", sizes: "200px", width: 300 })}</div><p class="small mt-2">${esc(p.name)}</p><p class="small muted">${money(p.price)}</p></a>`)
           .join("")}</div>
         <a class="btn btn-outline mt-8" href="/boutique.html?q=${encodeURIComponent(q)}">Voir tous les résultats</a>`
      : `<p class="serif italic muted" style="font-size:22px">Aucun article ne correspond à « ${esc(q)} ».</p>`;
  };
  input.addEventListener("input", run);
  out.addEventListener("click", (e) => {
    const b = e.target.closest("[data-term]");
    if (b) {
      input.value = b.dataset.term;
      run();
    }
  });
  $("form", el).addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value.trim()) location.href = `/boutique.html?q=${encodeURIComponent(input.value.trim())}`;
  });
  idle();
  return close;
}

export function searchProducts(products, query) {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  const catName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || slug;
  return products.filter((p) => {
    const hay = norm(`${p.name} ${catName(p.category)} ${p.category} ${p.collection || ""} ${p.description} ${p.colors.map((c) => c.name).join(" ")}`);
    return terms.every((t) => hay.includes(t.replace(/s$/, "")));
  });
}

/* ------------------------------ Pied de page ------------------------------ */
function renderFooter() {
  const el = document.getElementById("footer");
  if (!el) return;
  const pays = [SHOP.payments?.cod === true && "Paiement à la livraison", SHOP.payments?.wave?.enabled !== false && "Wave", SHOP.payments?.orangeMoney?.enabled !== false && "Orange Money"].filter(Boolean);
  el.innerHTML = `
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          ${logo()}
          <p class="small mt-6" style="max-width:300px;color:rgba(243,236,226,.7)">La mode féminine élégante et tendance. Sublimez votre style, révélez votre beauté.</p>
          <div class="socials mt-6">${socialLinks()}</div>
        </div>
        <div><h3>Boutique</h3><ul class="footer-links">${CATEGORIES.map((c) => `<li><a href="/boutique.html?categorie=${c.slug}">${esc(c.name)}</a></li>`).join("")}</ul></div>
        <div><h3>Informations</h3><ul class="footer-links">
          <li><a href="/nouveautes.html">Nouveautés</a></li><li><a href="/collections.html">Collections</a></li>
          <li><a href="/promotions.html">Promotions</a></li><li><a href="/favoris.html">Mes favoris</a></li>
          <li><a href="/contact.html#livraison">Livraison & retours</a></li><li><a href="/contact.html">Nous contacter</a></li></ul></div>
        <div><h3>La boutique</h3><ul class="footer-links footer-contact">
          <li>${icon("pin")}<span>${esc(SHOP.address)}, ${esc(SHOP.city)}</span></li>
          <li>${icon("phone")}<a href="tel:+${esc(SHOP.whatsapp)}">${esc(SHOP.phoneDisplay)}</a></li>
          ${SHOP.email ? `<li>${icon("mail")}<a href="mailto:${esc(SHOP.email)}">${esc(SHOP.email)}</a></li>` : ""}
          <li>${icon("clock")}<span>${esc(SHOP.openingHours)}</span></li></ul></div>
      </div>
      <div class="footer-bottom"><div class="container">
        <p>© ${new Date().getFullYear()} ${esc(SHOP.name)}. Tous droits réservés.</p>
        <div class="pay-tags">${pays.map((p) => (p === "Wave" ? payLogo("wave") : p === "Orange Money" ? payLogo("orange_money") : `<span>${p}</span>`)).join("")}</div>
      </div></div>
    </footer>
    <a class="wa-float" href="${esc(waLink(SHOP.whatsapp, `Bonjour ${SHOP.name} 👋, j'aimerais avoir des informations.`))}" target="_blank" rel="noopener noreferrer" aria-label="Nous écrire sur WhatsApp">${icon("whatsapp")}</a>`;
}

/* ------------------------------ Initialisation ------------------------------ */
export async function initLayout() {
  const config = await loadConfig();
  SHOP = config.shop;
  CATEGORIES = config.categories;
  setCurrency(SHOP.currency);
  // Titre de l'onglet : « Page | Nom de la boutique »
  const base = document.title.split("|")[0].trim();
  document.title = base && base !== SHOP.name ? `${base} | ${SHOP.name}` : `${SHOP.name} — Mode féminine`;
  $$("[data-shop]").forEach((el) => (el.textContent = SHOP[el.dataset.shop] ?? ""));

  renderHeader();
  renderFooter();
  updateCounts();
  addEventListener("cart:change", updateCounts);
  addEventListener("fav:change", updateCounts);
  addEventListener("storage", updateCounts);

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;
    if (a.dataset.action === "menu") openMenu();
    if (a.dataset.action === "search") openSearch();
    if (a.dataset.action === "cart") openCart();
  });

  // Met à jour le panier avec les prix actuels
  loadProducts().then((p) => cart.sync(p)).catch(() => {});
  return config;
}

export const getShop = () => SHOP;
export const getCategories = () => CATEGORIES;
