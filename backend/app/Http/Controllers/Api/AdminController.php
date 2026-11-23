<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\ShopCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** API administrateur (toutes les routes passent par le middleware « admin »). */
class AdminController extends Controller
{
    private const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'TU'];

    private static function str(mixed $v, int $max = 300): string
    {
        return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
    }

    private static function slug(string $s): string
    {
        return Str::slug($s);
    }

    /* ------------------------------ Produits ------------------------------ */

    /** Valide et nettoie les données d'un produit. Retourne [données, erreurs]. */
    private function validateProduct(array $b): array
    {
        $sizes = array_values(array_filter((array) ($b['sizes'] ?? []), fn ($s) => in_array($s, self::SIZES, true)));
        $colors = collect((array) ($b['colors'] ?? []))
            ->map(fn ($c) => [
                'name' => self::str($c['name'] ?? null, 40),
                'hex' => preg_match('/^#[0-9a-f]{6}$/i', $c['hex'] ?? '') ? $c['hex'] : '#cccccc',
            ])
            ->filter(fn ($c) => $c['name'] !== '')->values()->all();
        $images = collect((array) ($b['images'] ?? []))
            ->map(fn ($u) => self::str($u, 1000))
            ->filter(fn ($u) => preg_match('#^(https://|/uploads/|/images/)#', $u))->values()->all();
        $details = collect((array) ($b['details'] ?? []))->map(fn ($d) => self::str($d, 200))->filter()->take(20)->values()->all();

        $p = [
            'name' => self::str($b['name'] ?? null, 120),
            'slug' => self::slug(self::str($b['slug'] ?? null, 140) ?: self::str($b['name'] ?? null, 120)),
            'category' => self::str($b['category'] ?? null, 60),
            'collection' => self::str($b['collection'] ?? null, 60) ?: null,
            'description' => self::str($b['description'] ?? null, 3000),
            'details' => $details,
            'price' => (int) round((float) ($b['price'] ?? 0)),
            'compare_at_price' => ! empty($b['compareAtPrice']) ? (int) round((float) $b['compareAtPrice']) : null,
            'images' => $images,
            'sizes' => $sizes,
            'colors' => $colors,
            'stock' => max(0, (int) round((float) ($b['stock'] ?? 0))),
            'is_new' => (bool) ($b['isNew'] ?? false),
            'is_best_seller' => (bool) ($b['isBestSeller'] ?? false),
        ];

        $errors = [];
        if ($p['name'] === '') $errors[] = 'Le nom est obligatoire.';
        if ($p['slug'] === '') $errors[] = 'Le lien (slug) est obligatoire.';
        if (! Category::find($p['category'])) $errors[] = 'Catégorie invalide.';
        if ($p['collection'] && ! ShopCollection::find($p['collection'])) $errors[] = 'Collection invalide.';
        if ($p['price'] <= 0) $errors[] = 'Le prix doit être supérieur à 0.';
        if ($p['compare_at_price'] !== null && $p['compare_at_price'] <= $p['price']) $errors[] = "L'ancien prix doit être supérieur au prix actuel.";
        if (! $images) $errors[] = 'Ajoutez au moins une photo.';
        if (! $sizes) $errors[] = 'Choisissez au moins une taille.';
        if (! $colors) $errors[] = 'Ajoutez au moins une couleur.';

        return [$p, $errors];
    }

    public function products(): JsonResponse
    {
        return response()->json(Product::orderByDesc('created_at')->get()->map->toApi());
    }

    public function product(int $id): JsonResponse
    {
        $p = Product::find($id);

        return $p ? response()->json($p->toApi()) : response()->json(['error' => 'Produit introuvable.'], 404);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        [$p, $errors] = $this->validateProduct($request->all());
        if ($errors) return response()->json(['error' => implode(' ', $errors)], 400);
        if (Product::where('slug', $p['slug'])->exists()) return response()->json(['error' => 'Un autre produit utilise déjà ce lien.'], 400);

        return response()->json(Product::create([...$p, 'popularity' => 50])->toApi(), 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::find($id);
        if (! $product) return response()->json(['error' => 'Produit introuvable.'], 404);
        [$p, $errors] = $this->validateProduct($request->all());
        if ($errors) return response()->json(['error' => implode(' ', $errors)], 400);
        if (Product::where('slug', $p['slug'])->where('id', '!=', $id)->exists()) {
            return response()->json(['error' => 'Un autre produit utilise déjà ce lien.'], 400);
        }
        $product->update($p);

        return response()->json($product->fresh()->toApi());
    }

    public function updateStock(Request $request, int $id): JsonResponse
    {
        $stock = $request->input('stock');
        if (! is_numeric($stock)) return response()->json(['error' => 'Stock invalide.'], 400);
        $product = Product::find($id);
        if (! $product) return response()->json(['error' => 'Produit introuvable.'], 404);
        $product->update(['stock' => max(0, (int) round((float) $stock))]);

        return response()->json(['ok' => true, 'stock' => $product->stock]);
    }

    public function destroyProduct(int $id): JsonResponse
    {
        Product::whereKey($id)->delete();

        return response()->json(['ok' => true]);
    }

    /** Envoi de photo (image en base64 depuis le navigateur), enregistrée dans frontend/uploads/. */
    public function upload(Request $request): JsonResponse
    {
        if (! preg_match('/^data:image\/(jpeg|png|webp);base64,(.+)$/', (string) $request->input('dataUrl', ''), $m)) {
            return response()->json(['error' => "Format d'image non pris en charge (JPEG, PNG ou WebP)."], 400);
        }
        $binary = base64_decode($m[2], true);
        if ($binary === false || strlen($binary) > 6 * 1024 * 1024) {
            return response()->json(['error' => 'Image invalide ou trop lourde (6 Mo maximum).'], 400);
        }
        $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
        $name = time().'-'.Str::lower(Str::random(8)).'.'.$ext;
        $dir = public_path('uploads');
        if (! is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($dir.DIRECTORY_SEPARATOR.$name, $binary);

        return response()->json(['url' => '/uploads/'.$name], 201);
    }

    /* ------------------------------ Commandes ------------------------------ */

    public function orders(): JsonResponse
    {
        return response()->json(Order::orderByDesc('created_at')->orderByDesc('id')->get()->map->toApi());
    }

    public function updateOrder(Request $request, int $id): JsonResponse
    {
        $status = self::str($request->input('status'), 20);
        if (! in_array($status, Order::STATUSES, true)) return response()->json(['error' => 'Statut invalide.'], 400);
        $order = Order::find($id);
        if (! $order) return response()->json(['error' => 'Commande introuvable.'], 404);

        DB::transaction(function () use ($order, $status) {
            // Annulation : les articles sont remis en stock (et retirés si on « dé-annule »)
            if ($status === 'annulee' && $order->status !== 'annulee') {
                foreach ($order->items as $i) Product::whereKey($i['productId'])->increment('stock', $i['quantity']);
            } elseif ($order->status === 'annulee' && $status !== 'annulee') {
                foreach ($order->items as $i) {
                    Product::whereKey($i['productId'])->update(['stock' => DB::raw('MAX(0, stock - '.(int) $i['quantity'].')')]);
                }
            }
            $order->update(['status' => $status]);
        });

        return response()->json(['ok' => true]);
    }

    /* ------------------------------ Clientes ------------------------------ */

    /** Clientes = commandes regroupées par numéro de téléphone. */
    public function customers(): JsonResponse
    {
        $map = [];
        foreach (Order::orderBy('created_at')->orderBy('id')->get() as $o) {
            $key = substr(preg_replace('/\D/', '', $o->customer_phone), -9);
            $prev = $map[$key] ?? null;
            $map[$key] = [
                'phone' => $o->customer_phone,
                'name' => $o->customer_name,
                'email' => $o->customer_email ?: ($prev['email'] ?? ''),
                'address' => $o->address,
                'ordersCount' => ($prev['ordersCount'] ?? 0) + 1,
                'totalSpent' => ($prev['totalSpent'] ?? 0) + ($o->status === 'annulee' ? 0 : $o->total),
                'lastOrderAt' => $o->created_at?->toIso8601ZuluString(),
            ];
        }
        $list = array_values($map);
        usort($list, fn ($a, $b) => strcmp($b['lastOrderAt'], $a['lastOrderAt']));

        return response()->json($list);
    }

    public function subscribers(): JsonResponse
    {
        return response()->json(NewsletterSubscriber::orderByDesc('created_at')->get());
    }

    public function messages(): JsonResponse
    {
        return response()->json(ContactMessage::orderByDesc('created_at')->orderByDesc('id')->get());
    }

    public function updateMessage(Request $request, int $id): JsonResponse
    {
        ContactMessage::whereKey($id)->update(['is_read' => $request->boolean('read')]);

        return response()->json(['ok' => true]);
    }

    public function destroyMessage(int $id): JsonResponse
    {
        ContactMessage::whereKey($id)->delete();

        return response()->json(['ok' => true]);
    }

    /* ------------------------------ Paramètres ------------------------------ */

    public function settings(): JsonResponse
    {
        return response()->json([
            'shop' => Setting::shop(),
            'categories' => Category::orderBy('position')->orderBy('name')->get(),
            'collections' => ShopCollection::orderBy('position')->orderBy('name')->get(),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $shop = $request->input('shop');
        if (! is_array($shop)) return response()->json(['error' => 'Paramètres invalides.'], 400);
        if (strlen(json_encode($shop)) > 100000) return response()->json(['error' => 'Paramètres trop volumineux.'], 400);
        $zones = $shop['delivery']['zones'] ?? [];
        if (! is_array($zones) || ! $zones) return response()->json(['error' => 'Gardez au moins une zone de livraison.'], 400);

        $shop['delivery']['zones'] = array_values(array_map(fn ($z, $i) => [
            'id' => self::slug((string) (($z['id'] ?? '') ?: ($z['label'] ?? ''))) ?: 'zone-'.($i + 1),
            'label' => self::str($z['label'] ?? null, 80),
            'fee' => max(0, (int) round((float) ($z['fee'] ?? 0))),
            'delay' => self::str($z['delay'] ?? null, 40),
        ], $zones, array_keys($zones)));
        $shop['delivery']['freeFrom'] = max(0, (int) round((float) ($shop['delivery']['freeFrom'] ?? 0)));
        $shop['whatsapp'] = preg_replace('/\D/', '', (string) ($shop['whatsapp'] ?? ''));
        Setting::setValue('shop', $shop);

        foreach ((array) $request->input('categories', []) as $i => $c) {
            $slug = self::slug((string) (($c['slug'] ?? '') ?: ($c['name'] ?? '')));
            $name = self::str($c['name'] ?? null, 60);
            if ($slug === '' || $name === '') continue;
            Category::updateOrCreate(['slug' => $slug], ['name' => $name, 'image' => self::str($c['image'] ?? null, 1000), 'position' => $i]);
        }
        foreach ((array) $request->input('collections', []) as $i => $c) {
            $slug = self::slug((string) (($c['slug'] ?? '') ?: ($c['name'] ?? '')));
            $name = self::str($c['name'] ?? null, 80);
            if ($slug === '' || $name === '') continue;
            ShopCollection::updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'subtitle' => self::str($c['subtitle'] ?? null, 120),
                'description' => self::str($c['description'] ?? null, 1000),
                'image' => self::str($c['image'] ?? null, 1000),
                'position' => $i,
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function destroyCategory(string $slug): JsonResponse
    {
        $used = Product::where('category', $slug)->count();
        if ($used) return response()->json(['error' => "Impossible : {$used} produit(s) utilisent cette catégorie."], 400);
        Category::whereKey($slug)->delete();

        return response()->json(['ok' => true]);
    }

    public function destroyCollection(string $slug): JsonResponse
    {
        Product::where('collection', $slug)->update(['collection' => null]);
        ShopCollection::whereKey($slug)->delete();

        return response()->json(['ok' => true]);
    }
}
