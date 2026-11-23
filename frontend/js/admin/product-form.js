import { $, api, esc, icon, img, norm, qs, toast } from "../core.js?v=3";
import { initAdmin, onAuthError, uploadImage } from "./shell.js?v=3";

const { categories, collections } = await initAdmin();
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const PRESETS = [
  ["Noir", "#151313"], ["Blanc", "#FAFAF7"], ["Beige", "#D9C6AA"], ["Rose poudré", "#E8C9C1"], ["Rouge", "#B3262E"], ["Bordeaux", "#6E1E2C"],
  ["Bleu ciel", "#A9C3DD"], ["Bleu marine", "#1F2A44"], ["Vert émeraude", "#1F6E66"], ["Moutarde", "#D9A12B"], ["Camel", "#B5834F"], ["Doré", "#C8A45C"],
];
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const id = qs("id");
let p = { name: "", slug: "", category: categories[0]?.slug || "", collection: null, description: "", details: [], price: "", compareAtPrice: null, images: [], sizes: ["S", "M", "L", "XL"], colors: [], stock: 10, isNew: true, isBestSeller: false };
if (id) {
  try {
    p = await api(`/admin/products/${id}`);
    $("#form-title").textContent = p.name;
    $("#form-actions").innerHTML = `<a class="btn btn-outline" href="/produit.html?slug=${encodeURIComponent(p.slug)}" target="_blank">Voir sur la boutique</a>`;
  } catch (e) {
    if (e.status === 401) onAuthError(e);
    $("#form-root").innerHTML = '<p class="muted">Produit introuvable.</p>';
    throw e;
  }
}
let slugTouched = Boolean(id);

$("#form-root").innerHTML = `
<form id="form" class="form-layout" novalidate>
  <p class="alert-error hidden" id="errors" role="alert" style="grid-column:1/-1"></p>
  <div class="stack">
    <div class="box"><h2>Informations</h2><div class="form-grid">
      <div><label class="label" for="name">Nom du produit *</label><input class="field" id="name" value="${esc(p.name)}" placeholder="Robe longue Saba"></div>
      <div><label class="label" for="slug">Lien de la page</label><div class="inline" style="align-items:center"><span class="small muted">/produit.html?slug=</span><input class="field" id="slug" value="${esc(p.slug)}"></div></div>
      <div class="form-grid cols-2">
        <div><label class="label" for="category">Catégorie *</label><select class="field" id="category">${categories.map((c) => `<option value="${c.slug}" ${c.slug === p.category ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
        <div><label class="label" for="collection">Collection</label><select class="field" id="collection"><option value="">Aucune</option>${collections.map((c) => `<option value="${c.slug}" ${c.slug === p.collection ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      </div>
      <div><label class="label" for="description">Description</label><textarea class="field" id="description" rows="4">${esc(p.description)}</textarea></div>
      <div><label class="label" for="details">Détails & entretien (une ligne par point)</label><textarea class="field" id="details" rows="4" placeholder="100 % viscose&#10;Lavage à 30°C">${esc(p.details.join("\n"))}</textarea></div>
    </div></div>

    <div class="box"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h2>Photos *</h2><span class="xs muted">La 1ʳᵉ photo est l'image principale</span></div>
      <div class="img-grid" id="images"></div>
      <input type="file" id="file" accept="image/*" multiple hidden>
      <div class="inline mt-4"><input class="field" id="url" placeholder="…ou coller l'adresse d'une image (https://… ou /images/…)"><button type="button" class="btn btn-outline" id="add-url" style="padding:10px 16px">Ajouter</button></div>
    </div>
  </div>

  <div class="stack">
    <div class="box"><h2>Prix & stock</h2><div class="form-grid">
      <div><label class="label" for="price">Prix (FCFA) *</label><input class="field" id="price" type="number" min="0" step="500" value="${p.price}"></div>
      <div><label class="label" for="compare">Ancien prix (promo)</label><input class="field" id="compare" type="number" min="0" step="500" value="${p.compareAtPrice ?? ""}" placeholder="Laisser vide si pas de promo"></div>
      <div><label class="label" for="stock">Stock disponible *</label><input class="field" id="stock" type="number" min="0" value="${p.stock}"></div>
      <label class="check"><input type="checkbox" id="isNew" ${p.isNew ? "checked" : ""}> Afficher dans les Nouveautés</label>
      <label class="check"><input type="checkbox" id="isBest" ${p.isBestSeller ? "checked" : ""}> Afficher dans les Meilleures ventes</label>
    </div></div>

    <div class="box"><h2>Tailles *</h2><div class="size-grid" id="sizes"></div></div>

    <div class="box"><h2>Couleurs *</h2>
      <div id="colors" style="display:flex;flex-wrap:wrap;gap:8px"></div>
      <p class="xs muted mt-4 mb-2">Couleurs rapides :</p>
      <div class="swatches" style="gap:8px">${PRESETS.map(([n, h]) => `<button type="button" class="swatch" style="width:28px;height:28px;background:${h}" title="${n}" aria-label="Ajouter ${n}" data-preset="${n}|${h}"></button>`).join("")}</div>
      <div class="inline mt-4"><input type="color" id="hex" value="#c99a8f" style="width:48px;height:46px;padding:2px;border:1px solid var(--line)" aria-label="Teinte"><input class="field" id="color-name" placeholder="Nom (ex : Terracotta)"><button type="button" class="btn btn-outline" id="add-color" style="padding:10px 16px">+</button></div>
    </div>

    <div class="sticky-actions"><a class="btn btn-outline" href="/admin/produits.html" style="flex:1">Annuler</a><button class="btn btn-dark" type="submit" style="flex:2">${id ? "Enregistrer" : "Créer le produit"}</button></div>
  </div>
</form>`;

/* ------------------------------ Rendu dynamique ------------------------------ */
function renderImages() {
  $("#images").innerHTML =
    p.images
      .map(
        (src, i) => `<div class="img-item"><img src="${esc(img(src, 240))}" alt="Photo ${i + 1}">${i === 0 ? '<span class="main-tag">Principale</span>' : ""}
        <div class="img-actions"><span style="display:flex;gap:4px"><button type="button" data-move="${i}|-1" aria-label="Déplacer avant">${icon("left")}</button><button type="button" data-move="${i}|1" aria-label="Déplacer après">${icon("right")}</button></span>
        <button type="button" data-del-img="${i}" aria-label="Supprimer la photo" style="color:var(--error)">${icon("trash")}</button></div></div>`,
      )
      .join("") + `<button type="button" class="img-add" id="pick">${icon("image")}<span>Ajouter des photos</span></button>`;
}
function renderSizes() {
  $("#sizes").innerHTML = [...SIZES, "TU"].map((s) => `<button type="button" class="size-btn ${p.sizes.includes(s) ? "on" : ""}" data-size="${s}">${s === "TU" ? "Standard" : s}</button>`).join("");
}
function renderColors() {
  $("#colors").innerHTML = p.colors.length
    ? p.colors.map((c, i) => `<span class="color-chip"><span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.name)}<button type="button" class="icon-btn" style="width:24px;height:24px" data-del-color="${i}" aria-label="Retirer ${esc(c.name)}">${icon("x")}</button></span>`).join("")
    : '<p class="xs muted">Aucune couleur ajoutée.</p>';
}
renderImages();
renderSizes();
renderColors();

const addColor = (name, hex) => {
  name = name.trim();
  if (!name || p.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
  p.colors.push({ name, hex });
  renderColors();
};

/* ------------------------------ Événements ------------------------------ */
const form = $("#form");
$("#name").addEventListener("input", (e) => !slugTouched && ($("#slug").value = slugify(e.target.value)));
$("#slug").addEventListener("input", () => (slugTouched = true));
$("#file").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  const pick = $("#pick");
  pick.innerHTML = '<span class="spinner"></span>';
  for (const f of files) {
    try {
      p.images.push(await uploadImage(f));
    } catch (err) {
      toast({ title: "Envoi impossible", text: err.message });
    }
  }
  e.target.value = "";
  renderImages();
});
const addUrl = () => {
  const u = $("#url").value.trim();
  if (!/^(https:\/\/|\/images\/|\/uploads\/)/.test(u)) return toast({ title: "Adresse invalide", text: "Elle doit commencer par https:// ou /images/" });
  p.images.push(u);
  $("#url").value = "";
  renderImages();
};
$("#add-url").addEventListener("click", addUrl);
$("#url").addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), addUrl()));
$("#add-color").addEventListener("click", () => {
  addColor($("#color-name").value, $("#hex").value);
  $("#color-name").value = "";
});
$("#color-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    $("#add-color").click();
  }
});

