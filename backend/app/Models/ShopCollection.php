<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Collection de la boutique (ex : « Soirées & Cérémonies »). */
class ShopCollection extends Model
{
    protected $table = 'collections';
    protected $primaryKey = 'slug';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];
}
