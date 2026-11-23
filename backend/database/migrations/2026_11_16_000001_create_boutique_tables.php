<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tables de la boutique : paramètres, catégories, collections, produits,
 * commandes, newsletter, messages de contact.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->longText('value');
        });

        Schema::create('categories', function (Blueprint $t) {
            $t->string('slug')->primary();
            $t->string('name');
            $t->string('image', 1000)->default('');
            $t->unsignedInteger('position')->default(0);
        });

        Schema::create('collections', function (Blueprint $t) {
            $t->string('slug')->primary();
            $t->string('name');
            $t->string('subtitle')->default('');
            $t->text('description');
            $t->string('image', 1000)->default('');
            $t->unsignedInteger('position')->default(0);
        });

        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->string('name');
            $t->string('category')->index();
            $t->string('collection')->nullable()->index();
            $t->text('description');
            $t->json('details');
            $t->unsignedInteger('price');
            $t->unsignedInteger('compare_at_price')->nullable();
            $t->json('images');
            $t->json('sizes');
            $t->json('colors');
            $t->unsignedInteger('stock')->default(0);
            $t->boolean('is_new')->default(false);
            $t->boolean('is_best_seller')->default(false);
            $t->unsignedInteger('popularity')->default(0);
            $t->timestamps();
        });

        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('reference')->unique();
            $t->string('customer_name');
            $t->string('customer_phone');
            $t->string('customer_email')->nullable();
            $t->string('address', 300);
            $t->string('zone');
            $t->string('notes', 500)->nullable();
            $t->json('items');
            $t->unsignedInteger('subtotal');
            $t->unsignedInteger('delivery_fee');
            $t->unsignedInteger('total');
            $t->string('payment_method');
            $t->string('status')->default('nouvelle')->index();
            $t->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $t) {
            $t->string('email')->primary();
            $t->timestamp('created_at')->useCurrent();
        });

        Schema::create('contact_messages', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('phone')->nullable();
            $t->string('email')->nullable();
            $t->string('subject')->default('');
            $t->text('message');
            $t->boolean('is_read')->default(false);
            $t->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        foreach (['contact_messages', 'newsletter_subscribers', 'orders', 'products', 'collections', 'categories', 'settings'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
