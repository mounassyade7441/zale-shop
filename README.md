# Zale Shop International — boutique en ligne de mode féminine

Site e-commerce en deux parties :

```
site-pre-a-porter/
├── frontend/                 Site public (HTML, CSS, JavaScript), servi comme dossier public de Laravel
│   ├── index.html            Accueil
│   ├── boutique.html, nouveautes.html, promotions.html, collections.html, collection.html
│   ├── produit.html, panier.html, commande.html, confirmation.html, favoris.html, contact.html, 404.html
│   ├── admin/                Espace administrateur (pages HTML)
│   ├── css/style.css         Couleurs, polices, mise en page
│   ├── js/                   Scripts du site et de l'admin
│   ├── images/               Photos (produits, bannière, logos Wave / Orange Money)
│   ├── uploads/              Photos envoyées depuis l'admin
│   ├── index.php             Point d'entrée de Laravel (ne pas supprimer)
│   └── .htaccess             Configuration pour un hébergement Apache
│
├── backend/                  API et administration : application Laravel 12 (PHP)
│   ├── app/Models/           Product, Order, Category, ShopCollection, Setting, ContactMessage, NewsletterSubscriber
│   ├── app/Http/Controllers/Api/
│   │   ├── PublicController.php     Catalogue, commandes, contact, newsletter
│   │   ├── AdminAuthController.php  Connexion admin, mot de passe
│   │   └── AdminController.php      Produits, commandes, clientes, messages, paramètres
│   ├── app/Http/Middleware/EnsureAdmin.php   Protection des routes admin
│   ├── routes/web.php        Toutes les adresses /api/...
│   ├── routes/console.php    Commandes boutique:reset et boutique:reset-password
│   ├── config/boutique.php   Réglages du 1er démarrage (nom, WhatsApp, livraison…)
│   ├── database/migrations/  Structure de la base de données
│   ├── database/seeders/BoutiqueSeeder.php   Catalogue de départ
│   ├── (base de données MySQL « zale_shop » dans Laragon — voir § 5)
│   ├── serveur-local.php     Routeur du serveur local (npm start)
│   └── .env                  Paramètres secrets (mot de passe admin, clé de l'application)
│
├── scripts/lancer.mjs        Lanceur utilisé par « npm start »
├── demarrer-le-site.bat      Double-clic pour lancer le site
└── autoriser-acces-telephone.bat Double-clic (une seule fois) pour l'accès téléphone
```

## 1. Lancer le site

**Prérequis** : PHP 8.2+ (fourni par **Laragon**, déjà installé), Composer (fourni par Laragon) et Node.js
(uniquement pour la commande `npm start`).

Dans un terminal (PowerShell, ou le terminal de VS Code avec `Ctrl + ù`) :

```powershell
cd C:\SRC\site-pre-a-porter
npm start
```

Le terminal affiche les adresses du site et de l'administration. Pour **arrêter** : `Ctrl + C`.
Vous pouvez aussi double-cliquer sur `demarrer-le-site.bat`.

| Commande (dans `C:\SRC\site-pre-a-porter`) | Rôle |
|---|---|
| `npm start` | Démarrer le site (port 3000) |
| `npm run install-all` | Installer Laravel sur un nouvel ordinateur (composer install + base de données) |
| `npm run reset` | **Remettre le catalogue et les commandes de démonstration** (vos produits et commandes sont remplacés) |
| `npm run reset-password` | Remettre le mot de passe admin indiqué dans `backend/.env` (`ADMIN_PASSWORD`) |
| `npm run artisan -- <commande>` | Lancer n'importe quelle commande Laravel, ex. `npm run artisan -- migrate` |

Avec PHP dans votre PATH, les commandes Laravel classiques marchent aussi depuis `backend/` :
`php artisan boutique:reset`, `php artisan boutique:reset-password`, `php artisan migrate`…

## 2. Ouvrir le site sur un téléphone

