/* Boutique, Nouveautés, Promotions et page d'une collection (même moteur de filtres). */
import { $, sizeLabel, esc, icon, loadProducts, qs } from "../core.js?v=3";
import { initLayout, searchProducts } from "../layout.js?v=3";
import { bindCards, isPromo, productCard, sortBy } from "../components.js?v=3";

const { categories, collections } = await initLayout();
bindCards();

const main = $("#contenu");
const preset = main.dataset.preset || ""; // "", "nouveautes", "promotions", "collection"
const defaultSort = preset === "nouveautes" ? "nouveautes" : "popularite";
const PAGE = 12;
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "TU"];
const PRICES = [
  { id: "0-20000", label: "Moins de 20 000 F", min: 0, max: 19999 },
  { id: "20000-35000", label: "20 000 – 35 000 F", min: 20000, max: 35000 },
  { id: "35000-50000", label: "35 000 – 50 000 F", min: 35001, max: 50000 },
  { id: "50000-", label: "Plus de 50 000 F", min: 50001, max: Infinity },
];

/* Page collection : en-tête dynamique */
let collection = null;
if (preset === "collection") {
  collection = collections.find((c) => c.slug === qs("slug"));
  if (!collection) {
    main.innerHTML = `<div class="container empty-state"><h1 class="title">Collection introuvable</h1><a class="btn btn-dark mt-8" href="/collections.html">Voir les collections</a></div>`;
    throw new Error("collection introuvable");
  }
  document.title = `Collection ${collection.name} | ${document.title.split("|").pop().trim()}`;
  $("#page-hero").innerHTML = `
    <img src="${esc(collection.image)}" alt="">
    <div class="container">
      <nav class="crumbs"><a href="/">Accueil</a><span class="sep">/</span><a href="/collections.html">Collections</a><span class="sep">/</span>${esc(collection.name)}</nav>
      <p class="eyebrow mb-2">${esc(collection.subtitle)}</p>
      <h1 class="fade-up">${esc(collection.name)}</h1>
      <p class="lead fade-up">${esc(collection.description)}</p>
    </div>`;
}

