/* Structure commune de l'admin : vérification de connexion + menu latéral. */
import { $, api, esc, icon, loadConfig, setCurrency } from "../core.js?v=3";

const NAV = [
  ["/admin/", "Tableau de bord", "dashboard"],
  ["/admin/produits.html", "Produits", "box"],
  ["/admin/commandes.html", "Commandes", "cart"],
  ["/admin/clientes.html", "Clientes", "users"],
  ["/admin/messages.html", "Messages", "mail"],
  ["/admin/parametres.html", "Paramètres", "settings"],
];

export const STATUS = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};
export const PAYMENT = { cod: "Paiement à la livraison", wave: "Wave", orange_money: "Orange Money" };
export const statusBadge = (s) => `<span class="status st-${s}">${STATUS[s] || s}</span>`;

/** À appeler en haut de chaque page admin. Redirige vers la connexion si besoin. */
export async function initAdmin() {
  const { authenticated } = await api("/admin/me");
  if (!authenticated) {
    location.replace(`/admin/connexion.html?retour=${encodeURIComponent(location.pathname + location.search)}`);
    await new Promise(() => {}); // la page s'arrête ici pendant la redirection
  }
  const config = await loadConfig();
  setCurrency(config.shop.currency);
  document.title = `${document.title.split("|")[0].trim()} | Admin ${config.shop.name}`;

  const path = location.pathname.replace(/index\.html$/, "");
  const active = (href) => (href === "/admin/" ? path === "/admin/" : path.startsWith(href.replace(".html", "")));
  const sidebar = `
    <div class="sidebar-brand"><div class="logo"><span class="logo-name">${esc(config.shop.shortName)}</span><span class="logo-sub">Administration</span></div></div>
    <nav>${NAV.map(([h, l, i]) => `<a href="${h}" class="${active(h) ? "active" : ""}">${icon(i)} ${l}</a>`).join("")}</nav>
    <div class="sidebar-foot">
      <a href="/" target="_blank">${icon("external")} Voir la boutique</a>
      <button data-logout>${icon("logout")} Déconnexion</button>
    </div>`;

  const content = document.body.innerHTML;
  document.body.innerHTML = `
    <div class="admin">
      <aside class="sidebar">${sidebar}</aside>
      <div class="admin-main">
        <div class="topbar"><button class="icon-btn" data-menu aria-label="Menu">${icon("menu")}</button>
          <span class="serif" style="font-size:18px;letter-spacing:.3em">${esc(config.shop.shortName)}</span><span style="width:40px"></span></div>
        <div class="admin-content">${content}</div>
      </div>
    </div>`;

  document.body.classList.remove("admin-loading");
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-logout]")) {
      await api("/admin/logout", { method: "POST" });
      location.href = "/admin/connexion.html";
    }
    if (e.target.closest("[data-menu]")) {
      const o = document.createElement("div");
      o.className = "overlay";
      o.innerHTML = `<div class="overlay-bg" data-close></div><aside class="panel panel-left sidebar" style="max-width:280px">${sidebar}</aside>`;
      document.body.append(o);
      o.addEventListener("click", (ev) => ev.target.closest("[data-close], a") && o.remove());
    }
  });
  return config;
}

export function onAuthError(err) {
  if (err.status === 401) location.replace("/admin/connexion.html");
  else alert(err.message);
}

/** Téléchargement CSV (ouvrable dans Excel). */
export function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit une image, la réduit (max 1400 px) puis l'envoie au serveur. Retourne son URL. */
export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Le fichier doit être une image."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture de l'image impossible."));
    reader.onload = () => {
      const im = new Image();
      im.onerror = () => reject(new Error("Image invalide."));
      im.onload = async () => {
        const scale = Math.min(1, 1400 / im.width);
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * scale);
        c.height = Math.round(im.height * scale);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        try {
          const { url } = await api("/admin/upload", { method: "POST", body: { dataUrl: c.toDataURL("image/jpeg", 0.85) } });
          resolve(url);
        } catch (e) {
          reject(e);
        }
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
export { $ };
