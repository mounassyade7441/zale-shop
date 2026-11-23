<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Paramètres clé → valeur (JSON) : réglages de la boutique, mot de passe admin… */
class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $row = static::find($key);

        return $row ? json_decode($row->value, true) : $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }

    /** Réglages de la boutique = valeurs par défaut (config/boutique.php) + celles enregistrées dans l'admin. */
    public static function shop(): array
    {
        return self::deepMerge(config('boutique.defaults'), static::getValue('shop', []) ?? []);
    }

    private static function deepMerge(array $base, array $extra): array
    {
        foreach ($extra as $k => $v) {
            $isAssoc = fn ($a) => is_array($a) && $a !== [] && array_keys($a) !== range(0, count($a) - 1);
            if ($isAssoc($v) && isset($base[$k]) && $isAssoc($base[$k])) {
                $base[$k] = self::deepMerge($base[$k], $v);
            } else {
                $base[$k] = $v;
            }
        }

        return $base;
    }
}
