/**
 * Lanceur du site Zale Shop International (backend Laravel).
 *
 *   npm start                → démarre le site (php artisan serve) sur le port 3000
 *   npm start -- artisan …   → lance une commande artisan (ex : npm start -- artisan boutique:reset)
 *
 * PHP est cherché dans : la variable PHP_PATH, le PATH, puis Laragon (C:\laragon\bin\php\…).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { connect, createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND = join(ROOT, "backend");
const PORT = Number(process.env.PORT) || 3000;

function findPhp() {
  // Laravel 12 exige PHP 8.2 ou plus
  const ok = (bin) => {
    const r = spawnSync(bin, ["-r", "echo PHP_VERSION_ID >= 80200 ? 'ok' : 'old';"], { encoding: "utf8" });
    return r.status === 0 && r.stdout.trim() === "ok";
  };
  if (process.env.PHP_PATH && ok(process.env.PHP_PATH)) return process.env.PHP_PATH;
  if (ok("php")) return "php";
  const laragon = "C:\\laragon\\bin\\php";
  if (existsSync(laragon)) {
    const versions = readdirSync(laragon)
      .filter((d) => existsSync(join(laragon, d, "php.exe")))
      .sort()
      .reverse();
    for (const v of versions) {
      const bin = join(laragon, v, "php.exe");
      if (ok(bin)) return bin;
    }
  }
  return null;
}

function findComposer(php) {
  for (const p of ["C:\\laragon\\bin\\composer\\composer.phar"]) if (existsSync(p)) return [php, "-d", "extension=zip", p];
  return ["composer"];
}

/* MySQL : si backend/.env utilise MySQL et qu'il est éteint, on démarre celui de Laragon */
function readEnv() {
  const file = join(BACKEND, ".env");
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*?)"?\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

const portOpen = (port, host) =>
  new Promise((resolve) => {
    const s = connect({ port, host }, () => (s.destroy(), resolve(true)));
    s.on("error", () => resolve(false));
    s.setTimeout(1000, () => (s.destroy(), resolve(false)));
  });

async function ensureMysql() {
  const env = readEnv();
  if (env.DB_CONNECTION !== "mysql") return;
  const host = env.DB_HOST || "127.0.0.1";
  const port = Number(env.DB_PORT) || 3306;
  if (await portOpen(port, host)) return;

  const ini = "C:\\laragon\\usr\\laragon.ini";
  const version = existsSync(ini) && readFileSync(ini, "utf8").match(/\[mysql\][^[]*?Version=([^\r\n]+)/)?.[1]?.trim();
  const dir = version && join("C:\\laragon\\bin\\mysql", version);
  const mysqld = dir && join(dir, "bin", "mysqld.exe");
  if (!mysqld || !existsSync(mysqld)) {
    console.error(`\n  ✖ MySQL ne répond pas sur ${host}:${port} et n'a pas pu être démarré automatiquement.`);
    console.error("    → Ouvrez Laragon et cliquez sur « Démarrer tout », puis relancez « npm start ».\n");
    process.exit(1);
  }
  console.log(`  … Démarrage de MySQL (${version})`);
  spawn(mysqld, [`--defaults-file=${join(dir, "my.ini")}`], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  for (let i = 0; i < 30; i++) {
    if (await portOpen(port, host)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error("\n  ✖ MySQL n'a pas démarré. Ouvrez Laragon et cliquez sur « Démarrer tout ».\n");
  process.exit(1);
}

const php = findPhp();
if (!php) {
  console.error("\n  ✖ PHP est introuvable.");
  console.error("    Installez Laragon (https://laragon.org) ou PHP 8.2+, ou indiquez son chemin :");
  console.error('    $env:PHP_PATH="C:\\chemin\\vers\\php.exe"; npm start\n');
  process.exit(1);
}

await ensureMysql();

const args = process.argv.slice(2);
const run = (cmd, cmdArgs) => spawn(cmd, cmdArgs, { cwd: BACKEND, stdio: "inherit" }).on("exit", (code) => process.exit(code ?? 0));

/* Commandes de maintenance : npm run reset, npm run install-all, npm start -- artisan … */
if (args[0] === "artisan") run(php, ["artisan", ...args.slice(1)]);
else if (args[0] === "install") {
  const [cmd, ...rest] = findComposer(php);
  const child = spawn(cmd, [...rest, "install", "--no-interaction"], { cwd: BACKEND, stdio: "inherit" });
  child.on("exit", (code) => {
    if (code) process.exit(code);
    if (!existsSync(join(BACKEND, ".env"))) spawnSync(process.platform === "win32" ? "copy" : "cp", [".env.example", ".env"], { cwd: BACKEND, shell: true, stdio: "inherit" });
    spawnSync(php, ["artisan", "key:generate", "--no-interaction"], { cwd: BACKEND, stdio: "inherit" });
    run(php, ["artisan", "migrate", "--seed", "--force"]);
  });
} else {
  /* Démarrage du site */
  const tester = createServer();
  tester.once("error", () => {
    console.error(`\n  ✖ Le port ${PORT} est déjà utilisé : le site est sûrement déjà allumé.`);
    console.error(`    → Ouvrez simplement http://localhost:${PORT} dans votre navigateur,`);
    console.error("    → ou fermez l'autre fenêtre/terminal du site, puis relancez « npm start ».\n");
    process.exit(1);
  });
  tester.once("listening", () => {
    tester.close(() => {
      const ips = Object.values(networkInterfaces())
        .flat()
        .filter((i) => i && i.family === "IPv4" && !i.internal)
        .map((i) => i.address);
      console.log("\n  Zale Shop International (Laravel) est en ligne :\n");
      console.log(`  ➜ Sur cet ordinateur : http://localhost:${PORT}`);
      ips.forEach((ip) => console.log(`  ➜ Sur votre téléphone (même Wi-Fi) : http://${ip}:${PORT}`));
      console.log(`  ➜ Administration : http://localhost:${PORT}/admin/`);
      ips.forEach((ip) => console.log(`  ➜ Administration sur le téléphone : http://${ip}:${PORT}/admin/`));
      console.log("\n  Pour arrêter le site : appuyez sur Ctrl + C dans ce terminal.\n");

      // Met en cache la configuration et les routes de Laravel (plus rapide)
      spawnSync(php, ["artisan", "optimize", "--no-interaction"], { cwd: BACKEND, stdio: "ignore" });

      // Serveur PHP + OPcache ; les fichiers du site sont servis directement (backend/serveur-local.php)
      const server = spawn(
        php,
        ["-d", "zend_extension=opcache", "-d", "opcache.enable_cli=1", "-d", "opcache.validate_timestamps=1", "-d", "opcache.revalidate_freq=0",
          "-S", `0.0.0.0:${PORT}`, "-t", join(ROOT, "frontend"), join(BACKEND, "serveur-local.php")],
        { cwd: join(ROOT, "frontend"), stdio: ["ignore", "inherit", "pipe"] },
      );
      // N'affiche que les erreurs (pas chaque visite)
      server.stderr.on("data", (buf) => {
        for (const line of buf.toString().split(/\r?\n/)) {
          if (!line.trim() || /Accepted|Closing|Closed without sending a request|\[(200|201|204|206|301|302|304|401|404)\]|Development Server .* started/.test(line)) continue;
          console.error(line);
        }
      });
      server.on("exit", (code) => process.exit(code ?? 0));
      const stop = () => server.kill();
      process.on("SIGINT", stop);
      process.on("SIGTERM", stop);
    });
  });
  tester.listen(PORT, "0.0.0.0");
}
