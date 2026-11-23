<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Models\Setting;
use Database\Seeders\BoutiqueSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

/*
| Commandes de la boutique :
|   php artisan boutique:reset           → remet le catalogue et les commandes de démonstration
|   php artisan boutique:reset-password  → remet le mot de passe admin de config/boutique.php
*/

Artisan::command('boutique:reset {--force : Ne pas demander de confirmation}', function () {
    if (! $this->option('force') && ! $this->confirm('Remplacer les produits et les commandes par ceux de démonstration ?')) {
        return;
    }
    $this->call('db:seed', ['--class' => BoutiqueSeeder::class, '--force' => true]);
    $this->info('✓ Catalogue et commandes de démonstration restaurés.');
    $this->line('  (Les paramètres, la newsletter, les messages et le mot de passe admin sont conservés.)');
})->purpose('Remet le catalogue et les commandes de démonstration');

Artisan::command('boutique:reset-password', function () {
    Setting::setValue('admin_password', Hash::make(config('boutique.admin_password')));
    AdminAuthController::forgetAllSessions();
    $this->info('✓ Mot de passe admin mis à jour (valeur « admin_password » de config/boutique.php ou ADMIN_PASSWORD du .env).');
})->purpose('Remet le mot de passe admin défini dans la configuration');
