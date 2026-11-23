<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\ShopCollection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Catalogue de départ (photos dans frontend/images/).
 * Commande pour repartir de ces données : php artisan boutique:reset
 * (les paramètres, la newsletter, les messages et le mot de passe sont conservés).
 */
class BoutiqueSeeder extends Seeder
{
    private static function p(string $file): string
    {
        return "/images/produits/{$file}.jpg";
    }

    public function run(): void
    {
        DB::transaction(function () {
            Order::query()->delete();
            Product::query()->delete();
            Category::query()->delete();
            ShopCollection::query()->delete();

            $this->categories();
            $this->collections();
            $this->products();
            $this->demoOrders();
        });

        if (! Setting::getValue('admin_password')) {
            Setting::setValue('admin_password', Hash::make(config('boutique.admin_password')));
        }
    }

    private function categories(): void
    {
        $rows = [
            ['slug' => 'robes', 'name' => 'Robes', 'image' => self::p('robe-a-volants-1')],
            ['slug' => 'ensembles', 'name' => 'Ensembles', 'image' => self::p('ensemble-tunique-asymetrique-2')],
        ];
        foreach ($rows as $i => $c) Category::create([...$c, 'position' => $i]);
    }

    private function collections(): void
    {
        $rows = [
            [
                'slug' => 'soirees-ceremonies', 'name' => 'Soirées & Cérémonies', 'subtitle' => 'Collection Élégance',
                'description' => 'Des robes amples et raffinées pour briller lors de vos mariages, baptêmes et soirées.',
                'image' => self::p('robe-sirene-drapee-1'),
            ],
            [
                'slug' => 'ensembles-chic', 'name' => 'Ensembles Chic', 'subtitle' => 'Collection Confort',
                'description' => "Tuniques fluides et pantalons larges : l'élégance confortable, du matin au soir.",
                'image' => self::p('ensemble-kimono-imprime-1'),
            ],
            [
                'slug' => 'carreaux-tendance', 'name' => 'Carreaux Tendance', 'subtitle' => 'Collection Casual Chic',
                'description' => 'Chemises oversize et pantalons palazzo à carreaux : la tendance décontractée et stylée.',
                'image' => self::p('ensemble-carreaux-rose-detail'),
            ],
        ];
        foreach ($rows as $i => $c) ShopCollection::create([...$c, 'position' => $i]);
    }

