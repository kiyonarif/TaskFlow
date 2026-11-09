
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            // 所属ワークスペース
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();

            // カテゴリ名
            $table->string('name', 100);

            // カテゴリ表示色（HEX形式）
            $table->string('color', 7)->default('#64748b');

            $table->timestamps();

            // 同じワークスペース内でカテゴリ名を重複させない
            $table->unique(
                ['workspace_id', 'name'],
                'categories_workspace_name_unique'
            );

            $table->index('workspace_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
