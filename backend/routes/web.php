<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API publique (utilisée par les pages du site)
|--------------------------------------------------------------------------
*/
Route::prefix('api')->group(function () {
    Route::get('config', [PublicController::class, 'config']);
    Route::get('products', [PublicController::class, 'products']);
    Route::get('products/{slug}', [PublicController::class, 'product']);

    Route::middleware('throttle:30,1')->group(function () {
        Route::post('orders', [PublicController::class, 'storeOrder']);
        Route::post('newsletter', [PublicController::class, 'newsletter']);
        Route::post('messages', [PublicController::class, 'message']);
    });

    /*
    |----------------------------------------------------------------------
    | API administrateur
    |----------------------------------------------------------------------
    */
    Route::prefix('admin')->group(function () {
        Route::post('login', [AdminAuthController::class, 'login']);
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('me', [AdminAuthController::class, 'me']);

        Route::middleware('admin')->group(function () {
            Route::get('products', [AdminController::class, 'products']);
            Route::post('products', [AdminController::class, 'storeProduct']);
            Route::get('products/{id}', [AdminController::class, 'product'])->whereNumber('id');
            Route::put('products/{id}', [AdminController::class, 'updateProduct'])->whereNumber('id');
            Route::patch('products/{id}/stock', [AdminController::class, 'updateStock'])->whereNumber('id');
            Route::delete('products/{id}', [AdminController::class, 'destroyProduct'])->whereNumber('id');
            Route::post('upload', [AdminController::class, 'upload']);

            Route::get('orders', [AdminController::class, 'orders']);
            Route::patch('orders/{id}', [AdminController::class, 'updateOrder'])->whereNumber('id');

            Route::get('customers', [AdminController::class, 'customers']);
            Route::get('subscribers', [AdminController::class, 'subscribers']);
            Route::get('messages', [AdminController::class, 'messages']);
            Route::patch('messages/{id}', [AdminController::class, 'updateMessage'])->whereNumber('id');
            Route::delete('messages/{id}', [AdminController::class, 'destroyMessage'])->whereNumber('id');

            Route::get('settings', [AdminController::class, 'settings']);
            Route::put('settings', [AdminController::class, 'updateSettings']);
            Route::delete('categories/{slug}', [AdminController::class, 'destroyCategory']);
            Route::delete('collections/{slug}', [AdminController::class, 'destroyCollection']);
            Route::put('password', [AdminAuthController::class, 'password']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Site (dossier frontend/)
|--------------------------------------------------------------------------
| Les fichiers existants (HTML, CSS, JS, images) sont servis directement.
*/
Route::get('/', [FrontendController::class, 'home']);
Route::get('/robots.txt', [FrontendController::class, 'robots']);
Route::get('/sitemap.xml', [FrontendController::class, 'sitemap']);
Route::fallback([FrontendController::class, 'notFound']);