    private function products(): void
    {
        $care = ['Taille standard', 'Lavage délicat à 30 °C', 'Repassage doux'];
        $rows = [
            [
                'slug' => 'robe-a-volants', 'name' => 'Robe à volants', 'category' => 'robes', 'collection' => 'soirees-ceremonies',
                'images' => [self::p('robe-a-volants-1'), self::p('robe-a-volants-2'), self::p('robe-a-volants')],
                'colors' => [['name' => 'Orange', 'hex' => '#E8701E'], ['name' => 'Violet', 'hex' => '#5B21B6']],
                'is_new' => true, 'is_best_seller' => true, 'popularity' => 98,
                'description' => 'Robe longue et ample à col montant, manches et ourlet à volants superposés. Une pièce lumineuse et élégante qui se porte avec des talons pour vos cérémonies.',
            ],
            [
                'slug' => 'robe-sirene-drapee', 'name' => 'Robe sirène drapée', 'category' => 'robes', 'collection' => 'soirees-ceremonies',
                'images' => [self::p('robe-sirene-drapee-1'), self::p('robe-sirene-drapee-2'), self::p('robe-sirene-drapee')],
                'colors' => [['name' => 'Rouge fleuri', 'hex' => '#B3262E'], ['name' => 'Blanc fleuri', 'hex' => '#ECE7E2']],
                'is_new' => false, 'is_best_seller' => true, 'popularity' => 95,
                'description' => "Robe sirène rouge surmontée d'un haut drapé fleuri à manches cape. Une silhouette sculptée et spectaculaire pour vos soirées.",
            ],
            [
                'slug' => 'ensemble-tunique-asymetrique', 'name' => 'Ensemble tunique asymétrique', 'category' => 'ensembles', 'collection' => 'ensembles-chic',
                'images' => [self::p('ensemble-tunique-asymetrique-1'), self::p('ensemble-tunique-asymetrique-2'), self::p('ensemble-tunique-asymetrique')],
                'colors' => [['name' => "Vert d'eau", 'hex' => '#5F9E98'], ['name' => 'Moutarde', 'hex' => '#C9A92C']],
                'is_new' => true, 'is_best_seller' => false, 'popularity' => 90,
                'description' => 'Ensemble deux pièces : tunique fluide à col chemise et ourlet asymétrique, avec pantalon large assorti. Chic et confortable au quotidien.',
            ],
            [
                'slug' => 'ensemble-kimono-imprime', 'name' => 'Ensemble kimono imprimé', 'category' => 'ensembles', 'collection' => 'ensembles-chic',
                'images' => [self::p('ensemble-kimono-imprime-1'), self::p('ensemble-kimono-imprime-2'), self::p('ensemble-kimono-imprime')],
                'colors' => [['name' => 'Bleu marine', 'hex' => '#1F2A44'], ['name' => 'Vert olive', 'hex' => '#6B7A2E']],
                'is_new' => true, 'is_best_seller' => true, 'popularity' => 92,
                'description' => "Tunique kimono à motifs floraux, encolure V brodée et nœud à la taille, portée avec un pantalon large uni. L'allure d'une grande dame en toute simplicité.",
            ],
            [
                'slug' => 'ensemble-carreaux-noir', 'name' => 'Ensemble à carreaux noir', 'category' => 'ensembles', 'collection' => 'carreaux-tendance',
                'images' => [self::p('ensemble-carreaux-noir'), self::p('ensemble-carreaux-noir-detail')],
                'colors' => [['name' => 'Noir & beige', 'hex' => '#151313']],
                'is_new' => false, 'is_best_seller' => true, 'popularity' => 88,
                'description' => 'Chemise oversize à manches mi-longues et pantalon palazzo à carreaux noir et beige. Un ensemble tendance et facile à porter.',
            ],
            [
                'slug' => 'ensemble-carreaux-rose', 'name' => 'Ensemble à carreaux rose', 'category' => 'ensembles', 'collection' => 'carreaux-tendance',
                'images' => [self::p('ensemble-carreaux-rose'), self::p('ensemble-carreaux-rose-detail')],
                'colors' => [['name' => 'Rose fuchsia', 'hex' => '#D23A6A']],
                'is_new' => true, 'is_best_seller' => false, 'popularity' => 86,
                'description' => 'Chemise oversize et pantalon palazzo à carreaux rose et blanc. Fraîche, féminine et pleine de peps.',
            ],
        ];

        foreach ($rows as $i => $p) {
            $date = Carbon::create(2026, 11, 16, 0, 0, 0, 'UTC')->subHours($i);
            Product::create([
                ...$p,
                'price' => 5000,
                'compare_at_price' => null,
                'sizes' => ['TU'], // « TU » s'affiche « Standard » sur le site
                'details' => $care,
                'stock' => 20,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }

    private function demoOrders(): void
    {
        $products = Product::orderBy('id')->get()->values();
        $people = [
            ['Aïssatou Diop', '+221 77 123 45 67', 'aissatou.d@exemple.sn', 'Sacré-Cœur 3, villa 112', 'dakar'],
            ['Fatou Ndiaye', '+221 78 234 56 78', null, 'Ouest Foire, cité Air France', 'dakar'],
            ['Mariama Ba', '+221 76 345 67 89', 'mariama.ba@exemple.sn', 'Quartier Escale, près de la gare', 'thies-mbour'],
            ['Khady Sarr', '+221 70 456 78 90', null, 'Saint-Louis, Sor', 'regions'],
            ['Ndeye Fall', '+221 77 567 89 01', null, 'Almadies, route de Ngor', 'dakar'],
        ];
        $lines = [[[0, 1], [3, 1]], [[1, 1]], [[2, 2]], [[4, 1], [5, 1]], [[0, 1]], [[3, 1]]];
        $statuses = ['nouvelle', 'confirmee', 'en_preparation', 'expediee', 'livree', 'livree'];
        $payments = ['wave', 'orange_money', 'orange_money', 'wave', 'wave', 'orange_money'];
        $fees = ['dakar' => 2000, 'thies-mbour' => 3000, 'regions' => 4000];

        foreach ($lines as $i => $ls) {
            $items = array_map(function ($l) use ($products) {
                $p = $products[$l[0]];

                return [
                    'productId' => $p->id, 'name' => $p->name, 'image' => $p->images[0], 'price' => $p->price,
                    'size' => 'TU', 'color' => $p->colors[0]['name'] ?? '', 'quantity' => $l[1],
                ];
            }, $ls);
            [$name, $phone, $email, $address, $zone] = $people[$i % count($people)];
            $subtotal = array_sum(array_map(fn ($it) => $it['price'] * $it['quantity'], $items));
            $date = now()->subMinutes((int) (($i * 1.7 + 0.2) * 1440));

            Order::create([
                'reference' => sprintf('%s-DEMO-%03d', config('boutique.order_prefix'), $i + 1),
                'customer_name' => $name, 'customer_phone' => $phone, 'customer_email' => $email,
                'address' => $address, 'zone' => $zone, 'notes' => null,
                'items' => $items, 'subtotal' => $subtotal, 'delivery_fee' => $fees[$zone], 'total' => $subtotal + $fees[$zone],
                'payment_method' => $payments[$i], 'status' => $statuses[$i],
                'created_at' => $date, 'updated_at' => $date,
            ]);
        }
    }
}
