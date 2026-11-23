import { $, api, esc, formatDate, icon } from "../core.js?v=3";
import { initAdmin, onAuthError } from "./shell.js?v=3";

await initAdmin();
let messages = [];

function render() {
  $("#list").innerHTML = messages.length
    ? messages
        .map(
          (m) => `<div class="box msg ${m.is_read ? "" : "unread"} mt-4" data-id="${m.id}">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline">
          <p><strong style="font-weight:500">${esc(m.name)}</strong> <span class="muted">— ${esc(m.subject)}</span></p>
          <p class="xs muted">${formatDate(m.created_at)}</p></div>
        <p class="xs muted mt-1">${m.phone ? `<a class="underline" href="tel:${esc(m.phone.replace(/\s/g, ""))}">${esc(m.phone)}</a>` : ""}${m.phone && m.email ? " · " : ""}${m.email ? `<a class="underline" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ""}</p>
        <p class="small soft mt-3" style="white-space:pre-line">${esc(m.message)}</p>
        <div class="mt-4" style="display:flex;gap:16px">
          <button class="xs underline" data-read>${m.is_read ? "Marquer comme non lu" : "Marquer comme lu"}</button>
          <button class="xs underline" data-delete style="color:var(--error)">${icon("trash")} Supprimer</button></div>
      </div>`,
        )
        .join("")
    : '<div class="box"><p class="muted" style="padding:40px;text-align:center">Aucun message pour le moment.</p></div>';
}

$("#list").addEventListener("click", async (e) => {
  const box = e.target.closest("[data-id]");
  if (!box) return;
  const m = messages.find((x) => String(x.id) === box.dataset.id);
  try {
    if (e.target.closest("[data-read]")) {
      await api(`/admin/messages/${m.id}`, { method: "PATCH", body: { read: !m.is_read } });
      m.is_read = m.is_read ? 0 : 1;
      render();
    }
    if (e.target.closest("[data-delete]") && confirm("Supprimer ce message ?")) {
      await api(`/admin/messages/${m.id}`, { method: "DELETE" });
      messages = messages.filter((x) => x !== m);
      render();
    }
  } catch (err) {
    onAuthError(err);
  }
});

try {
  messages = await api("/admin/messages");
  render();
} catch (e) {
  onAuthError(e);
}
