import { $, payLogo, sizeLabel, esc, icon, img, money, waLink } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";

const { shop } = await initLayout();
const root = $("#confirmation");
const LABELS = { cod: "Paiement à la livraison", wave: "Wave", orange_money: "Orange Money" };

let order = null;
try {
  order = JSON.parse(sessionStorage.getItem("mn_last_order"));
} catch {}

/** Message WhatsApp récapitulatif envoyé à la boutique. */
function message(o) {
  const zone = shop.delivery.zones.find((z) => z.id === o.customer.zone);
  return [
    `🛍️ *Nouvelle commande ${o.reference}*`,
    "",
    ...o.items.map((i) => `• ${i.quantity} × ${i.name} (${sizeLabel(i.size)}, ${i.color}) — ${money(i.price * i.quantity)}`),
    "",
    `Sous-total : ${money(o.subtotal)}`,
    `Livraison : ${o.deliveryFee === 0 ? "Offerte" : money(o.deliveryFee)}`,
    `*Total : ${money(o.total)}*`,
    "",
    `💳 Paiement : ${LABELS[o.paymentMethod]}`,
    "",
    `👤 ${o.customer.name}`,
    `📞 ${o.customer.phone}`,
    `📍 ${o.customer.address}${zone ? ` — ${zone.label}` : ""}`,
    ...(o.customer.notes ? [`📝 ${o.customer.notes}`] : []),
    "",
    "Merci de me confirmer la commande 🙏",
  ].join("\n");
}

/**
 * Lien de paiement Wave Business (https://pay.wave.com/m/…) avec le montant de la commande pré-rempli.
 * Sur téléphone, ce lien ouvre directement l'application Wave.
 */
function waveLink(base, amount) {
  try {
    const url = new URL(base);
    if (!url.searchParams.has("amount")) url.searchParams.set("amount", String(Math.round(amount)));
    return url.toString();
  } catch {
    return "";
  }
}

if (!order) {
  root.className = "empty-state";
  root.innerHTML = `<p class="serif" style="font-size:34px">Aucune commande récente</p><a href="/boutique.html" class="btn btn-dark mt-8">Retour à la boutique</a>`;
} else {
  root.className = "";
  const pay = shop.payments;
  const waveUrl = order.paymentMethod === "wave" && pay.wave?.link ? waveLink(pay.wave.link, order.total) : "";
  const payBlock =
    order.paymentMethod === "cod"
      ? `<div class="bg-cream-light mt-6" style="padding:28px"><p class="eyebrow mb-2">Paiement à la livraison</p>
         <p class="small soft">Préparez <strong>${money(order.total)}</strong> en espèces pour le livreur. Vous pouvez aussi régler par Wave ou Orange Money à la réception.</p></div>`
      : `<div class="bg-cream-light mt-6" style="padding:28px"><div style="display:flex;align-items:center;gap:12px" class="mb-4">${payLogo(order.paymentMethod, "pay-img lg")}<p class="eyebrow">Paiement ${LABELS[order.paymentMethod]}</p></div>
         <p class="small soft">${
           order.paymentMethod === "wave" && waveUrl
             ? `Réglez <strong>${money(order.total)}</strong> dans l'application Wave (elle s'ouvre automatiquement), en indiquant la référence <strong>${esc(order.reference)}</strong>. Si elle ne s'ouvre pas, touchez « Payer avec Wave ».`
             : order.paymentMethod === "wave"
             ? `Envoyez <strong>${money(order.total)}</strong> par Wave au numéro ci-dessous, en indiquant la référence <strong>${esc(order.reference)}</strong>.`
             : `Composez <strong>#144#</strong> ou ouvrez l'application Orange Money pour envoyer <strong>${money(order.total)}</strong> au numéro ci-dessous${pay.orangeMoney.merchantCode ? ` (code marchand ${esc(pay.orangeMoney.merchantCode)})` : ""}, avec la référence <strong>${esc(order.reference)}</strong>.`
         }</p>
         <div class="pay-number"><strong>${esc(order.paymentMethod === "wave" ? pay.wave.number : pay.orangeMoney.number)}</strong>
           <button class="xs" id="copy" style="display:flex;gap:6px;align-items:center;letter-spacing:.15em;text-transform:uppercase">${icon("copy")} Copier</button></div>
         ${waveUrl ? `<a id="wave-pay" href="${esc(waveUrl)}" class="btn btn-lg mt-4" style="background:#1DC8F2;color:#fff">Payer ${money(order.total)} avec Wave</a>` : ""}
         <p class="xs muted mt-4">Envoyez ensuite la capture du paiement sur WhatsApp. <span id="copied" class="green"></span></p></div>`;

  root.innerHTML = `
    <div class="text-center">
      <span style="display:inline-block;color:var(--gold)" class="fade-up">${icon("check")}</span>
      <p class="eyebrow mt-6">Merci ${esc(order.customer.name.split(" ")[0])} !</p>
      <h1 class="title-xl mt-2">Commande enregistrée</h1>
      <p class="soft mt-4">Référence <strong style="letter-spacing:.08em">${esc(order.reference)}</strong></p>
    </div>
    <div class="confirm-box">
      <p class="serif" style="font-size:26px">Dernière étape : confirmez sur WhatsApp</p>
      <p class="small soft mt-2" style="max-width:440px;margin-inline:auto">Envoyez-nous le récapitulatif en un clic : notre équipe vous confirme la disponibilité et l'heure de livraison.</p>
      <a href="${esc(waLink(shop.whatsapp, message(order)))}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-lg mt-6">${icon("whatsapp")} Envoyer ma commande sur WhatsApp</a>
    </div>
    ${payBlock}
    <h2 class="title mt-10" style="font-size:28px">Récapitulatif</h2>
    <div class="summary-items" style="max-height:none;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0">${order.items
      .map((i) => `<div class="summary-item"><img src="${esc(img(i.image, 120))}" alt=""><div style="flex:1"><p class="serif" style="font-size:18px">${esc(i.name)}</p><p class="xs muted">${i.quantity} × ${esc(sizeLabel(i.size))} · ${esc(i.color)}</p></div><span>${money(i.price * i.quantity)}</span></div>`)
      .join("")}</div>
    <div class="summary-rows">
      <div><span>Sous-total</span><span>${money(order.subtotal)}</span></div>
      <div><span>Livraison</span><span>${order.deliveryFee === 0 ? "Offerte" : money(order.deliveryFee)}</span></div>
    </div>
    <div class="summary-total"><span>Total</span><strong>${money(order.total)}</strong></div>
    <p class="small soft mt-6">Livraison à : ${esc(order.customer.address)} · ${esc(order.customer.phone)}</p>
    <div class="text-center mt-12"><a href="/boutique.html" class="btn btn-outline">Continuer mes achats</a></div>`;
  $("#copy")?.addEventListener("click", () => {
    const n = order.paymentMethod === "wave" ? pay.wave.number : pay.orangeMoney.number;
    navigator.clipboard?.writeText(n.replace(/\s/g, "")).then(() => ($("#copied").textContent = "Numéro copié ✓"));
  });

  /* Paiement Wave : ouvre l'application Wave automatiquement, une seule fois par commande
     (pas à chaque actualisation ni au retour sur la page). */
  if (waveUrl) {
    const key = `wave_opened_${order.reference}`;
    let already = false;
    try {
      already = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {}
    if (!already) setTimeout(() => location.assign(waveUrl), 1200);
  }
}