form.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.id === "pick") $("#file").click();
  if (b.dataset.move) {
    const [i, d] = b.dataset.move.split("|").map(Number);
    const j = i + d;
    if (j >= 0 && j < p.images.length) [p.images[i], p.images[j]] = [p.images[j], p.images[i]];
    renderImages();
  }
  if (b.dataset.delImg) {
    p.images.splice(Number(b.dataset.delImg), 1);
    renderImages();
  }
  if (b.dataset.size) {
    const s = b.dataset.size;
    if (s === "TU") p.sizes = p.sizes.includes("TU") ? ["S", "M", "L"] : ["TU"];
    else {
      const cur = p.sizes.filter((x) => x !== "TU");
      p.sizes = SIZES.filter((x) => (x === s ? !cur.includes(s) : cur.includes(x)));
    }
    renderSizes();
  }
  if (b.dataset.preset) addColor(...b.dataset.preset.split("|"));
  if (b.dataset.delColor) {
    p.colors.splice(Number(b.dataset.delColor), 1);
    renderColors();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: $("#name").value,
    slug: $("#slug").value || slugify($("#name").value),
    category: $("#category").value,
    collection: $("#collection").value || null,
    description: $("#description").value,
    details: $("#details").value.split("\n").map((l) => l.trim()).filter(Boolean),
    price: Number($("#price").value),
    compareAtPrice: $("#compare").value ? Number($("#compare").value) : null,
    stock: Number($("#stock").value),
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    isNew: $("#isNew").checked,
    isBestSeller: $("#isBest").checked,
  };
  const errBox = $("#errors");
  errBox.classList.add("hidden");
  const btn = $("button[type=submit]", form);
  btn.disabled = true;
  try {
    const saved = await api(id ? `/admin/products/${id}` : "/admin/products", { method: id ? "PUT" : "POST", body });
    sessionStorage.setItem("mn_flash", `${id ? "Modifications enregistrées" : "Produit créé"} : ${saved.name}`);
    location.href = "/admin/produits.html";
  } catch (err) {
    if (err.status === 401) return onAuthError(err);
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
    scrollTo({ top: 0, behavior: "smooth" });
    btn.disabled = false;
  }
});
