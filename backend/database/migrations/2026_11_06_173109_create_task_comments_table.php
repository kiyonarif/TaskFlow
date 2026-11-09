
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();

            // コメント対象のタスク
            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            // コメント投稿者
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // コメント本文
            $table->text('body');

            // 論理削除
            $table->softDeletes();

            $table->timestamps();

            $table->index(['task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_comments');
    }
};
