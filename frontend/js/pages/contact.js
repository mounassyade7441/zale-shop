import { $, $$, api, esc, icon, money, waLink } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";

const { shop } = await initLayout();
$$("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));

$("#wa-card").href = waLink(shop.whatsapp, `Bonjour ${shop.name} 👋`);
$("#tel-link").href = `tel:+${shop.whatsapp}`;
if (shop.email) $("#mail-link").href = `mailto:${shop.email}`;
else $("#mail-item")?.remove();
const q = encodeURIComponent(shop.mapsQuery || `${shop.address}, ${shop.city}`);
$("#maps-link").href = `https://maps.google.com/?q=${q}`;
$("#map").innerHTML = `<iframe title="Plan d'accès ${esc(shop.name)}" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
$("#socials").innerHTML = [
  ["instagram", "Instagram", shop.social.instagram],
  ["facebook", "Facebook", shop.social.facebook],
  ["tiktok", "TikTok", shop.social.tiktok],
]
  .filter(([, , u]) => u)
  .map(([ic, l, u]) => `<a class="social-pill" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${icon(ic)} ${l}</a>`)
  .join("");
$("#zones").innerHTML = shop.delivery.zones.map((z) => `<li><span>${esc(z.label)} <span class="muted">· ${esc(z.delay)}</span></span><span>${money(z.fee)}</span></li>`).join("");
$("#free-from").textContent = `Livraison offerte dès ${money(shop.delivery.freeFrom)} d'achat.`;

$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const err = $("#contact-error");
  err.classList.add("hidden");
  const btn = $("button[type=submit]", form);
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Envoi…';
  try {
    await api("/messages", { method: "POST", body: data });
    form.outerHTML = `<div class="bg-cream-light empty-state mt-8" role="status">${icon("check")}
      <p class="serif" style="font-size:26px">Message envoyé</p>
      <p class="small muted mt-2">Merci ${esc(data.name.split(" ")[0])}, nous revenons vers vous très vite.</p></div>`;
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "Envoyer le message";
  }
});
