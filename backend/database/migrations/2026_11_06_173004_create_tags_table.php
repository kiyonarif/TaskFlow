
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();

            // 所属ワークスペース
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();

            // タグ名
            $table->string('name', 50);

            // タグ表示色
            $table->string('color', 7)->default('#64748b');

            $table->timestamps();

            // 同一ワークスペース内のタグ名重複を防止
            $table->unique(
                ['workspace_id', 'name'],
                'tags_workspace_name_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
