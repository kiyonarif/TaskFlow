
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_tags', function (Blueprint $table) {
            // タスク
            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            // タグ
            $table->foreignId('tag_id')
                ->constrained('tags')
                ->cascadeOnDelete();

            // 同じ組み合わせの重複を防止
            $table->primary(['task_id', 'tag_id']);

            $table->index('tag_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_tags');
    }
};
