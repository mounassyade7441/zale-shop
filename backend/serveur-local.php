<?php

/*
| Routeur du serveur de développement PHP (utilisé par « npm start »).
| - Les fichiers du site (HTML, CSS, JS, images) sont servis directement : rapide.
| - Tout le reste (/api/..., sitemap.xml, robots.txt, pages introuvables) passe par Laravel.
| En production (Apache/Nginx), ce rôle est tenu par frontend/.htaccess ou la configuration du serveur.
*/

$public = realpath(__DIR__.'/../frontend');
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

// Page d'accueil : le fichier index.html du site
if ($uri === '/') {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache');
    readfile($public.'/index.html');

    return true;
}

// Fichier ou dossier (avec index.html) existant : servi tel quel par PHP
$path = realpath($public.$uri);
if ($path !== false && str_starts_with($path, $public) && (is_file($path) || is_file($path.DIRECTORY_SEPARATOR.'index.html'))) {
    if (preg_match('/\.(html|css|js)$/', $path)) {
        header('Cache-Control: no-cache'); // les modifications s'affichent tout de suite
    }

    return false;
}

// Sinon : Laravel
require $public.'/index.php';
