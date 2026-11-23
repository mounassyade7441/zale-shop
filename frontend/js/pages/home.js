import { $, $$, api, esc, icon, loadProducts, photo, reveal } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";
import { bindCards, productCard, selectBest, selectNew, selectPromo } from "../components.js?v=3";

const { shop, categories, collections } = await initLayout();
bindCards();
$$("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));

/* Bannière : image complète (avec texte intégré) ou version texte + 3 photos */
const h = shop.hero;
if (h.banner) {
  $("#hero").remove();
  const b = $("#hero-banner");
  b.classList.remove("hidden");
  b.innerHTML = `<a href="/boutique.html" aria-label="${esc(shop.name)} — ${esc(h.button)}">
      <img src="${esc(h.banner)}" alt="${esc(shop.name)} — ${esc(shop.tagline)}" fetchpriority="high"></a>
    <div class="hero-banner-cta"><a href="/boutique.html" class="btn btn-dark btn-block">${esc(h.button)} ${icon("arrow")}</a></div>`;
} else $("#hero-images").innerHTML = h.images
  .slice(0, 3)
  .map((src, i) => `<div>${photo(src, i === 0 ? `Mannequin — ${shop.name}` : "", { cls: "", sizes: "(min-width:1024px) 34vw, 100vw", ratio: 1.5, eager: true, width: 1280 })}</div>`)
  .join("");
if (!h.banner) {
  $("#hero-eyebrow").textContent = h.eyebrow;
  $("#hero-title").textContent = h.title;
  $("#hero-italic").textContent = h.titleItalic;
  $("#hero-text").textContent = h.text;
  $("#hero-button").textContent = h.button;
}

/* Catégories */
$("#categories").innerHTML = categories
  .map(
    (c, i) => `<a class="category reveal" style="transition-delay:${i * 60}ms" href="/boutique.html?categorie=${c.slug}">
      <div class="zoom-wrap">${photo(c.image, c.name, { cls: "photo", sizes: "(min-width:1024px) 12vw, 40vw", ratio: 1.4, width: 400 })}</div>
      <p>${esc(c.name)}</p></a>`,
  )
  .join("");

if (categories.length < 5) $("#categories").classList.add("few");

/* Collection à la une */
const f = collections.find((c) => c.slug === shop.featuredCollection) || collections[0];
if (f) {
  $("#featured").innerHTML = `<div class="container editorial">
    <div class="editorial-media reveal">
      ${photo(f.image, f.name, { cls: "photo ratio-45", sizes: "(min-width:1024px) 45vw, 100vw", ratio: 1.25 })}
      <div class="editorial-inset">${photo(shop.newsletterImage, "", { cls: "photo ratio-34", sizes: "220px", width: 400 })}</div>
    </div>
    <div class="reveal">
      <p class="eyebrow mb-4">${esc(f.subtitle)}</p>
      <h2 class="title-xl">${esc(f.name)}</h2>
      <div class="divider"></div>
      <p class="soft" style="max-width:440px">${esc(f.description)}</p>
      <a href="/collection.html?slug=${f.slug}" class="btn btn-dark mt-8">Explorer la collection</a>
    </div></div>`;
}

/* Collections */
$("#collections").innerHTML = collections
  .map(
    (c, i) => `<a class="collection-tile reveal" style="transition-delay:${(i % 2) * 120}ms" href="/collection.html?slug=${c.slug}">
      ${photo(c.image, c.name, { cls: "photo", sizes: "(min-width:640px) 50vw, 100vw", ratio: 0.75, width: 1200 })}
      <div class="collection-tile-text"><small>${esc(c.subtitle)}</small><h3>${esc(c.name)}</h3><span>Découvrir ${icon("arrow")}</span></div></a>`,
  )
  .join("");

/* Promotions */
$("#promo-eyebrow").textContent = shop.promo.eyebrow;
$("#promo-title").innerHTML = esc(shop.promo.title).replace(/(-?\d+\s?%)/, "<span>$1</span>");
$("#promo-subtitle").textContent = shop.promo.subtitle;
$("#promo-text").textContent = shop.promo.text;
function tick() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  let left = Math.max(0, end - now);
  const parts = [86400000, 3600000, 60000, 1000].map((u) => {
    const v = Math.floor(left / u);
    left -= v * u;
    return String(v).padStart(2, "0");
  });
  const box = $("#countdown");
  if (!box) return clearInterval(timer); // section promotions masquée
  box.innerHTML = ["Jours", "Heures", "Min", "Sec"].map((l, i) => `<div><strong>${parts[i]}</strong><small>${l}</small></div>`).join("");
}
const timer = setInterval(tick, 1000);
tick();

/* Avantages & avis */
$("#perk-delivery").textContent = `24 h à Dakar, offerte dès ${new Intl.NumberFormat("fr-FR").format(shop.delivery.freeFrom)} F`;
$("#testimonials").innerHTML = (shop.testimonials || [])
  .map((t) => `<div class="testimonial reveal"><p class="stars" aria-label="5 étoiles sur 5">★★★★★</p><blockquote>« ${esc(t.text)} »</blockquote><cite>${esc(t.name)}</cite></div>`)
  .join("");
$("#newsletter-media").innerHTML = photo(shop.newsletterImage, "", { cls: "", sizes: "50vw", ratio: 1.1, width: 1000 });

/* Produits */
reveal();
const products = await loadProducts();
const fill = (id, list) => ($(id).innerHTML = list.map((p) => productCard(p)).join(""));
fill("#new-products", selectNew(products, 8));
fill("#best-products", selectBest(products, 8));
const promos = selectPromo(products, 4);
if (promos.length) fill("#promo-products", promos);
else $("#promo-section").remove(); // pas d'article en promotion : on masque la section
reveal();

/* Newsletter */
$("#newsletter").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#newsletter-msg");
  try {
    await api("/newsletter", { method: "POST", body: { email: $("#nl-email").value } });
    e.target.outerHTML = `<p class="serif italic" style="font-size:22px" role="status">Merci ! Vous recevrez bientôt nos nouveautés et offres exclusives ✦</p>`;
    msg.remove();
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = "var(--error)";
  }
});
