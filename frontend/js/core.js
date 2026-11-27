/*
   Outils partagés par toutes les pages : API, formatage, panier,
   favoris, notifications, icônes.
 */

/* API */
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Une erreur est survenue.");
    err.status = res.status;
    throw err;
  }
  return data;
}

/* Configuration de la boutique (chargée une seule fois par page) */
let configPromise;
export const loadConfig = () => (configPromise ??= api("/config"));
let productsPromise;
export const loadProducts = () => (productsPromise ??= api("/products"));

/* Formatage */
export let CURRENCY = "FCFA";
export const setCurrency = (c) => (CURRENCY = c || "FCFA");
export const money = (n) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ")} ${CURRENCY}`;
export const formatDate = (iso) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const discount = (p) => (p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0);

/** Échappe le texte avant de l'insérer dans du HTML (sécurité). */
export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Image optimisée : redimensionne les photos Unsplash, laisse les autres intactes. */
export function img(url, width = 800, ratio = 1.333) {
  if (!url || !url.includes("images.unsplash.com")) return url || "";
  try {
    const u = new URL(url);
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", String(width));
    u.searchParams.set("h", String(Math.round(width * ratio)));
    u.searchParams.set("q", "75");
    return u.toString();
  } catch {
    return url;
  }
}
export function srcset(url, ratio = 1.333) {
  if (!url || !url.includes("images.unsplash.com")) return "";
  return [360, 540, 720, 960, 1280].map((w) => `${img(url, w, ratio)} ${w}w`).join(", ");
}
/** Balise <img> complète, avec chargement différé et repli si l'image échoue. */
export function photo(url, alt, { cls = "photo", sizes = "100vw", ratio = 1.333, eager = false, width = 960 } = {}) {
  const set = srcset(url, ratio);
  return `<img src="${esc(img(url, width, ratio))}" ${set ? `srcset="${set}" sizes="${sizes}"` : ""} alt="${esc(alt)}" class="${cls}" loading="${eager ? "eager" : "lazy"}" ${eager ? 'fetchpriority="high"' : ""} decoding="async" onerror="this.onerror=null;this.style.visibility='hidden'">`;
}

/** Libellé d'une taille : « TU » (taille unique) s'affiche « Standard ». */
export const sizeLabel = (s) => (s === "TU" ? "Standard" : s);

/** Logos des moyens de paiement (fichiers dans frontend/images/paiements/). */
export const PAY_LOGOS = { wave: "/images/paiements/wave.jpg", orange_money: "/images/paiements/orange-money.jpg" };
export const payLogo = (id, cls = "pay-img") =>
  PAY_LOGOS[id] ? `<img class="${cls}" src="${PAY_LOGOS[id]}" alt="${id === "wave" ? "Wave" : "Orange Money"}" loading="lazy">` : "";

export const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const qs = (k) => new URLSearchParams(location.search).get(k);
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Lien qui ouvre directement la discussion WhatsApp avec ce numéro.
 * - Téléphone / tablette : wa.me ouvre l'appli WhatsApp.
 * - Ordinateur : WhatsApp Web, directement sur la discussion (wa.me afficherait une page intermédiaire).
 * Un numéro sénégalais à 9 chiffres (ex. 77 123 45 67) reçoit l'indicatif 221.
 */
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
export function waLink(number, message = "") {
  let phone = String(number ?? "").replace(/\D/g, "");
  if (phone.length === 9) phone = `221${phone}`;
  const text = message ? encodeURIComponent(message) : "";
  if (IS_MOBILE) return `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;
  return `https://web.whatsapp.com/send?phone=${phone}${text ? `&text=${text}` : ""}`;
}

/*
 * Sur ordinateur, un clic sur un lien WhatsApp ouvre d'abord l'application WhatsApp installée
 * (whatsapp://), directement sur la discussion avec le message prêt.
 * Si l'application n'est pas installée (la page reste au premier plan), on ouvre WhatsApp Web.
 * Sur téléphone, wa.me ouvre déjà l'appli WhatsApp directement : on ne change rien.
 */
if (typeof document !== "undefined" && !IS_MOBILE) {
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="https://web.whatsapp.com/send"], a[href^="https://wa.me/"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href);
    const phone = url.hostname === "wa.me" ? url.pathname.slice(1) : url.searchParams.get("phone");
    if (!phone) return;
    e.preventDefault();
    const text = url.searchParams.get("text") || "";
    const q = `phone=${phone}${text ? `&text=${encodeURIComponent(text)}` : ""}`;

    let appOpened = false;
    const mark = () => (appOpened = true);
    window.addEventListener("blur", mark, { once: true });
    document.addEventListener("visibilitychange", mark, { once: true });
    location.href = `whatsapp://send?${q}`;
    setTimeout(() => {
      window.removeEventListener("blur", mark);
      document.removeEventListener("visibilitychange", mark);
      if (!appOpened && document.visibilityState === "visible") window.location.href = `https://web.whatsapp.com/send?${q}`;
    }, 1500);
  });
}