1. L'ordinateur et le téléphone doivent être sur **le même Wi-Fi**.
2. **Une seule fois** : double-cliquez sur `autoriser-acces-telephone.bat` et acceptez la demande de Windows.
3. Sur le téléphone, tapez l'adresse `http://192.168.x.x:3000` affichée au démarrage.

## 3. Espace administrateur

Adresse : `/admin/` (ex. http://localhost:3000/admin/). Mot de passe : celui de `ADMIN_PASSWORD` dans
`backend/.env` au premier démarrage, modifiable ensuite dans **Paramètres › Mot de passe administrateur**.

| Menu | Ce que vous pouvez faire |
|---|---|
| Tableau de bord | Chiffre d'affaires, commandes à traiter, stock faible |
| Produits | Ajouter, modifier, supprimer ; photos ; prix et promo ; tailles ; couleurs ; stock |
| Commandes | Statuts (nouvelle → livrée), détail, prévenir la cliente sur WhatsApp ; annuler remet le stock |
| Clientes | Historique d'achat, export Excel (CSV), abonnées newsletter |
| Messages | Messages du formulaire de contact |
| **Paramètres** | Nom, WhatsApp, adresse, réseaux, bannière, livraison, paiements, catégories, collections… |

## 4. Personnaliser

| Je veux changer… | Où |
|---|---|
| Nom, WhatsApp, adresse, livraison, paiements, textes de l'accueil | **Admin › Paramètres** (sans code) |
| Couleurs, polices | `frontend/css/style.css` (variables en haut du fichier) |
| Textes fixes d'une page | le fichier `.html` correspondant dans `frontend/` |
| Menu, pied de page | `frontend/js/layout.js` |
| Réglages du 1er démarrage | `backend/config/boutique.php` |
| Catalogue de démonstration | `backend/database/seeders/BoutiqueSeeder.php`, puis `npm run reset` |

## 5. La base de données

- Moteur : **MySQL** (celui de Laragon), via Laravel (Eloquent). Base : **`zale_shop`**, utilisateur `root`
  sans mot de passe (réglages `DB_*` dans `backend/.env`).
- `npm start` démarre MySQL tout seul s'il est éteint. Sinon : Laragon › « Démarrer tout ».
- Pour voir les données : Laragon › bouton « Base de données » (HeidiSQL), ou `http://localhost/phpmyadmin` si installé.
- Structure : `backend/database/migrations/2026_11_16_000001_create_boutique_tables.php`
  (tables `settings`, `categories`, `collections`, `products`, `orders`, `newsletter_subscribers`, `contact_messages`).
- Revenir à SQLite : dans `backend/.env`, mettre `DB_CONNECTION=sqlite` (et commenter les lignes `DB_*`).

**Sauvegarde** : exportez la base (Laragon › Terminal :
`mysqldump -uroot zale_shop > sauvegarde.sql`) et copiez le dossier `frontend/uploads/`.

## 6. Mise en ligne

Sur un hébergement PHP (mutualisé avec SSH, VPS, Laravel Forge…) :

1. Envoyez les dossiers `backend/` et `frontend/`, côte à côte.
2. Le **dossier public** (« document root ») du domaine doit être **`frontend/`**.
3. Dans `backend/` : `composer install --no-dev`, puis dans `.env` : `APP_ENV=production`, `APP_DEBUG=false`,
   `APP_URL=https://votre-domaine`, puis `php artisan migrate --force` et `php artisan optimize`.
4. Activez **HTTPS** (Let's Encrypt, généralement proposé par l'hébergeur).
5. Les dossiers `backend/storage/`, `backend/database/` et `frontend/uploads/` doivent être accessibles en écriture.

## Sécurité

- Mot de passe admin chiffré (bcrypt), session Laravel (cookie `HttpOnly`, `SameSite=Strict`), 10 tentatives / 15 min.
- Toutes les routes admin protégées par le middleware `admin`.
- Prix, stock et frais de livraison recalculés par le serveur (transaction avec verrouillage du stock).
- Limite de 30 commandes / messages par minute et par visiteur.
