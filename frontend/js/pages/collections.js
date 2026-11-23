import { $, esc, icon, photo, reveal } from "../core.js?v=3";
import { initLayout } from "../layout.js?v=3";

const { collections } = await initLayout();

$("#collections-list").innerHTML = collections
  .map(
    (c, i) => `<div class="collection-row reveal ${i % 2 ? "reverse" : ""}">
      <a class="collection-row-media zoom-wrap" href="/collection.html?slug=${c.slug}">${photo(c.image, c.name, { cls: "photo ratio-45", sizes: "(min-width:1024px) 50vw, 100vw", ratio: 1.25, width: 1200 })}</a>
      <div class="collection-row-text">
        <p class="eyebrow mb-4">${String(i + 1).padStart(2, "0")} — ${esc(c.subtitle)}</p>
        <h2>${esc(c.name)}</h2>
        <div class="divider"></div>
        <p>${esc(c.description)}</p>
        <a href="/collection.html?slug=${c.slug}" class="btn btn-dark mt-8">Découvrir ${icon("arrow")}</a>
      </div></div>`,
  )
  .join("");
reveal();