/* Stockage local */
const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const emit = (name) => window.dispatchEvent(new CustomEvent(name));

/* Panier */
export const cart = {
  items: () => read("mn_cart", []),
  count: () => cart.items().reduce((s, i) => s + i.quantity, 0),
  subtotal: () => cart.items().reduce((s, i) => s + i.price * i.quantity, 0),
  save(items) {
    write("mn_cart", items);
    emit("cart:change");
  },
  add(p, size, color, quantity = 1) {
    const key = `${p.id}|${size}|${color}`;
    const items = cart.items();
    const max = Math.max(1, Math.min(20, p.stock));
    const found = items.find((i) => i.key === key);
    if (found) found.quantity = Math.min(found.quantity + quantity, max);
    else items.push({ key, productId: p.id, slug: p.slug, name: p.name, image: p.images[0] || "", price: p.price, size, color, quantity: Math.min(quantity, max) });
    cart.save(items);
  },
  setQty(key, q) {
    cart.save(cart.items().map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(20, q)) } : i)));
  },
  remove(key) {
    cart.save(cart.items().filter((i) => i.key !== key));
  },
  clear: () => cart.save([]),
  /** Met à jour prix et noms avec le catalogue actuel ; retire les articles supprimés. */
  sync(products) {
    const items = cart.items();
    const next = items
      .filter((i) => products.some((p) => p.id === i.productId))
      .map((i) => {
        const p = products.find((x) => x.id === i.productId);
        return { ...i, name: p.name, price: p.price, slug: p.slug, image: p.images[0] || i.image };
      });
    if (JSON.stringify(next) !== JSON.stringify(items)) cart.save(next);
  },
};

/* Favoris */
export const favorites = {
  ids: () => read("mn_favorites", []),
  has: (id) => favorites.ids().includes(id),
  toggle(p) {
    const ids = favorites.ids();
    const on = !ids.includes(p.id);
    write("mn_favorites", on ? [...ids, p.id] : ids.filter((x) => x !== p.id));
    emit("fav:change");
    toast({ title: on ? "Ajouté aux favoris" : "Retiré des favoris", text: p.name, image: p.images[0], link: on ? { href: "/favoris.html", label: "Mes favoris" } : null });
    return on;
  },
};

/* Notifications */
export function toast({ title, text = "", image = "", link = null }) {
  let box = $(".toasts");
  if (!box) {
    box = document.createElement("div");
    box.className = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.append(box);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    ${image ? `<img src="${esc(img(image, 120))}" alt="">` : ""}
    <div class="toast-body">
      <p class="toast-title">${esc(title)}</p>
      ${text ? `<p class="toast-text">${esc(text)}</p>` : ""}
      ${link ? `<a href="${esc(link.href)}">${esc(link.label)}</a>` : ""}
    </div>
    <button class="icon-btn" aria-label="Fermer">${icon("x")}</button>`;
  el.querySelector("button").onclick = () => el.remove();
  box.append(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 4000);
}

/* Apparition au défilement */
const io = "IntersectionObserver" in window
  ? new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    )
  : null;
export function reveal(root = document) {
  $$(".reveal:not(.visible)", root).forEach((el) => (io ? io.observe(el) : el.classList.add("visible")));
  // Sécurité : quoi qu'il arrive, tout le contenu devient visible après 2,5 s
  setTimeout(() => $$(".reveal:not(.visible)").forEach((el) => el.classList.add("visible")), 2500);
}

/* Icônes (SVG) */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 8.38A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
  mobile: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
};
const FILLED = {
  whatsapp: '<path fill="currentColor" stroke="none" d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.45 9.43m8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.7 5.79.7 12.04c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02"/>',
  facebook: '<path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.25-1.46 1.5-1.46h1.55V4.47A20 20 0 0 0 14.3 4.3c-2.2 0-3.7 1.34-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z"/>',
  tiktok: '<path fill="currentColor" stroke="none" d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.6a6.8 6.8 0 0 1-3.8-1.2v5.6c0 7-7.6 9.2-10.7 4.2-2-3.3-.8-9 5.6-9.2v2.8c-.5.1-1 .2-1.5.4-1.4.5-2.2 1.4-2 3 .4 3.1 6.1 4 5.6-2V3h2.9Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>',
};
export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || FILLED[name] || ""}</svg>`;
}
