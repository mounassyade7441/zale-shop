import { $, $$, sizeLabel, api, cart, discount, esc, favorites, icon, img, loadProducts, money, photo, qs, reveal, waLink } from "../core.js?v=3";
import { initLayout, openCart } from "../layout.js?v=3";
import { bindCards, productCard, sortBy } from "../components.js?v=3";

const { shop, categories, collections } = await initLayout();
bindCards();
const main = $("#contenu");

let p;
try {
  p = await api(`/products/${encodeURIComponent(qs("slug") || "")}`);
} catch {
  main.innerHTML = `<div class="container empty-state"><h1 class="title">Article introuvable</h1>
    <p class="muted mt-4">Cet article n'existe plus ou a été retiré de la boutique.</p>
    <a href="/boutique.html" class="btn btn-dark mt-8">Retour à la boutique</a></div>`;
  throw new Error("introuvable");
}

/* SEO : titre, description, données structurées */
document.title = `${p.name} | ${shop.name}`;
$('meta[name="description"]').setAttribute("content", p.description.slice(0, 160));
const ld = document.createElement("script");
ld.type = "application/ld+json";
ld.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  image: p.images.map((i) => img(i, 1200)),
  description: p.description,
  sku: String(p.id),
  brand: { "@type": "Brand", name: shop.name },
  offers: { "@type": "Offer", url: location.href, priceCurrency: "XOF", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
});
document.head.append(ld);

const cat = categories.find((c) => c.slug === p.category);
const col = collections.find((c) => c.slug === p.collection);
const off = discount(p);
const soldOut = p.stock <= 0;
const tu = p.sizes.length === 1 && p.sizes[0] === "TU";
const images = p.images.length ? p.images : [""];
const sel = { size: p.sizes.length === 1 ? p.sizes[0] : null, color: p.colors[0]?.name || "", qty: 1, index: 0 };

