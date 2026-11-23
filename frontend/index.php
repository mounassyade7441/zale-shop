<?php

/*
| Point d'entrée de Laravel (le backend se trouve dans ../backend).
| Les pages du site sont les fichiers .html de ce dossier ;
| ce fichier ne sert qu'aux adresses gérées par Laravel (/api/..., accueil, sitemap…).
*/

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$backend = __DIR__.'/../backend';

// Mode maintenance (php artisan down)
if (file_exists($maintenance = $backend.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $backend.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $backend.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
