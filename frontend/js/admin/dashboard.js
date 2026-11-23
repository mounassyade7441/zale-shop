import { $, api, esc, formatDate, icon, img, money } from "../core.js?v=3";
import { initAdmin, onAuthError, statusBadge } from "./shell.js?v=3";

await initAdmin();
try {
  const [orders, products, customers, messages] = await Promise.all([api("/admin/orders"), api("/admin/products"), api("/admin/customers"), api("/admin/messages")]);
  const valid = orders.filter((o) => o.status !== "annulee");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const month = valid.filter((o) => o.createdAt >= monthStart).reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "nouvelle").length;
  const low = products.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock);
  const unread = messages.filter((m) => !m.is_read).length;

  const stat = (label, value, hint, ic, href) =>
    `<a class="box stat" ${href ? `href="${href}"` : ""}><div class="stat-head"><span>${label}</span>${icon(ic)}</div><strong>${value}</strong><p class="xs muted">${hint}</p></a>`;

  $("#dashboard").innerHTML = `
    <div class="stats">
      ${stat("Chiffre d'affaires", money(revenue), `Ce mois : ${money(month)}`, "chart")}
      ${stat("Commandes", orders.length, `${pending} à traiter`, "cart", "/admin/commandes.html")}
      ${stat("Produits", products.length, `${low.length} en stock faible`, "box", "/admin/produits.html")}
      ${stat("Clientes", customers.length, `${unread} message(s) non lu(s)`, "users", "/admin/clientes.html")}
    </div>
    <div class="dash-grid">
      <div class="box">
        <div style="display:flex;justify-content:space-between;align-items:center"><h2>Dernières commandes</h2>
          <a href="/admin/commandes.html" class="more-link">Tout voir ${icon("arrow")}</a></div>
        <div class="rows">${
          orders.length
            ? orders
                .slice(0, 6)
                .map((o) => `<a class="row-link" href="/admin/commandes.html?ref=${o.reference}">
                  <strong style="min-width:9rem;font-weight:500">${esc(o.reference)}</strong>
                  <span class="soft" style="flex:1">${esc(o.customer.name)}</span>
                  <span class="xs muted">${formatDate(o.createdAt)}</span>
                  <span style="min-width:7rem;text-align:right">${money(o.total)}</span>${statusBadge(o.status)}</a>`)
                .join("")
            : '<p class="muted small" style="padding:40px 0;text-align:center">Aucune commande pour le moment.</p>'
        }</div>
      </div>
      <div class="box">
        <h2 style="display:flex;gap:8px;align-items:center">${icon("alert")} Stock faible</h2>
        <div class="rows">${
          low.length
            ? low
                .slice(0, 8)
                .map((p) => `<a class="row-link" href="/admin/produit.html?id=${p.id}" style="flex-wrap:nowrap">
                  <img class="mini" style="width:40px" src="${esc(img(p.images[0], 100))}" alt="">
                  <span style="flex:1">${esc(p.name)}</span>
                  <span class="small" style="color:${p.stock === 0 ? "var(--error)" : "var(--blush-dark)"}">${p.stock === 0 ? "Épuisé" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}</span></a>`)
                .join("")
            : '<p class="muted small" style="padding:40px 0;text-align:center">Tous les stocks sont confortables.</p>'
        }</div>
      </div>
    </div>`;
} catch (e) {
  onAuthError(e);
}
