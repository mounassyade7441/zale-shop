/* Paramètres : tout ce qui personnalise la boutique, modifiable sans toucher au code. */
import { $, $$, api, esc, icon, img, toast } from "../core.js?v=3";
import { initAdmin, onAuthError, uploadImage } from "./shell.js?v=3";

await initAdmin();
let data;
try {
  data = await api("/admin/settings");
} catch (e) {
  onAuthError(e);
  throw e;
}
const { shop } = data;
let { categories, collections } = data;
const removedCats = [];
const removedCols = [];

const get = (path) => path.split(".").reduce((o, k) => o?.[k], shop);
const set = (path, value) => {
  const keys = path.split(".");
  const last = keys.pop();
  const obj = keys.reduce((o, k) => (o[k] ??= {}), shop);
  obj[last] = value;
};

/* Petits gabarits */
const field = (path, label, { type = "text", placeholder = "", span = false, hint = "" } = {}) =>
  `<div class="${span ? "span-2" : ""}"><label class="label" for="f-${path}">${label}</label>
   ${type === "textarea" ? `<textarea class="field" id="f-${path}" data-path="${path}" rows="3">${esc(get(path) ?? "")}</textarea>` : `<input class="field" id="f-${path}" data-path="${path}" type="${type}" value="${esc(get(path) ?? "")}" placeholder="${esc(placeholder)}">`}
   ${hint ? `<p class="xs muted mt-1">${hint}</p>` : ""}</div>`;
const imageInput = (value, attrs) =>
  `<div class="thumb-input"><img src="${esc(img(value, 120))}" alt="">
     <input class="field" value="${esc(value)}" ${attrs} placeholder="https://… ou /images/…">
     <button type="button" class="btn btn-outline" data-upload style="padding:10px 12px" aria-label="Envoyer une photo">${icon("image")}</button></div>`;
const section = (title, body, hint = "") => `<div class="box mt-6"><h2>${title}</h2>${hint ? `<p class="small muted mb-6" style="margin-top:-8px">${hint}</p>` : ""}${body}</div>`;

