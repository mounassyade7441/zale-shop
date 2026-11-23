<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureAdmin;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/** Connexion / déconnexion de l'administratrice. */
class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $key = 'admin-login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 10)) {
            return response()->json(['error' => 'Trop de tentatives. Réessayez dans 15 minutes.'], 429);
        }

        $hash = Setting::getValue('admin_password');
        $password = (string) $request->input('password', '');
        if (! is_string($hash) || ! Hash::check($password, $hash)) {
            RateLimiter::hit($key, 15 * 60);

            return response()->json(['error' => 'Mot de passe incorrect.'], 401);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put('admin', true);
        $request->session()->put('admin_until', time() + config('boutique.session_days') * 86400);

        return response()->json(['ok' => true]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['authenticated' => EnsureAdmin::check($request)]);
    }

    public function password(Request $request): JsonResponse
    {
        if (! Hash::check((string) $request->input('current', ''), (string) Setting::getValue('admin_password'))) {
            return response()->json(['error' => 'Mot de passe actuel incorrect.'], 400);
        }
        $next = $request->input('next');
        if (! is_string($next) || mb_strlen($next) < 8) {
            return response()->json(['error' => 'Le nouveau mot de passe doit faire au moins 8 caractères.'], 400);
        }
        Setting::setValue('admin_password', Hash::make($next));
        self::forgetAllSessions(); // déconnecte tous les appareils

        return response()->json(['ok' => true]);
    }

    /** Supprime toutes les sessions (fichiers ou base de données selon SESSION_DRIVER). */
    public static function forgetAllSessions(): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->delete();
        } elseif (config('session.driver') === 'file') {
            foreach (glob(config('session.files').DIRECTORY_SEPARATOR.'*') ?: [] as $file) {
                if (is_file($file) && ! str_starts_with(basename($file), '.')) @unlink($file);
            }
        }
    }
}
