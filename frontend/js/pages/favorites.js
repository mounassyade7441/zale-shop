import { $, favorites, icon, loadProducts } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";
import { bindCards, productCard } from "../components.js?v=3";

await initLayout();
bindCards();
const products = await loadProducts();

function render() {
  const list = products.filter((p) => favorites.has(p.id));
  $("#favorites").innerHTML = list.length
    ? `<div class="grid-products cols-4">${list.map((p) => productCard(p)).join("")}</div>`
    : `<div class="empty-state">${icon("heart")}<p class="serif" style="font-size:30px">Aucun favori pour le moment</p>
       <p class="muted mt-2" style="max-width:380px;margin-inline:auto">Touchez le cœur sur un article pour le retrouver ici et le commander plus tard.</p>
       <a href="/boutique.html" class="btn btn-dark mt-8">Découvrir la boutique</a></div>`;
}
addEventListener("fav:change", render);
render();
