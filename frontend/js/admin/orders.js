import { $, api, sizeLabel, esc, formatDate, icon, img, money, qs, toast, waLink } from "../core.js?v=3";
import { initAdmin, onAuthError, PAYMENT, STATUS, statusBadge } from "./shell.js?v=3";

const { shop } = await initAdmin();
let orders = [];
let filter = "";
let open = qs("ref");
if (qs("ref")) $("#q").value = qs("ref");

function customerWa(o) {
  const text = `Bonjour ${o.customer.name.split(" ")[0]}, ici ${shop.name} 🌸\nVotre commande ${o.reference} (${money(o.total)}) est : *${STATUS[o.status]}*.\nMerci pour votre confiance !`;
  return waLink(o.customer.phone, text);
}

function render() {
  const counts = {};
  orders.forEach((o) => (counts[o.status] = (counts[o.status] || 0) + 1));
  $("#subtitle").textContent = `${orders.length} commandes au total`;
  $("#tabs").innerHTML = [["", "Toutes", orders.length], ...Object.entries(STATUS).map(([k, l]) => [k, l, counts[k] || 0])]
    .map(([k, l, n]) => `<button class="chip ${filter === k ? "active" : ""}" data-tab="${k}">${l} <span style="opacity:.6">(${n})</span></button>`)
    .join("");
  const s = $("#q").value.trim().toLowerCase();
  const digits = s.replace(/\D/g, "");
  const list = orders.filter(
    (o) => (!filter || o.status === filter) && (!s || o.reference.toLowerCase().includes(s) || o.customer.name.toLowerCase().includes(s) || (digits.length > 3 && o.customer.phone.replace(/\D/g, "").includes(digits))),
  );
  $("#list").innerHTML = list.length
    ? `<div class="rows">${list
        .map((o) => {
          const isOpen = open === String(o.id) || open === o.reference;
          const zone = shop.delivery.zones.find((z) => z.id === o.customer.zone);
          return `<div data-id="${o.id}">
          <button class="order-row" data-toggle>
            <strong style="font-weight:500">${esc(o.reference)}</strong>
            <span class="soft small">${esc(o.customer.name)} <span class="muted">· ${esc(o.customer.phone)}</span></span>
            <span class="xs muted">${formatDate(o.createdAt)}</span>
            <span class="small">${money(o.total)}</span>
            <span>${statusBadge(o.status)}</span>
          </button>
          ${
            isOpen
              ? `<div class="order-detail">
              <div><p class="label mb-4">Articles</p>
                <div class="summary-items" style="max-height:none">${o.items.map((i) => `<div class="summary-item"><img src="${esc(img(i.image, 120))}" alt="" style="width:48px"><div style="flex:1"><p>${esc(i.name)}</p><p class="xs muted">Taille ${esc(sizeLabel(i.size))} · ${esc(i.color)} · ${i.quantity} × ${money(i.price)}</p></div><span>${money(i.price * i.quantity)}</span></div>`).join("")}</div>
                <div class="summary-rows" style="border-top:1px solid var(--line);padding-top:12px">
                  <div><span>Sous-total</span><span>${money(o.subtotal)}</span></div>
                  <div><span>Livraison</span><span>${o.deliveryFee ? money(o.deliveryFee) : "Offerte"}</span></div>
                  <div style="font-weight:500"><span>Total</span><span>${money(o.total)}</span></div></div>
              </div>
              <div class="small" style="display:grid;gap:16px;align-content:start">
                <div><p class="label">Cliente</p><p>${esc(o.customer.name)}</p><p><a class="underline" href="tel:${esc(o.customer.phone.replace(/\s/g, ""))}">${esc(o.customer.phone)}</a></p>${o.customer.email ? `<p><a class="underline" href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></p>` : ""}</div>
                <div><p class="label">Livraison</p><p>${esc(o.customer.address)}</p><p class="muted">${esc(zone?.label || o.customer.zone)}</p>${o.customer.notes ? `<p class="italic soft mt-1">« ${esc(o.customer.notes)} »</p>` : ""}</div>
                <div><p class="label">Paiement</p><p>${PAYMENT[o.paymentMethod]}</p></div>
                <div><label class="label" for="st-${o.id}">Statut de la commande</label>
                  <select class="field" id="st-${o.id}" data-status>${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${l}</option>`).join("")}</select>
                  <p class="xs muted mt-1">Une commande annulée remet automatiquement les articles en stock.</p></div>
                <a class="btn btn-whatsapp btn-block" href="${esc(customerWa(o))}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")} Prévenir la cliente</a>
              </div></div>`
              : ""
          }</div>`;
        })
        .join("")}</div>`
    : '<p class="muted" style="padding:40px;text-align:center">Aucune commande.</p>';
}

$("#tabs").addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (t) {
    filter = t.dataset.tab;
    render();
  }
});
$("#q").addEventListener("input", render);
$("#list").addEventListener("click", (e) => {
  const row = e.target.closest("[data-id]");
  if (row && e.target.closest("[data-toggle]")) {
    open = open === row.dataset.id ? null : row.dataset.id;
    render();
  }
});
$("#list").addEventListener("change", async (e) => {
  if (!e.target.matches("[data-status]")) return;
  const o = orders.find((x) => String(x.id) === e.target.closest("[data-id]").dataset.id);
  try {
    await api(`/admin/orders/${o.id}`, { method: "PATCH", body: { status: e.target.value } });
    o.status = e.target.value;
    open = String(o.id);
    render();
    toast({ title: "Statut mis à jour", text: `${o.reference} → ${STATUS[o.status]}` });
  } catch (err) {
    onAuthError(err);
  }
});

try {
  orders = await api("/admin/orders");
  render();
} catch (e) {
  onAuthError(e);
}
