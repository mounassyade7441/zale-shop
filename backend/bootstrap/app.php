<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // L'API est appelée en JavaScript (fetch) par le site : pas de jeton CSRF.
        // Protection assurée par le cookie de session « SameSite=Strict ».
        $middleware->validateCsrfTokens(except: ['api/*']);
        $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Les erreurs de l'API sont toujours renvoyées en JSON
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));
    })->create();

// Le dossier public de Laravel est le dossier du site : ../frontend
$app->usePublicPath(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'frontend');

return $app;
