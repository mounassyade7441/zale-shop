<?php

/*
|--------------------------------------------------------------------------
| CONFIGURATION DE LA BOUTIQUE
|--------------------------------------------------------------------------
| Les informations de la boutique (nom, WhatsApp, adresse, livraison…)
| se modifient directement depuis l'admin : /admin/parametres.html
| Les valeurs ci-dessous ne servent qu'au tout premier démarrage
| (et quand un paramètre n'a jamais été enregistré dans l'admin).
*/

$P = fn (string $file) => "/images/produits/{$file}.jpg";

return [

    // Mot de passe admin du premier démarrage (commande : php artisan boutique:reset-password)
    // Le vrai mot de passe se met dans backend/.env (ADMIN_PASSWORD), jamais ici : ce fichier est publié sur GitHub.
    'admin_password' => env('ADMIN_PASSWORD', 'changez-moi'),

    // Durée d'une session admin (jours)
    'session_days' => 7,

    // Préfixe des références de commande (ex : ZS-261116-AB12)
    'order_prefix' => 'ZS',

    // Dossier du site (HTML/CSS/JS) = dossier public de Laravel
    'frontend_path' => realpath(base_path('../frontend')) ?: base_path('../frontend'),

    'defaults' => [
        'name' => 'Zale Shop International',
        'shortName' => 'ZALE SHOP',
        'baseline' => 'International',
        'tagline' => 'La mode féminine élégante et tendance.',
        'description' => 'Zale Shop International, boutique de mode féminine à Colobane (Dakar) : robes et ensembles élégants et tendance. Livraison partout au Sénégal, paiement par Wave et Orange Money.',

        'whatsapp' => '221770000000', // format international, sans « + » ni espaces
        'phoneDisplay' => '+221 77 000 00 00',
        'email' => '', // vide = l'e-mail n'est pas affiché sur le site
        'address' => 'Colobane',
        'city' => 'Dakar, Sénégal',
        'openingHours' => 'Lun – Sam : 10h – 20h',
        'mapsQuery' => 'Colobane, Dakar',

        'social' => [
            'instagram' => '', // vide = masqué sur le site
            'facebook' => '',
            'tiktok' => 'https://www.tiktok.com/@zallshoplinternational',
        ],

        'currency' => 'FCFA',

        'delivery' => [
            'freeFrom' => 50000,
            'zones' => [
                ['id' => 'dakar', 'label' => 'Dakar & banlieue', 'fee' => 2000, 'delay' => '24 h'],
                ['id' => 'thies-mbour', 'label' => 'Thiès, Mbour, Saly', 'fee' => 3000, 'delay' => '24 – 48 h'],
                ['id' => 'regions', 'label' => 'Autres régions du Sénégal', 'fee' => 4000, 'delay' => '48 – 72 h'],
            ],
        ],

        'payments' => [
            'cod' => false, // paiement à la livraison désactivé
            'wave' => ['enabled' => true, 'number' => '+221 77 000 00 00', 'link' => ''],
            'orangeMoney' => ['enabled' => true, 'number' => '+221 77 000 00 00', 'merchantCode' => ''],
        ],

        'announcements' => [
            'Livraison offerte dès 50 000 FCFA',
            'Livraison partout au Sénégal',
            'Wave & Orange Money acceptés',
            'Commandez en un clic sur WhatsApp',
        ],

        'hero' => [
            // Bannière complète (image avec le texte déjà intégré). Laisser vide pour la version texte + 3 photos.
            'banner' => '/images/banniere-accueil.jpg',
            'eyebrow' => 'Mode féminine',
            'title' => 'La mode féminine',
            'titleItalic' => 'élégante et tendance.',
            'text' => 'Sublimez votre style, révélez votre beauté.',
            'button' => 'Découvrir la boutique',
            'images' => [$P('robe-a-volants-1'), $P('ensemble-tunique-asymetrique-1'), $P('robe-sirene-drapee-1')],
        ],

        'promo' => [
            'eyebrow' => 'Offres privilèges',
            'title' => "Jusqu'à -30%",
            'subtitle' => 'sur une sélection',
            'text' => "Nos pièces coup de cœur à prix doux, uniquement jusqu'à la fin du mois.",
        ],

        'featuredCollection' => 'ensembles-chic',
        'newsletterImage' => $P('robe-a-volants-2'),

        'testimonials' => [
            ['name' => 'Awa, Sacré-Cœur', 'text' => 'Ma robe à volants a fait sensation au baptême de ma nièce. Le tissu est beau et la livraison a été très rapide !'],
            ['name' => 'Coumba, Thiès', 'text' => "Commande passée sur WhatsApp en deux minutes, payée avec Wave. L'ensemble kimono tombe parfaitement. Je recommande."],
            ['name' => 'Rokhaya, Almadies', 'text' => 'Des pièces élégantes à petit prix, et le service client est adorable. Je reviens à chaque nouvel arrivage !'],
        ],
    ],
];
