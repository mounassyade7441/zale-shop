<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Protège les routes de l'admin : session admin valide obligatoire. */
class EnsureAdmin
{
    public static function check(Request $request): bool
    {
        $until = $request->session()->get('admin_until');

        return $request->session()->get('admin') === true && is_int($until) && $until > time();
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (! self::check($request)) {
            return response()->json(['error' => 'Session expirée. Reconnectez-vous.'], 401);
        }

        return $next($request);
    }
}