main.innerHTML = `
<div class="container">
  <div class="product-layout">
    <nav class="crumbs" style="grid-column:1/-1;margin:0" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a><span class="sep">/</span><a href="/boutique.html">Boutique</a>
      ${cat ? `<span class="sep">/</span><a href="/boutique.html?categorie=${cat.slug}">${esc(cat.name)}</a>` : ""}
    </nav>

    <div class="gallery">
      <div class="thumbs">${images.map((src, i) => `<button data-thumb="${i}" class="${i === 0 ? "on" : ""}" aria-label="Photo ${i + 1}">${photo(src, "", { cls: "", sizes: "84px", width: 200 })}</button>`).join("")}</div>
      <div class="slider-wrap">
        <div class="slider" id="slider">${images
          .map((src, i) => `<div class="slide" data-slide="${i}">${photo(src, `${p.name} — vue ${i + 1}`, { cls: "", sizes: "(min-width:1024px) 45vw, 100vw", eager: i === 0 })}${src ? `<img class="lens" src="${esc(img(src, 1600))}" alt="" loading="lazy">` : ""}</div>`)
          .join("")}</div>
        ${images.length > 1 ? `<div class="dots">${images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>
        <button class="round-btn prev-btn" data-go="-1" aria-label="Photo précédente">${icon("left")}</button>
        <button class="round-btn next-btn" data-go="1" aria-label="Photo suivante">${icon("right")}</button>` : ""}
        <button class="round-btn zoom-btn" id="zoom" aria-label="Agrandir la photo">${icon("zoom")}</button>
      </div>
    </div>

    <div class="product-info">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${p.isNew ? '<span class="badge badge-outline">Nouveau</span>' : ""}
        ${p.isBestSeller ? '<span class="badge badge-gold">Best-seller</span>' : ""}
        ${off ? `<span class="badge badge-sale">-${off}%</span>` : ""}
      </div>
      <h1>${esc(p.name)}</h1>
      ${col ? `<a href="/collection.html?slug=${col.slug}" class="eyebrow" style="display:inline-block;margin-top:8px">Collection ${esc(col.name)}</a>` : ""}
      <p class="product-price"><span class="${off ? "price-sale" : ""}">${money(p.price)}</span>${off ? `<s class="price-old">${money(p.compareAtPrice)}</s>` : ""}</p>
      <p class="soft mt-4">${esc(p.description)}</p>

      <div class="option mt-8">
        <p class="label">Couleur : <span id="color-name">${esc(sel.color)}</span></p>
        <div class="swatches mt-3" style="gap:12px">${p.colors.map((c, i) => `<button class="swatch lg ${i === 0 ? "on" : ""}" data-color="${esc(c.name)}" title="${esc(c.name)}" aria-label="${esc(c.name)}" style="background:${esc(c.hex)}"></button>`).join("")}</div>
      </div>

      <div class="option">
        <div class="option-head"><p class="label">Taille <span id="size-name">${sel.size ? `: ${sizeLabel(sel.size)}` : ""}</span></p>
          ${tu ? "" : `<button class="xs underline" id="size-guide" style="display:flex;gap:6px;align-items:center">${icon("ruler")} Guide des tailles</button>`}</div>
        <div class="sizes">${p.sizes.map((s) => `<button class="size-btn ${s === "TU" ? "tu" : ""} ${sel.size === s ? "on" : ""}" data-size="${s}">${sizeLabel(s)}</button>`).join("")}</div>
        <p class="field-error hidden" id="size-error" role="alert">Veuillez choisir votre taille.</p>
      </div>

      <div class="option" style="display:flex;align-items:center;gap:20px">
        <div class="qty lg"><button id="qty-minus" aria-label="Diminuer la quantité">${icon("minus")}</button><span id="qty" aria-live="polite">1</span><button id="qty-plus" aria-label="Augmenter la quantité">${icon("plus")}</button></div>
        <p class="stock ${soldOut ? "out" : p.stock <= 5 ? "low" : "ok"}">${soldOut ? "Épuisé" : p.stock <= 5 ? `● Plus que ${p.stock} en stock` : "● En stock"}</p>
      </div>

      <div class="buy-row">
        <button class="btn btn-dark btn-lg" id="add" ${soldOut ? "disabled" : ""}>${soldOut ? "Épuisé" : "Ajouter au panier"}</button>
        <button class="fav-big ${favorites.has(p.id) ? "on" : ""}" id="fav" aria-label="Ajouter aux favoris">${icon("heart")}</button>
      </div>
      <a class="btn btn-whatsapp-outline btn-block btn-lg mt-3" id="wa-order" target="_blank" rel="noopener noreferrer">${icon("whatsapp")} Commander sur WhatsApp</a>

      <div class="info-box">${icon("truck")}<p>Livraison en <strong>24 h à Dakar</strong>, 48 – 72 h en régions. <strong>Offerte dès ${money(shop.delivery.freeFrom)}</strong>. Paiement par Wave ou Orange Money.</p></div>

      <div class="mt-6" style="border-top:1px solid var(--line)">
        <details class="accordion" open><summary>Détails & entretien ${icon("down")}</summary><div class="accordion-body"><ul class="bullets">${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div></details>
        <details class="accordion"><summary>Livraison ${icon("down")}</summary><div class="accordion-body"><ul>${shop.delivery.zones.map((z) => `<li><span>${esc(z.label)} <span class="muted">(${esc(z.delay)})</span></span><span>${money(z.fee)}</span></li>`).join("")}</ul><p class="mt-3">Livraison offerte dès ${money(shop.delivery.freeFrom)} d'achat.</p></div></details>
        <details class="accordion"><summary>Paiement ${icon("down")}</summary><div class="accordion-body">Paiement par Wave ou Orange Money. Vous recevez la confirmation de votre commande sur WhatsApp.</div></details>
      </div>
    </div>
  </div>
</div>
<section class="container section" id="related" style="border-top:1px solid var(--line)"></section>`;

/* Interactions */
const slider = $("#slider");
function go(i) {
  sel.index = (i + images.length) % images.length;
  slider.scrollTo({ left: sel.index * slider.clientWidth, behavior: "smooth" });
  updateIndex();
}
function updateIndex() {
  $$("[data-thumb]").forEach((b, i) => b.classList.toggle("on", i === sel.index));
  $$(".dots span").forEach((d, i) => d.classList.toggle("on", i === sel.index));
}
slider.addEventListener("scroll", () => {
  const i = Math.round(slider.scrollLeft / slider.clientWidth);
  if (i !== sel.index) {
    sel.index = i;
    updateIndex();
  }
}, { passive: true });
$$(".slide").forEach((s) => {
  const lens = $(".lens", s);
  s.addEventListener("mousemove", (e) => {
    if (!lens) return;
    const r = s.getBoundingClientRect();
    lens.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  s.addEventListener("click", () => openLightbox());
});
$("#zoom").addEventListener("click", () => openLightbox());

function waMessage() {
  return `Bonjour ${shop.name} 👋\nJe suis intéressée par cet article :\n\n*${p.name}*\nPrix : ${money(p.price)}\nTaille : ${sel.size ? sizeLabel(sel.size) : "à préciser"}\nCouleur : ${sel.color}\nQuantité : ${sel.qty}\n\n${location.href}`;
}
const updateWa = () => ($("#wa-order").href = waLink(shop.whatsapp, waMessage()));
updateWa();

const info = $(".product-layout");
info.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.thumb) go(Number(t.dataset.thumb));
  if (t.dataset.go) go(sel.index + Number(t.dataset.go));
  if (t.dataset.color) {
    sel.color = t.dataset.color;
    $$("[data-color]", info).forEach((b) => b.classList.toggle("on", b === t));
    $("#color-name").textContent = sel.color;
  }
  if (t.dataset.size) {
    sel.size = t.dataset.size;
    $$("[data-size]").forEach((b) => b.classList.toggle("on", b === t));
    $("#size-name").textContent = `: ${sizeLabel(sel.size)}`;
    $("#size-error").classList.add("hidden");
  }
  if (t.id === "qty-minus") sel.qty = Math.max(1, sel.qty - 1);
  if (t.id === "qty-plus") sel.qty = Math.min(Math.max(1, p.stock), 20, sel.qty + 1);
  $("#qty").textContent = sel.qty;
  if (t.id === "add") {
    if (!sel.size) return $("#size-error").classList.remove("hidden");
    cart.add(p, sel.size, sel.color, sel.qty);
    openCart(); // le panier latéral sert de confirmation
  }
  if (t.id === "fav") t.classList.toggle("on", favorites.toggle(p));
  if (t.id === "size-guide") openSizeGuide();
  updateWa();
});

