<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ShopCollection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Le site (pages HTML) se trouve dans le dossier frontend/, qui est le dossier public de Laravel.
 * Les fichiers existants (HTML, CSS, JS, images) sont servis directement ;
 * ce contrôleur gère seulement la page d'accueil, robots.txt, sitemap.xml et la page 404.
 */
class FrontendController extends Controller
{
    private function page(string $file, int $status = 200): BinaryFileResponse|Response
    {
        $path = public_path($file);
        if (! is_file($path)) {
            return response('Page introuvable', 404);
        }

        return response()->file($path, ['Content-Type' => 'text/html; charset=UTF-8', 'Cache-Control' => 'no-cache'])->setStatusCode($status);
    }

    public function home(): BinaryFileResponse|Response
    {
        return $this->page('index.html');
    }

    public function notFound(Request $request)
    {
        if ($request->is('api/*')) {
            return response()->json(['error' => 'Route inconnue.'], 404);
        }

        return $this->page('404.html', 404);
    }

    public function robots(Request $request): Response
    {
        $base = $request->getSchemeAndHttpHost();

        return response("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /panier.html\nDisallow: /commande.html\nSitemap: {$base}/sitemap.xml\n")
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }

    public function sitemap(Request $request): Response
    {
        $base = $request->getSchemeAndHttpHost();
        $urls = ['/', '/boutique.html', '/nouveautes.html', '/collections.html', '/promotions.html', '/contact.html'];
        foreach (ShopCollection::pluck('slug') as $slug) $urls[] = "/collection.html?slug={$slug}";
        foreach (Product::pluck('slug') as $slug) $urls[] = "/produit.html?slug={$slug}";

        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($urls as $u) $xml .= '<url><loc>'.htmlspecialchars($base.$u, ENT_XML1).'</loc></url>';
        $xml .= '</urlset>';

        return response($xml)->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}
