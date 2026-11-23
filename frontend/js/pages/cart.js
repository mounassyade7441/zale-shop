import { $, sizeLabel, cart, esc, icon, img, money } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";

const { shop } = await initLayout();
const root = $("#cart");

function render() {
  const items = cart.items();
  if (!items.length) {
    root.innerHTML = `<div class="empty-state">${icon("bag")}<p class="serif" style="font-size:30px">Votre panier est vide</p>
      <p class="muted mt-2">Nos nouvelles pièces n'attendent que vous.</p><a href="/boutique.html" class="btn btn-dark mt-8">Découvrir la boutique</a></div>`;
    return;
  }
  const sub = cart.subtotal();
  const remaining = shop.delivery.freeFrom - sub;
  const minFee = Math.min(...shop.delivery.zones.map((z) => z.fee));
  root.innerHTML = `<div class="cart-layout">
    <div>
      <ul>${items
        .map(
          (i) => `<li class="cart-page-line">
          <a href="/produit.html?slug=${encodeURIComponent(i.slug)}"><img src="${esc(img(i.image, 240))}" alt="${esc(i.name)}"></a>
          <div>
            <a href="/produit.html?slug=${encodeURIComponent(i.slug)}" class="serif" style="font-size:22px">${esc(i.name)}</a>
            <p class="small muted mt-1">Taille ${esc(sizeLabel(i.size))} · ${esc(i.color)}</p>
            <p class="small mt-1">${money(i.price)}</p>
            <div class="actions">
              <div class="qty"><button data-dec="${esc(i.key)}" ${i.quantity <= 1 ? "disabled" : ""} aria-label="Diminuer la quantité">${icon("minus")}</button><span>${i.quantity}</span><button data-inc="${esc(i.key)}" aria-label="Augmenter la quantité">${icon("plus")}</button></div>
              <button class="xs underline" data-remove="${esc(i.key)}" aria-label="Retirer ${esc(i.name)}">Retirer</button>
            </div>
          </div>
          <p class="small" style="font-weight:500">${money(i.price * i.quantity)}</p>
        </li>`,
        )
        .join("")}</ul>
      <div class="mt-6" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <a href="/boutique.html" class="small underline">← Continuer mes achats</a>
        <button class="small muted underline" id="clear">Vider le panier</button>
      </div>
    </div>
    <aside class="summary">
      <h2>Récapitulatif</h2>
      <div class="summary-rows">
        <div><span>Articles (${cart.count()})</span><span>${money(sub)}</span></div>
        <div><span>Livraison</span><span>${remaining <= 0 ? '<span class="green">Offerte</span>' : `dès ${money(minFee)}`}</span></div>
      </div>
      ${remaining > 0 ? `<p class="xs muted mt-4">Plus que ${money(remaining)} pour profiter de la livraison offerte.</p>` : ""}
      <div class="summary-total"><span style="letter-spacing:.15em;text-transform:uppercase">Sous-total</span><strong>${money(sub)}</strong></div>
      <a href="/commande.html" class="btn btn-dark btn-block btn-lg mt-6">Valider ma commande</a>
      <ul class="perks-list"><li>✦ Wave & Orange Money acceptés</li><li>✦ Confirmation par WhatsApp</li><li>✦ Livraison partout au Sénégal</li></ul>
    </aside></div>`;
}

root.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const item = (k) => cart.items().find((i) => i.key === k);
  if (t.dataset.remove) cart.remove(t.dataset.remove);
  if (t.dataset.inc) cart.setQty(t.dataset.inc, item(t.dataset.inc).quantity + 1);
  if (t.dataset.dec) cart.setQty(t.dataset.dec, item(t.dataset.dec).quantity - 1);
  if (t.id === "clear" && confirm("Vider le panier ?")) cart.clear();
});
addEventListener("cart:change", render);
render();
