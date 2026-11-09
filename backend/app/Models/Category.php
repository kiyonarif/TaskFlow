<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'color',
    ];

    /**
     * 所属ワークスペース
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * このカテゴリーに属するタスク
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
