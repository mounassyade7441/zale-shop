/* Carte produit réutilisée partout (accueil, boutique, favoris…). */
import { sizeLabel, cart, discount, esc, favorites, icon, money, photo, toast } from "./core.js?v=3";

const registry = new Map();

export function productCard(p, { eager = false } = {}) {
  registry.set(String(p.id), p);
  const off = discount(p);
  const soldOut = p.stock <= 0;
  const href = `/produit.html?slug=${encodeURIComponent(p.slug)}`;
  const tu = p.sizes[0] === "TU";
  const sizes = "(min-width:1280px) 22vw, (min-width:768px) 30vw, 50vw";
  return `
  <article class="card" data-id="${p.id}">
    <div class="card-media">
      <a href="${href}" tabindex="-1" aria-label="${esc(p.name)}">
        ${photo(p.images[0], p.name, { cls: "photo", sizes, eager })}
        ${p.images[1] ? photo(p.images[1], "", { cls: "photo img-hover", sizes }) : ""}
      </a>
      <div class="badges">
        ${soldOut ? '<span class="badge badge-dark">Épuisé</span>' : ""}
        ${p.isNew && !soldOut ? '<span class="badge">Nouveau</span>' : ""}
        ${off ? `<span class="badge badge-sale">-${off}%</span>` : ""}
        ${p.isBestSeller && !p.isNew && !off ? '<span class="badge badge-gold">Best-seller</span>' : ""}
      </div>
      <button class="fav-btn ${favorites.has(p.id) ? "on" : ""}" data-fav="${p.id}" aria-label="Ajouter aux favoris" aria-pressed="${favorites.has(p.id)}">${icon("heart")}</button>
      ${
        soldOut
          ? ""
          : `<button class="quick-btn" data-quick-open aria-label="Ajout rapide : ${esc(p.name)}">${icon("plus")}</button>
      <div class="quick">
        <div class="quick-head"><span>${tu ? "Taille standard" : "Ajouter · choisir la taille"}</span>
          <button data-quick-close aria-label="Fermer">${icon("x")}</button></div>
        ${
          p.colors.length > 1
            ? `<div class="swatches mb-2">${p.colors.map((c, i) => `<button class="swatch ${i === 0 ? "on" : ""}" data-color="${esc(c.name)}" title="${esc(c.name)}" aria-label="Couleur ${esc(c.name)}" style="background:${esc(c.hex)}"></button>`).join("")}</div>`
            : ""
        }
        ${
          tu
            ? '<button class="btn btn-dark btn-block" style="padding:10px;font-size:10px" data-add="TU">Ajouter au panier</button>'
            : `<div class="quick-sizes">${p.sizes.map((s) => `<button data-add="${s}">${s}</button>`).join("")}</div>`
        }
        <a class="view" href="${href}">Voir le produit</a>
      </div>`
      }
    </div>
    <div class="card-info">
      <h3 class="card-name"><a href="${href}">${esc(p.name)}</a></h3>
      <p class="card-price"><span class="${off ? "price-sale" : ""}">${money(p.price)}</span>${off ? `<s class="price-old">${money(p.compareAtPrice)}</s>` : ""}</p>
      <div class="card-meta">${p.colors.map((c) => `<span class="swatch sm" title="${esc(c.name)}" style="background:${esc(c.hex)}"></span>`).join("")}
        ${tu ? "" : `<span class="card-sizes">${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}</span>`}</div>
    </div>
  </article>`;
}

/* Gestion des clics sur toutes les cartes de la page (une seule fois) */
let bound = false;
export function bindCards() {
  if (bound) return;
  bound = true;
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const p = registry.get(card.dataset.id);
    if (!p) return;
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      const on = favorites.toggle(p);
      fav.classList.toggle("on", on);
      fav.setAttribute("aria-pressed", on);
      return;
    }
    if (e.target.closest("[data-quick-open]")) card.querySelector(".quick").classList.add("open");
    if (e.target.closest("[data-quick-close]")) card.querySelector(".quick").classList.remove("open");
    const sw = e.target.closest("[data-color]");
    if (sw) {
      card.querySelectorAll("[data-color]").forEach((b) => b.classList.toggle("on", b === sw));
    }
    const add = e.target.closest("[data-add]");
    if (add) {
      const color = card.querySelector("[data-color].on")?.dataset.color || p.colors[0]?.name || "";
      cart.add(p, add.dataset.add, color);
      card.querySelector(".quick").classList.remove("open");
      toast({ title: "Ajouté au panier", text: `${p.name} · ${sizeLabel(add.dataset.add)} · ${color}`, image: p.images[0], link: { href: "/panier.html", label: "Voir le panier" } });
    }
  });
}

/* Sélections de produits */
export const sortBy = {
  popularite: (a, b) => b.popularity - a.popularity,
  nouveautes: (a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt),
  "prix-asc": (a, b) => a.price - b.price,
  "prix-desc": (a, b) => b.price - a.price,
};
export const isPromo = (p) => p.compareAtPrice && p.compareAtPrice > p.price;
export const selectNew = (list, n = 8) => list.filter((p) => p.isNew).sort(sortBy.nouveautes).slice(0, n);
export const selectBest = (list, n = 8) => list.filter((p) => p.isBestSeller).sort(sortBy.popularite).slice(0, n);
export const selectPromo = (list, n = 8) => list.filter(isPromo).sort(sortBy.popularite).slice(0, n);
