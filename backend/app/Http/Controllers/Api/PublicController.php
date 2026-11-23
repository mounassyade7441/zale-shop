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
use RuntimeException;

/** API publique : réglages, catalogue, commandes, newsletter, contact. */
class PublicController extends Controller
{
    private static function str(mixed $v, int $max = 300): string
    {
        return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
    }

    private static function isEmail(string $v): bool
    {
        return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $v);
    }

    /** Paramètres publics de la boutique + catégories + collections. */
    public function config(): JsonResponse
    {
        return response()->json([
            'shop' => Setting::shop(),
            'categories' => Category::orderBy('position')->orderBy('name')->get(['slug', 'name', 'image']),
            'collections' => ShopCollection::orderBy('position')->orderBy('name')->get(['slug', 'name', 'subtitle', 'description', 'image']),
        ]);
    }

    public function products(): JsonResponse
    {
        return response()->json(Product::orderByDesc('created_at')->get()->map->toApi());
    }

    public function product(string $slug): JsonResponse
    {
        $p = Product::where('slug', $slug)->first();

        return $p ? response()->json($p->toApi()) : response()->json(['error' => 'Article introuvable.'], 404);
    }

    /** Création d'une commande : prix et stock relus en base (jamais ceux envoyés par le navigateur). */
    public function storeOrder(Request $request): JsonResponse
    {
        $shop = Setting::shop();
        $c = (array) $request->input('customer', []);
        $customer = [
            'name' => self::str($c['name'] ?? null, 120),
            'phone' => self::str($c['phone'] ?? null, 30),
            'email' => self::str($c['email'] ?? null, 120),
            'address' => self::str($c['address'] ?? null, 300),
            'zone' => self::str($c['zone'] ?? null, 40),
            'notes' => self::str($c['notes'] ?? null, 500),
        ];
        $payment = self::str($request->input('paymentMethod'), 20);
        $items = $request->input('items');
        $items = is_array($items) ? $items : [];

        $fail = fn (string $msg) => response()->json(['error' => $msg], 400);
        if (mb_strlen($customer['name']) < 2) return $fail('Indiquez votre nom complet.');
        $digits = preg_replace('/\D/', '', $customer['phone']);
        if (strlen($digits) < 9 || strlen($digits) > 15) return $fail('Numéro de téléphone invalide.');
        if (preg_match('/^\d{9}$/', str_replace(' ', '', $customer['phone']))) $customer['phone'] = '+221 '.$customer['phone'];
        if ($customer['email'] !== '' && ! self::isEmail($customer['email'])) return $fail('Adresse e-mail invalide.');
        if (mb_strlen($customer['address']) < 5) return $fail('Précisez votre adresse de livraison.');
        $zone = collect($shop['delivery']['zones'])->firstWhere('id', $customer['zone']);
        if (! $zone) return $fail('Zone de livraison invalide.');
        $allowed = array_filter([
            'cod' => ($shop['payments']['cod'] ?? false) === true,
            'wave' => ($shop['payments']['wave']['enabled'] ?? true) !== false,
            'orange_money' => ($shop['payments']['orangeMoney']['enabled'] ?? true) !== false,
        ]);
        if (! array_key_exists($payment, $allowed)) return $fail('Moyen de paiement invalide.');
        if (count($items) === 0 || count($items) > 50) return $fail('Votre panier est vide.');

        try {
            $order = DB::transaction(function () use ($items, $customer, $zone, $payment, $shop) {
                $lines = [];
                foreach ($items as $it) {
                    $qty = filter_var($it['quantity'] ?? null, FILTER_VALIDATE_INT);
                    if ($qty === false || $qty < 1 || $qty > 20) throw new RuntimeException('Quantité invalide.');
                    $product = Product::lockForUpdate()->find((int) ($it['productId'] ?? 0));
                    if (! $product) throw new RuntimeException("Un article de votre panier n'est plus disponible.");
                    $size = self::str($it['size'] ?? null, 10);
                    if (! in_array($size, $product->sizes, true)) throw new RuntimeException("Taille indisponible pour « {$product->name} ».");
                    $color = self::str($it['color'] ?? null, 40);
                    if ($product->colors && ! collect($product->colors)->contains('name', $color)) {
                        throw new RuntimeException("Couleur indisponible pour « {$product->name} ».");
                    }
                    $lines[] = compact('product', 'size', 'color', 'qty');
                }

                // Stock : additionne les quantités d'un même produit (plusieurs couleurs possibles)
                $totals = [];
                foreach ($lines as $l) $totals[$l['product']->id] = ($totals[$l['product']->id] ?? 0) + $l['qty'];
                foreach ($totals as $id => $qty) {
                    $p = collect($lines)->first(fn ($l) => $l['product']->id === $id)['product'];
                    if ($p->stock < $qty) throw new RuntimeException("Stock insuffisant pour « {$p->name} » (reste {$p->stock}).");
                    $p->decrement('stock', $qty);
                    $p->increment('popularity', $qty);
                }

                $orderItems = array_map(fn ($l) => [
                    'productId' => $l['product']->id,
                    'name' => $l['product']->name,
                    'image' => $l['product']->images[0] ?? '',
                    'price' => $l['product']->price,
                    'size' => $l['size'],
                    'color' => $l['color'],
                    'quantity' => $l['qty'],
                ], $lines);
                $subtotal = array_sum(array_map(fn ($i) => $i['price'] * $i['quantity'], $orderItems));
                $fee = $subtotal >= $shop['delivery']['freeFrom'] ? 0 : (int) $zone['fee'];

                do {
                    $reference = config('boutique.order_prefix').'-'.now()->format('ymd').'-'.Str::upper(Str::random(4));
                } while (Order::where('reference', $reference)->exists());

                return Order::create([
                    'reference' => $reference,
                    'customer_name' => $customer['name'],
                    'customer_phone' => $customer['phone'],
                    'customer_email' => $customer['email'] ?: null,
                    'address' => $customer['address'],
                    'zone' => $zone['id'],
                    'notes' => $customer['notes'] ?: null,
                    'items' => $orderItems,
                    'subtotal' => $subtotal,
                    'delivery_fee' => $fee,
                    'total' => $subtotal + $fee,
                    'payment_method' => $payment,
                    'status' => 'nouvelle',
                ]);
            });
        } catch (RuntimeException $e) {
            return $fail($e->getMessage());
        }

        return response()->json($order->toApi(), 201);
    }

    public function newsletter(Request $request): JsonResponse
    {
        $email = mb_strtolower(self::str($request->input('email'), 160));
        if (! self::isEmail($email)) return response()->json(['error' => 'Adresse e-mail invalide.'], 400);
        NewsletterSubscriber::firstOrCreate(['email' => $email]);

        return response()->json(['ok' => true], 201);
    }

    public function message(Request $request): JsonResponse
    {
        $m = [
            'name' => self::str($request->input('name'), 120),
            'phone' => self::str($request->input('phone'), 30),
            'email' => self::str($request->input('email'), 160),
            'subject' => self::str($request->input('subject'), 160),
            'message' => self::str($request->input('message'), 3000),
        ];
        $fail = fn (string $msg) => response()->json(['error' => $msg], 400);
        if ($m['name'] === '' || $m['message'] === '') return $fail('Merci de renseigner votre nom et votre message.');
        if ($m['phone'] === '' && $m['email'] === '') return $fail('Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.');
        if ($m['email'] !== '' && ! self::isEmail($m['email'])) return $fail('Adresse e-mail invalide.');

        ContactMessage::create([...$m, 'phone' => $m['phone'] ?: null, 'email' => $m['email'] ?: null]);

        return response()->json(['ok' => true], 201);
    }
}
