<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const STATUSES = ['nouvelle', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

    protected $guarded = ['id'];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'integer',
        'delivery_fee' => 'integer',
        'total' => 'integer',
    ];

    /** Format JSON attendu par le site (identique à l'ancienne API). */
    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'customer' => [
                'name' => $this->customer_name,
                'phone' => $this->customer_phone,
                'email' => $this->customer_email ?? '',
                'address' => $this->address,
                'zone' => $this->zone,
                'notes' => $this->notes ?? '',
            ],
            'items' => $this->items ?? [],
            'subtotal' => $this->subtotal,
            'deliveryFee' => $this->delivery_fee,
            'total' => $this->total,
            'paymentMethod' => $this->payment_method,
            'status' => $this->status,
            'createdAt' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