function render() {
  $("#settings").innerHTML = `
  <form id="form" novalidate>
    ${section("Identité de la boutique", `<div class="form-grid cols-2">
      ${field("name", "Nom complet", { placeholder: "Zale Shop International" })}
      ${field("shortName", "Nom du logo", { placeholder: "ZALE SHOP" })}
      ${field("baseline", "Sous-titre du logo", { placeholder: "International" })}
      ${field("currency", "Devise", { placeholder: "FCFA" })}
      ${field("description", "Description (référencement Google)", { type: "textarea", span: true })}
    </div>`)}

    ${section("Contact", `<div class="form-grid cols-2">
      ${field("whatsapp", "Numéro WhatsApp", { placeholder: "221770000000", hint: "Format international, chiffres seulement (ex : 221771234567)." })}
      ${field("phoneDisplay", "Téléphone affiché", { placeholder: "+221 77 000 00 00" })}
      ${field("email", "E-mail", { type: "email" })}
      ${field("openingHours", "Horaires")}
      ${field("address", "Adresse")}
      ${field("city", "Ville")}
      ${field("mapsQuery", "Recherche Google Maps (carte)", { span: true, hint: "Ce qui sera cherché sur la carte, ex : « Point E, Dakar »." })}
    </div>`)}

    ${section("Réseaux sociaux", `<div class="form-grid cols-2">
      ${field("social.instagram", "Instagram", { type: "url" })}
      ${field("social.facebook", "Facebook", { type: "url" })}
      ${field("social.tiktok", "TikTok", { type: "url", hint: "Laissez vide pour masquer un réseau." })}
    </div>`)}

    ${section("Bandeau d'annonce", `<label class="label" for="announcements">Une annonce par ligne</label>
      <textarea class="field" id="announcements" rows="4">${esc((shop.announcements || []).join("\n"))}</textarea>`, "Le bandeau noir qui défile tout en haut du site.")}

    ${section("Bannière d'accueil", `<div class="form-grid cols-2">
      <div class="span-2"><p class="label">Bannière image (photo avec votre texte déjà écrit dessus)</p>
        ${imageInput(shop.hero.banner || "", 'data-path="hero.banner"')}
        <p class="xs muted mt-1">Si une bannière image est indiquée, elle remplace les textes et les 3 photos ci-dessous. Videz ce champ pour revenir à la version texte.</p></div>
      ${field("hero.eyebrow", "Petite accroche")}
      ${field("hero.button", "Texte du bouton")}
      ${field("hero.title", "Titre (ligne 1)")}
      ${field("hero.titleItalic", "Titre (ligne 2, en italique)")}
      ${field("hero.text", "Texte", { span: true })}
      <div class="span-2"><p class="label">Photos (3 sur ordinateur, la 1ʳᵉ sur téléphone)</p>
        <div style="display:grid;gap:10px">${[0, 1, 2].map((i) => imageInput(shop.hero.images[i] || "", `data-hero-img="${i}"`)).join("")}</div></div>
    </div>`)}

    ${section("Section promotions (accueil)", `<div class="form-grid cols-2">
      ${field("promo.eyebrow", "Petite accroche")}
      ${field("promo.title", "Titre", { placeholder: "Jusqu'à -30%" })}
      ${field("promo.subtitle", "Sous-titre")}
      ${field("promo.text", "Texte")}
    </div>`, "Les articles affichés sont ceux qui ont un « ancien prix » dans leur fiche.")}

    ${section("Livraison", `<div style="max-width:280px">${field("delivery.freeFrom", "Livraison offerte dès (FCFA)", { type: "number", hint: "Mettez 0 pour toujours offrir la livraison." })}</div>
      <p class="label mt-6">Zones et tarifs</p><div id="zones"></div>
      <button type="button" class="btn btn-outline mt-4" id="add-zone" style="padding:10px 16px">+ Ajouter une zone</button>`)}

    ${section("Paiements", `<div style="display:grid;gap:20px">
      <label class="check"><input type="checkbox" data-check="payments.cod" ${shop.payments.cod !== false ? "checked" : ""}> Paiement à la livraison</label>
      <div class="repeat-row"><label class="check"><input type="checkbox" data-check="payments.wave.enabled" ${shop.payments.wave.enabled !== false ? "checked" : ""}> <strong style="font-weight:500">Wave</strong></label>
        <div class="form-grid cols-2">${field("payments.wave.number", "Numéro Wave")}${field("payments.wave.link", "Lien de paiement Wave (facultatif)", { type: "url", placeholder: "https://pay.wave.com/m/…" })}</div></div>
      <div class="repeat-row"><label class="check"><input type="checkbox" data-check="payments.orangeMoney.enabled" ${shop.payments.orangeMoney.enabled !== false ? "checked" : ""}> <strong style="font-weight:500">Orange Money</strong></label>
        <div class="form-grid cols-2">${field("payments.orangeMoney.number", "Numéro Orange Money")}${field("payments.orangeMoney.merchantCode", "Code marchand (facultatif)")}</div></div>
    </div>`)}

    ${section("Page d'accueil", `<div class="form-grid cols-2">
      <div><label class="label" for="featured">Collection mise à la une</label><select class="field" id="featured">${collections.map((c) => `<option value="${esc(c.slug)}" ${c.slug === shop.featuredCollection ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      <div><p class="label">Photo de la newsletter</p>${imageInput(shop.newsletterImage || "", 'data-path="newsletterImage"')}</div>
    </div>
    <p class="label mt-6">Avis clientes</p><div id="testimonials"></div>
    <button type="button" class="btn btn-outline mt-4" id="add-testimonial" style="padding:10px 16px">+ Ajouter un avis</button>`)}

    ${section("Catégories", `<div id="categories"></div><button type="button" class="btn btn-outline mt-4" id="add-cat" style="padding:10px 16px">+ Ajouter une catégorie</button>`, "Une catégorie utilisée par des produits ne peut pas être supprimée.")}

    ${section("Collections", `<div id="collections"></div><button type="button" class="btn btn-outline mt-4" id="add-col" style="padding:10px 16px">+ Ajouter une collection</button>`)}

    <div class="sticky-actions mt-6" style="max-width:420px;margin-left:auto"><button type="submit" class="btn btn-dark btn-block btn-lg">Enregistrer les paramètres</button></div>
  </form>

  ${section("Mot de passe administrateur", `<form id="pwd" class="form-grid cols-2" style="max-width:640px">
      <div><label class="label" for="pwd-current">Mot de passe actuel</label><input class="field" id="pwd-current" type="password" autocomplete="current-password"></div>
      <div><label class="label" for="pwd-next">Nouveau mot de passe</label><input class="field" id="pwd-next" type="password" autocomplete="new-password" minlength="8"></div>
      <div class="span-2"><button class="btn btn-outline" type="submit">Changer le mot de passe</button></div></form>`, "Au moins 8 caractères. Vous serez déconnectée de tous les appareils.")}`;
  renderLists();
}

function renderLists() {
  $("#zones").innerHTML = shop.delivery.zones
    .map((z, i) => `<div class="repeat-row zone" data-zone="${i}">
      <div><label class="label">Zone</label><input class="field" data-k="label" value="${esc(z.label)}"></div>
      <div><label class="label">Tarif (FCFA)</label><input class="field" data-k="fee" type="number" min="0" step="500" value="${z.fee}"></div>
      <div><label class="label">Délai</label><input class="field" data-k="delay" value="${esc(z.delay)}"></div>
      <button type="button" class="icon-btn" data-del-zone="${i}" aria-label="Supprimer la zone">${icon("trash")}</button></div>`)
    .join("");
  $("#testimonials").innerHTML = (shop.testimonials || [])
    .map((t, i) => `<div class="repeat-row" data-testimonial="${i}">
      <div class="inline"><input class="field" data-k="name" value="${esc(t.name)}" placeholder="Prénom, quartier"><button type="button" class="icon-btn" data-del-testimonial="${i}" aria-label="Supprimer l'avis">${icon("trash")}</button></div>
      <textarea class="field" data-k="text" rows="2" placeholder="Son avis…">${esc(t.text)}</textarea></div>`)
    .join("");
  $("#categories").innerHTML = categories
    .map((c, i) => `<div class="repeat-row" data-cat="${i}">
      <div class="inline"><input class="field" data-k="name" value="${esc(c.name)}" placeholder="Nom de la catégorie"><button type="button" class="icon-btn" data-del-cat="${i}" aria-label="Supprimer">${icon("trash")}</button></div>
      ${imageInput(c.image, 'data-k="image"')}</div>`)
    .join("");
  $("#collections").innerHTML = collections
    .map((c, i) => `<div class="repeat-row" data-col="${i}">
      <div class="inline"><input class="field" data-k="name" value="${esc(c.name)}" placeholder="Nom de la collection"><button type="button" class="icon-btn" data-del-col="${i}" aria-label="Supprimer">${icon("trash")}</button></div>
      <input class="field" data-k="subtitle" value="${esc(c.subtitle)}" placeholder="Sous-titre (ex : Collection Été 2026)">
      <textarea class="field" data-k="description" rows="2" placeholder="Description">${esc(c.description)}</textarea>
      ${imageInput(c.image, 'data-k="image"')}</div>`)
    .join("");
}

/** Recopie le contenu du formulaire dans les objets (avant d'ajouter/supprimer une ligne ou d'enregistrer). */
function collect() {
  $$("[data-path]").forEach((el) => set(el.dataset.path, el.type === "number" ? Number(el.value) : el.value.trim()));
  $$("[data-check]").forEach((el) => set(el.dataset.check, el.checked));
  shop.announcements = $("#announcements").value.split("\n").map((l) => l.trim()).filter(Boolean);
  shop.hero.images = $$("[data-hero-img]").map((el) => el.value.trim()).filter(Boolean);
  shop.featuredCollection = $("#featured").value;
  const rows = (sel) => $$(sel).map((r) => Object.fromEntries($$("[data-k]", r).map((el) => [el.dataset.k, el.type === "number" ? Number(el.value) : el.value.trim()])));
  shop.delivery.zones = rows("[data-zone]").map((z, i) => ({ ...shop.delivery.zones[i], ...z }));
  shop.testimonials = rows("[data-testimonial]").filter((t) => t.name || t.text);
  categories = rows("[data-cat]").map((c, i) => ({ ...categories[i], ...c }));
  collections = rows("[data-col]").map((c, i) => ({ ...collections[i], ...c }));
}

render();

/* Événements */
document.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.upload !== undefined) {
    const wrap = b.closest(".thumb-input");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (!input.files[0]) return;
      b.innerHTML = '<span class="spinner"></span>';
      try {
        const url = await uploadImage(input.files[0]);
        $("input.field", wrap).value = url;
        $("img", wrap).src = url;
      } catch (err) {
        toast({ title: "Envoi impossible", text: err.message });
      }
      b.innerHTML = icon("image");
    };
    input.click();
    return;
  }
  const actions = {
    "add-zone": () => shop.delivery.zones.push({ id: "", label: "Nouvelle zone", fee: 3000, delay: "48 h" }),
    "add-testimonial": () => (shop.testimonials ||= []).push({ name: "", text: "" }),
    "add-cat": () => categories.push({ slug: "", name: "", image: "" }),
    "add-col": () => collections.push({ slug: "", name: "", subtitle: "", description: "", image: "" }),
  };
  if (actions[b.id]) {
    collect();
    actions[b.id]();
    renderLists();
    return;
  }
  for (const [attr, del] of [
    ["delZone", (i) => shop.delivery.zones.splice(i, 1)],
    ["delTestimonial", (i) => shop.testimonials.splice(i, 1)],
    ["delCat", (i) => removedCats.push(...categories.splice(i, 1).filter((c) => c.slug))],
    ["delCol", (i) => removedCols.push(...collections.splice(i, 1).filter((c) => c.slug))],
  ]) {
    if (b.dataset[attr] !== undefined) {
      collect();
      del(Number(b.dataset[attr]));
      renderLists();
      return;
    }
  }
});
document.addEventListener("input", (e) => {
  const wrap = e.target.closest(".thumb-input");
  if (wrap) $("img", wrap).src = img(e.target.value.trim(), 120);
});

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  collect();
  const btn = $("button[type=submit]", e.target);
  btn.disabled = true;
  try {
    for (const c of removedCats) await api(`/admin/categories/${encodeURIComponent(c.slug)}`, { method: "DELETE" });
    removedCats.length = 0;
    for (const c of removedCols) await api(`/admin/collections/${encodeURIComponent(c.slug)}`, { method: "DELETE" });
    removedCols.length = 0;
    await api("/admin/settings", { method: "PUT", body: { shop, categories, collections } });
    toast({ title: "Paramètres enregistrés", text: "Les changements sont visibles sur le site." });
    const fresh = await api("/admin/settings");
    categories = fresh.categories;
    collections = fresh.collections;
    Object.assign(shop, fresh.shop);
    renderLists();
  } catch (err) {
    if (err.status === 401) return onAuthError(err);
    toast({ title: "Erreur", text: err.message });
    const fresh = await api("/admin/settings").catch(() => null);
    if (fresh) {
      categories = fresh.categories;
      collections = fresh.collections;
      renderLists();
    }
  }
  btn.disabled = false;
});

$("#pwd").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/admin/password", { method: "PUT", body: { current: $("#pwd-current").value, next: $("#pwd-next").value } });
    alert("Mot de passe modifié. Reconnectez-vous avec le nouveau mot de passe.");
    location.href = "/admin/connexion.html";
  } catch (err) {
    toast({ title: "Erreur", text: err.message });
  }
});
