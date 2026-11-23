<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'details' => 'array',
        'images' => 'array',
        'sizes' => 'array',
        'colors' => 'array',
        'price' => 'integer',
        'compare_at_price' => 'integer',
        'stock' => 'integer',
        'popularity' => 'integer',
        'is_new' => 'boolean',
        'is_best_seller' => 'boolean',
    ];

    /** Format JSON attendu par le site (identique à l'ancienne API). */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'collection' => $this->collection ?: null,
            'description' => $this->description,
            'details' => $this->details ?? [],
            'price' => $this->price,
            'compareAtPrice' => $this->compare_at_price,
            'images' => $this->images ?? [],
            'sizes' => $this->sizes ?? [],
            'colors' => $this->colors ?? [],
            'stock' => $this->stock,
            'isNew' => $this->is_new,
            'isBestSeller' => $this->is_best_seller,
            'popularity' => $this->popularity,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
