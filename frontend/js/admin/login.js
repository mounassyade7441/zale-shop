import { $, api, loadConfig, qs } from "../core.js?v=3";

loadConfig().then(({ shop }) => ($("#brand").textContent = shop.shortName)).catch(() => {});
api("/admin/me").then(({ authenticated }) => authenticated && location.replace("/admin/"));

$("#login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#error");
  err.classList.add("hidden");
  const btn = $("button[type=submit]");
  btn.disabled = true;
  try {
    await api("/admin/login", { method: "POST", body: { password: $("#password").value } });
    const back = qs("retour");
    location.replace(back && back.startsWith("/admin/") ? back : "/admin/");
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove("hidden");
    btn.disabled = false;
  }
});