/* État des filtres (lu et écrit dans l'adresse de la page) */
const state = {
  q: qs("q") || "",
  cats: (qs("categorie") || "").split(",").filter(Boolean),
  sizes: (qs("taille") || "").split(",").filter(Boolean),
  colors: (qs("couleur") || "").split(",").filter(Boolean),
  price: qs("prix") || "",
  sort: qs("tri") || defaultSort,
  visible: PAGE,
};
function pushUrl() {
  const p = new URLSearchParams();
  if (preset === "collection") p.set("slug", collection.slug);
  if (state.q) p.set("q", state.q);
  if (state.cats.length) p.set("categorie", state.cats.join(","));
  if (state.sizes.length) p.set("taille", state.sizes.join(","));
  if (state.colors.length) p.set("couleur", state.colors.join(","));
  if (state.price) p.set("prix", state.price);
  if (state.sort !== defaultSort) p.set("tri", state.sort);
  history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`);
}

const all = await loadProducts();
const base = all.filter((p) =>
  preset === "nouveautes" ? p.isNew : preset === "promotions" ? isPromo(p) : preset === "collection" ? p.collection === collection.slug : true,
);
const colorMap = new Map();
base.forEach((p) => p.colors.forEach((c) => colorMap.set(c.name, c.hex)));

function results() {
  let list = state.q ? searchProducts(base, state.q) : base;
  if (state.cats.length) list = list.filter((p) => state.cats.includes(p.category));
  if (state.sizes.length) list = list.filter((p) => p.sizes.some((s) => state.sizes.includes(s)));
  if (state.colors.length) list = list.filter((p) => p.colors.some((c) => state.colors.includes(c.name)));
  const r = PRICES.find((x) => x.id === state.price);
  if (r) list = list.filter((p) => p.price >= r.min && p.price <= r.max);
  return [...list].sort(sortBy[state.sort] || sortBy.popularite);
}

/* Structure de la page */
$("#shop").innerHTML = `
  <div class="toolbar">
    <form class="searchbox" id="search-form" role="search">${icon("search")}
      <input id="q" type="search" placeholder="Rechercher…" aria-label="Rechercher dans la boutique" value="${esc(state.q)}"></form>
    <button class="filter-btn" id="open-filters">${icon("sliders")} Filtres <span id="filter-count"></span></button>
    <p class="results-count" id="count"></p>
    <label class="sort"><span class="sort-label">Trier par</span>
      <select class="field" id="sort" aria-label="Trier les articles">
        <option value="popularite">Popularité</option><option value="nouveautes">Nouveautés</option>
        <option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option>
      </select></label>
  </div>
  <div class="chips-scroll mb-10" id="cat-chips"></div>
  <div class="shop-layout">
    <aside class="filters-side"><div id="filters-desktop"></div></aside>
    <div><p class="small mb-6" id="search-info"></p><div class="grid-products" id="grid"></div><div class="load-more" id="more"></div></div>
  </div>`;
$("#sort").value = state.sort;

function filtersHtml() {
  const catCount = (slug) => base.filter((p) => p.category === slug).length;
  return `
    <div class="filter-group"><p class="label">Catégorie</p><div class="filter-list">
      ${categories
        .filter((c) => catCount(c.slug))
        .map((c) => `<label class="check"><input type="checkbox" data-f="cats" value="${c.slug}" ${state.cats.includes(c.slug) ? "checked" : ""}>${esc(c.name)}<span class="count">${catCount(c.slug)}</span></label>`)
        .join("")}</div></div>
    <div class="filter-group"><p class="label">Taille</p><div class="size-grid">
      ${SIZES.filter((s) => base.some((p) => p.sizes.includes(s))).map((s) => `<button class="size-btn ${state.sizes.includes(s) ? "on" : ""}" data-f="sizes" value="${s}" aria-pressed="${state.sizes.includes(s)}">${sizeLabel(s)}</button>`).join("")}</div></div>
    <div class="filter-group"><p class="label">Couleur</p><div class="color-filter">
      ${[...colorMap].map(([n, hex]) => `<button class="swatch ${state.colors.includes(n) ? "on" : ""}" data-f="colors" value="${esc(n)}" title="${esc(n)}" aria-label="${esc(n)}" aria-pressed="${state.colors.includes(n)}" style="background:${esc(hex)}"></button>`).join("")}</div></div>
    <div class="filter-group"><p class="label">Prix</p><div class="filter-list">
      ${PRICES.map((r) => `<label class="check"><input type="radio" name="prix-${Math.random().toString(36).slice(2, 6)}" data-f="price" value="${r.id}" ${state.price === r.id ? "checked" : ""}>${r.label}</label>`).join("")}</div></div>
    ${activeCount() ? '<button class="underline xs mt-8" data-f="reset" style="letter-spacing:.2em;text-transform:uppercase">Effacer les filtres</button>' : ""}`;
}
const activeCount = () => state.cats.length + state.sizes.length + state.colors.length + (state.price ? 1 : 0) + (state.q ? 1 : 0);

function render() {
  const list = results();
  const n = list.length;
  $("#count").textContent = `${n} article${n > 1 ? "s" : ""}`;
  $("#filter-count").textContent = activeCount() ? `(${activeCount()})` : "";
  $("#search-info").innerHTML = state.q ? `Résultats pour <strong>« ${esc(state.q)} »</strong> — ${n} article${n > 1 ? "s" : ""}` : "";
  $("#cat-chips").innerHTML =
    `<button class="chip ${state.cats.length ? "" : "active"}" data-cat="">Tout</button>` +
    categories.filter((c) => base.some((p) => p.category === c.slug)).map((c) => `<button class="chip ${state.cats.includes(c.slug) ? "active" : ""}" data-cat="${c.slug}">${esc(c.name)}</button>`).join("");
  $("#filters-desktop").innerHTML = filtersHtml();
  const drawer = $("#filters-mobile");
  if (drawer) drawer.innerHTML = filtersHtml();
  const seeBtn = $("#see-results");
  if (seeBtn) seeBtn.textContent = `Voir ${n} article${n > 1 ? "s" : ""}`;

  $("#grid").innerHTML = n
    ? list.slice(0, state.visible).map((p, i) => productCard(p, { eager: i < 4 })).join("")
    : `<div class="empty-state" style="grid-column:1/-1"><p class="serif" style="font-size:30px">Aucun article trouvé</p>
       <p class="small muted mt-2">Essayez d'élargir votre recherche ou de retirer quelques filtres.</p>
       <button class="btn btn-outline mt-8" data-f="reset">Réinitialiser</button></div>`;
  $("#more").innerHTML =
    state.visible < n ? `<p class="xs muted mb-4">${state.visible} sur ${n} articles</p><button class="btn btn-outline" id="load-more">Voir plus d'articles</button>` : "";
  pushUrl();
}

function applyFilter(el) {
  const f = el.dataset.f;
  if (f === "reset") Object.assign(state, { q: "", cats: [], sizes: [], colors: [], price: "" }), ($("#q").value = "");
  else if (f === "price") state.price = el.value;
  else {
    const arr = state[f];
    state[f] = arr.includes(el.value) ? arr.filter((x) => x !== el.value) : [...arr, el.value];
  }
  state.visible = PAGE;
  render();
}

document.addEventListener("click", (e) => {
  const f = e.target.closest("button[data-f]");
  if (f) return applyFilter(f);
  const chip = e.target.closest("[data-cat]");
  if (chip) {
    const c = chip.dataset.cat;
    state.cats = !c || (state.cats.length === 1 && state.cats[0] === c) ? [] : [c];
    state.visible = PAGE;
    render();
  }
  if (e.target.closest("#load-more")) {
    state.visible += PAGE;
    render();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.matches("input[data-f]")) applyFilter(e.target);
});
$("#sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});
$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.q = $("#q").value.trim();
  state.visible = PAGE;
  render();
});
$("#q").addEventListener("search", () => {
  state.q = $("#q").value.trim();
  render();
});

/* Tiroir de filtres (mobile) */
$("#open-filters").addEventListener("click", () => {
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.innerHTML = `<div class="overlay-bg" data-close></div>
    <div class="panel panel-right" role="dialog" aria-label="Filtres">
      <div class="panel-head"><h2>Filtres</h2><button class="icon-btn" data-close aria-label="Fermer">${icon("x")}</button></div>
      <div class="panel-body" id="filters-mobile"></div>
      <div class="panel-foot"><button class="btn btn-dark btn-block" id="see-results" data-close></button></div>
    </div>`;
  document.body.append(wrap);
  document.body.classList.add("no-scroll");
  wrap.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      wrap.remove();
      document.body.classList.remove("no-scroll");
    }
  });
  render();
});

render();
