import { $, api, esc, formatDate, icon, money, waLink } from "../core.js?v=3";
import { downloadCsv, initAdmin, onAuthError } from "./shell.js?v=3";

await initAdmin();
let customers = [];

function render() {
  const s = $("#q").value.trim().toLowerCase();
  const d = s.replace(/\D/g, "");
  const list = customers.filter((c) => !s || c.name.toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || (d.length > 3 && c.phone.replace(/\D/g, "").includes(d)));
  $("#list").innerHTML = list.length
    ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Cliente</th><th>Adresse</th><th>Commandes</th><th>Total dépensé</th><th>Dernière commande</th><th></th></tr></thead><tbody>
      ${list
        .map((c) => {
          return `<tr><td><p style="font-weight:500">${esc(c.name)}</p><p class="xs muted">${esc(c.phone)}${c.email ? ` · ${esc(c.email)}` : ""}</p></td>
            <td class="soft">${esc(c.address)}</td>
            <td><a class="underline" href="/admin/commandes.html?ref=${encodeURIComponent(c.phone)}">${c.ordersCount}</a></td>
            <td>${money(c.totalSpent)}</td><td class="xs muted">${formatDate(c.lastOrderAt)}</td>
            <td><a href="${esc(waLink(c.phone))}" target="_blank" rel="noopener noreferrer" style="color:#128c4b" aria-label="WhatsApp ${esc(c.name)}">${icon("whatsapp")}</a></td></tr>`;
        })
        .join("")}</tbody></table></div>`
    : '<p class="muted" style="padding:40px;text-align:center">Aucune cliente.</p>';
}

try {
  const [c, subs] = await Promise.all([api("/admin/customers"), api("/admin/subscribers")]);
  customers = c;
  render();
  $("#q").addEventListener("input", render);
  if (customers.length) {
    $("#actions").innerHTML = `<button class="btn btn-outline" id="export">${icon("download")} Exporter (CSV)</button>`;
    $("#export").onclick = () =>
      downloadCsv("clientes.csv", [["Nom", "Téléphone", "E-mail", "Adresse", "Commandes", "Total dépensé", "Dernière commande"], ...customers.map((x) => [x.name, x.phone, x.email, x.address, x.ordersCount, x.totalSpent, x.lastOrderAt])]);
  }
  $("#newsletter").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><h2 style="margin:0">Abonnées newsletter <span class="muted">(${subs.length})</span></h2>
      ${subs.length ? `<button class="btn btn-outline" id="export-nl" style="padding:10px 16px">${icon("download")} Exporter</button>` : ""}</div>
    ${
      subs.length
        ? `<ul class="mt-4" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 24px">${subs.map((x) => `<li class="small" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(x.email)}</span><span class="xs muted">${new Date(x.created_at).toLocaleDateString("fr-FR")}</span></li>`).join("")}</ul>`
        : '<p class="muted small mt-4">Aucune inscription pour le moment.</p>'
    }`;
  $("#export-nl")?.addEventListener("click", () => downloadCsv("newsletter.csv", [["E-mail", "Date"], ...subs.map((x) => [x.email, x.created_at])]));
} catch (e) {
  onAuthError(e);
}
