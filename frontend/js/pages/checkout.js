import { $, $$, payLogo, sizeLabel, api, cart, esc, icon, img, money } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";

const { shop } = await initLayout();
const root = $("#checkout");

if (!cart.items().length) {
  root.innerHTML = `<div class="empty-state"><p class="serif" style="font-size:30px">Votre panier est vide</p><a href="/boutique.html" class="btn btn-dark mt-8">Découvrir la boutique</a></div>`;
} else {
  const PAY = [
    { id: "cod", on: shop.payments.cod !== false, label: "Paiement à la livraison", text: "Payez en espèces à la réception de votre colis.", color: "#151313", ic: "cash" },
    { id: "wave", on: shop.payments.wave?.enabled !== false, label: "Wave", text: shop.payments.wave?.link ? "Après validation, l'application Wave s'ouvre pour finaliser le paiement." : "Payez par Wave : les instructions s'affichent après validation.", color: "#1DC8F2", ic: "mobile" },
    { id: "orange_money", on: shop.payments.orangeMoney?.enabled !== false, label: "Orange Money", text: "Payez par Orange Money : les instructions s'affichent après validation.", color: "#FF7900", ic: "mobile" },
  ].filter((x) => x.on);

  root.innerHTML = `
  <form class="checkout-layout" id="form" novalidate>
    <div>
      <fieldset><legend>1. Vos coordonnées</legend>
        <div class="form-grid cols-2">
          <div><label for="name" class="label">Nom complet *</label><input id="name" name="name" class="field" autocomplete="name" placeholder="Aïssatou Diop"><p class="field-error" data-err="name"></p></div>
          <div><label for="phone" class="label">Téléphone / WhatsApp *</label><input id="phone" name="phone" type="tel" inputmode="tel" class="field" autocomplete="tel" placeholder="77 123 45 67"><p class="field-error" data-err="phone"></p></div>
          <div class="span-2"><label for="email" class="label">E-mail (facultatif)</label><input id="email" name="email" type="email" class="field" autocomplete="email" placeholder="vous@exemple.com"><p class="field-error" data-err="email"></p></div>
        </div></fieldset>
      <fieldset><legend>2. Livraison</legend>
        <div class="form-grid">
          <div><label for="zone" class="label">Zone de livraison *</label><select id="zone" name="zone" class="field">${shop.delivery.zones.map((z) => `<option value="${esc(z.id)}">${esc(z.label)} — ${esc(z.delay)} — ${money(z.fee)}</option>`).join("")}</select></div>
          <div><label for="address" class="label">Adresse complète *</label><input id="address" name="address" class="field" autocomplete="street-address" placeholder="Quartier, rue, villa, point de repère…"><p class="field-error" data-err="address"></p></div>
          <div><label for="notes" class="label">Instructions (facultatif)</label><textarea id="notes" name="notes" rows="3" class="field" placeholder="Ex : appeler avant de passer, disponible après 17h…"></textarea></div>
        </div></fieldset>
      <fieldset><legend>3. Paiement</legend>
        ${PAY.map((x, i) => `<label class="pay-option ${i === 0 ? "on" : ""}"><input type="radio" name="payment" value="${x.id}" ${i === 0 ? "checked" : ""}>
          <span class="pay-logo" style="background:${x.color}">${payLogo(x.id) || icon(x.ic)}</span>
          <span><strong style="font-weight:500;display:block">${x.label}</strong><span class="small muted">${x.text}</span></span></label>`).join("")}
      </fieldset>
    </div>
    <aside class="summary">
      <h2>Votre commande</h2>
      <div class="summary-items">${cart
        .items()
        .map((i) => `<div class="summary-item"><div class="thumb-wrap"><img src="${esc(img(i.image, 120))}" alt=""><span class="q">${i.quantity}</span></div>
          <div style="flex:1"><p class="serif" style="font-size:17px;line-height:1.2">${esc(i.name)}</p><p class="xs muted">${esc(sizeLabel(i.size))} · ${esc(i.color)}</p></div><span>${money(i.price * i.quantity)}</span></div>`)
        .join("")}</div>
      <div class="summary-rows" style="border-top:1px solid var(--line);padding-top:20px">
        <div><span>Sous-total</span><span>${money(cart.subtotal())}</span></div>
        <div><span>Livraison</span><span id="fee"></span></div>
      </div>
      <div class="summary-total"><span style="letter-spacing:.15em;text-transform:uppercase">Total</span><strong id="total"></strong></div>
      <p class="alert-error mt-4 hidden" id="server-error" role="alert"></p>
      <button type="submit" class="btn btn-dark btn-block btn-lg mt-6" id="submit">Confirmer ma commande</button>
      <p class="xs muted text-center mt-4" style="display:flex;gap:6px;justify-content:center;align-items:center">${icon("lock")} Vos informations servent uniquement à la livraison.</p>
    </aside>
  </form>`;
  $$(".icon", $(".summary")).forEach((i) => (i.style.cssText = "width:12px;height:12px"));

  const form = $("#form");
  const fee = () => {
    const sub = cart.subtotal();
    const z = shop.delivery.zones.find((x) => x.id === form.zone.value) || shop.delivery.zones[0];
    return sub >= shop.delivery.freeFrom ? 0 : z.fee;
  };
  const updateTotals = () => {
    const f = fee();
    $("#fee").innerHTML = f === 0 ? '<span class="green">Offerte</span>' : money(f);
    $("#total").textContent = money(cart.subtotal() + f);
  };
  updateTotals();
  form.zone.addEventListener("change", updateTotals);
  form.addEventListener("change", (e) => {
    if (e.target.name === "payment") $$(".pay-option").forEach((l) => l.classList.toggle("on", l.contains(e.target)));
  });

  function validate() {
    const errs = {};
    if (form.name.value.trim().length < 2) errs.name = "Indiquez votre nom complet.";
    const d = form.phone.value.replace(/\D/g, "");
    if (d.length < 9 || d.length > 15) errs.phone = "Numéro invalide (ex : 77 123 45 67).";
    if (form.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) errs.email = "Adresse e-mail invalide.";
    if (form.address.value.trim().length < 5) errs.address = "Précisez votre adresse de livraison.";
    $$("[data-err]").forEach((p) => (p.textContent = errs[p.dataset.err] || ""));
    const first = Object.keys(errs)[0];
    if (first) form[first].focus();
    return !first;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#server-error").classList.add("hidden");
    if (!validate()) return;
    const btn = $("#submit");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Envoi…';
    try {
      const order = await api("/orders", {
        method: "POST",
        body: {
          customer: { name: form.name.value, phone: form.phone.value, email: form.email.value, address: form.address.value, zone: form.zone.value, notes: form.notes.value },
          paymentMethod: form.payment.value,
          items: cart.items().map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
        },
      });
      sessionStorage.setItem("mn_last_order", JSON.stringify(order));
      cart.clear();
      location.href = `/confirmation.html?ref=${order.reference}`;
    } catch (err) {
      $("#server-error").textContent = err.message;
      $("#server-error").classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Confirmer ma commande";
    }
  });
}
