# Zale Shop — API et administration (Laravel 12)

Partie serveur de la boutique : catalogue, commandes, contact, newsletter et espace administrateur.
Le guide complet (lancement, administration, mise en ligne) est dans le [README principal](../README.md).

## Démarrage rapide

```bash
composer install
cp .env.example .env      # Windows (cmd) : copy .env.example .env
php artisan key:generate
php artisan migrate --seed  # la base MySQL "zale_shop" doit exister
```

Depuis la racine du projet, `npm start` lance le site complet (port 3000).

## Où trouver quoi

| Dossier / fichier | Rôle |
|---|---|
| `app/Http/Controllers/Api/PublicController.php` | Catalogue, commandes, contact, newsletter |
| `app/Http/Controllers/Api/AdminController.php` | Produits, commandes, clientes, messages, paramètres |
| `app/Http/Controllers/Api/AdminAuthController.php` | Connexion admin, mot de passe |
| `app/Http/Middleware/EnsureAdmin.php` | Protection des routes admin |
| `routes/web.php` | Toutes les routes `/api/...` |
| `config/boutique.php` | Réglages du premier démarrage |
| `database/seeders/BoutiqueSeeder.php` | Catalogue de démonstration |
