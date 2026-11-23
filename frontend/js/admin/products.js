import { $, api, esc, icon, img, money, norm, toast } from "../core.js?v=3";
import { initAdmin, onAuthError } from "./shell.js?v=3";

const { categories } = await initAdmin();
let products = [];
const catName = (s) => categories.find((c) => c.slug === s)?.name || s;
$("#cat").innerHTML += categories.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join("");

async function load() {
  try {
    products = await api("/admin/products");
    render();
  } catch (e) {
    onAuthError(e);
  }
}

function render() {
  const q = norm($("#q").value);
  const cat = $("#cat").value;
  const list = products.filter((p) => (!q || norm(`${p.name} ${catName(p.category)}`).includes(q)) && (!cat || p.category === cat));
  $("#subtitle").textContent = `${products.length} articles au catalogue`;
  $("#list").innerHTML = list.length
    ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Tailles</th><th style="text-align:right">Actions</th></tr></thead><tbody>
      ${list
        .map(
          (p) => `<tr data-id="${p.id}">
        <td><div style="display:flex;gap:12px;align-items:center"><img class="mini" src="${esc(img(p.images[0], 120))}" alt="">
          <div><a href="/admin/produit.html?id=${p.id}" style="font-weight:500">${esc(p.name)}</a>
          <div style="display:flex;gap:4px;margin-top:4px">${p.isNew ? '<span class="tag">Nouveau</span>' : ""}${p.isBestSeller ? '<span class="tag gold">Best</span>' : ""}${p.compareAtPrice > p.price ? '<span class="tag blush">Promo</span>' : ""}</div></div></div></td>
        <td class="soft">${esc(catName(p.category))}</td>
        <td>${money(p.price)}${p.compareAtPrice > p.price ? `<s class="price-old" style="display:block">${money(p.compareAtPrice)}</s>` : ""}</td>
        <td><div class="qty"><button data-stock="-1" aria-label="Retirer 1 du stock">${icon("minus")}</button><span style="color:${p.stock === 0 ? "var(--error)" : p.stock <= 3 ? "var(--blush-dark)" : "inherit"}">${p.stock}</span><button data-stock="1" aria-label="Ajouter 1 au stock">${icon("plus")}</button></div></td>
        <td class="xs soft">${p.sizes.join(" · ")}</td>
        <td><div style="display:flex;justify-content:flex-end;gap:4px">
          <a class="icon-btn" href="/produit.html?slug=${encodeURIComponent(p.slug)}" target="_blank" aria-label="Voir sur la boutique">${icon("external")}</a>
          <a class="icon-btn" href="/admin/produit.html?id=${p.id}" aria-label="Modifier ${esc(p.name)}">${icon("edit")}</a>
          <button class="icon-btn" data-delete aria-label="Supprimer ${esc(p.name)}">${icon("trash")}</button></div></td>
      </tr>`,
        )
        .join("")}</tbody></table></div>`
    : '<p class="muted" style="padding:40px;text-align:center">Aucun produit.</p>';
}

$("#q").addEventListener("input", render);
$("#cat").addEventListener("change", render);
$("#list").addEventListener("click", async (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  const p = products.find((x) => String(x.id) === row.dataset.id);
  const st = e.target.closest("[data-stock]");
  try {
    if (st) {
      const stock = Math.max(0, p.stock + Number(st.dataset.stock));
      await api(`/admin/products/${p.id}/stock`, { method: "PATCH", body: { stock } });
      p.stock = stock;
      render();
    }
    if (e.target.closest("[data-delete]") && confirm(`Supprimer définitivement « ${p.name} » ?`)) {
      await api(`/admin/products/${p.id}`, { method: "DELETE" });
      products = products.filter((x) => x !== p);
      render();
      toast({ title: "Produit supprimé", text: p.name });
    }
  } catch (err) {
    onAuthError(err);
  }
});
load();
const flash = sessionStorage.getItem("mn_flash");
if (flash) {
  sessionStorage.removeItem("mn_flash");
  toast({ title: "C'est enregistré", text: flash });
}