/* Zoom plein écran */
function openLightbox() {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Photos en grand");
  document.body.append(box);
  document.body.classList.add("no-scroll");
  let zoomed = false;
  const render = () => {
    box.innerHTML = `
      <div class="lightbox-head"><span class="xs muted" style="letter-spacing:.2em">${sel.index + 1} / ${images.length}</span>
        <button class="icon-btn" data-close aria-label="Fermer">${icon("x")}</button></div>
      <div class="lightbox-stage"><img src="${esc(img(images[sel.index], 1600))}" alt="${esc(p.name)}"></div>
      <p class="xs muted text-center" style="padding:8px">Touchez l'image pour zoomer</p>
      ${images.length > 1 ? `<div class="lightbox-thumbs">${images.map((s, i) => `<button data-i="${i}" class="${i === sel.index ? "on" : ""}" aria-label="Photo ${i + 1}">${photo(s, "", { cls: "", sizes: "48px", width: 120 })}</button>`).join("")}</div>` : ""}`;
    zoomed = false;
  };
  const close = () => {
    box.remove();
    document.body.classList.remove("no-scroll");
    removeEventListener("keydown", onKey);
    go(sel.index);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") (sel.index = (sel.index + 1) % images.length), render();
    if (e.key === "ArrowLeft") (sel.index = (sel.index - 1 + images.length) % images.length), render();
  };
  addEventListener("keydown", onKey);
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return close();
    const b = e.target.closest("[data-i]");
    if (b) return (sel.index = Number(b.dataset.i)), render();
    const stage = e.target.closest(".lightbox-stage");
    if (stage) {
      const r = stage.getBoundingClientRect();
      const im = $("img", stage);
      zoomed = !zoomed;
      stage.classList.toggle("zoomed", zoomed);
      im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      im.style.transform = zoomed ? "scale(2.4)" : "none";
    }
  });
  box.addEventListener("mousemove", (e) => {
    const stage = e.target.closest(".lightbox-stage");
    if (!zoomed || !stage) return;
    const r = stage.getBoundingClientRect();
    $("img", stage).style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  render();
}

/* Guide des tailles */
function openSizeGuide() {
  const rows = [["XS", "34", "80–83", "62–65", "88–91"], ["S", "36", "84–87", "66–69", "92–95"], ["M", "38", "88–92", "70–74", "96–100"], ["L", "40", "93–97", "75–79", "101–105"], ["XL", "42", "98–103", "80–85", "106–111"], ["XXL", "44", "104–110", "86–92", "112–118"]];
  const m = document.createElement("div");
  m.className = "modal";
  m.setAttribute("role", "dialog");
  m.innerHTML = `<div class="overlay-bg" data-close></div><div class="modal-card">
    <button class="icon-btn modal-close" data-close aria-label="Fermer">${icon("x")}</button>
    <p class="eyebrow mb-2">Trouvez votre taille</p><h3 style="font-size:30px">Guide des tailles</h3>
    <div style="overflow-x:auto" class="mt-6"><table class="table size-table"><thead><tr><th>Taille</th><th>FR</th><th>Poitrine</th><th>Taille</th><th>Hanches</th></tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' style="font-weight:500"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="xs muted mt-4">Mesures en centimètres. Entre deux tailles ? Prenez la plus grande, ou écrivez-nous sur WhatsApp : nous vous conseillons avec plaisir.</p></div>`;
  document.body.append(m);
  m.addEventListener("click", (e) => e.target.closest("[data-close]") && m.remove());
}

/* Articles associés */
const all = await loadProducts();
const related = all
  .filter((x) => x.id !== p.id && (x.category === p.category || (p.collection && x.collection === p.collection)))
  .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category) || sortBy.popularite(a, b))
  .slice(0, 4);
if (related.length) {
  $("#related").innerHTML = `<p class="eyebrow text-center mb-2">À associer</p><h2 class="title text-center mb-10">Vous aimerez aussi</h2>
    <div class="grid-products cols-4">${related.map((r) => productCard(r)).join("")}</div>`;
} else $("#related").remove();
reveal();
