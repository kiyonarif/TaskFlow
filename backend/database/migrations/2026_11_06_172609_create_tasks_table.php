
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            // 所属ワークスペース
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();

            // カテゴリ（未設定可）
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            // タスク作成者
            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            // 担当者（未設定可）
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // タスク名・詳細
            $table->string('title', 255);
            $table->text('description')->nullable();

            // todo / in_progress / done
            $table->string('status', 20)->default('todo');

            // low / medium / high
            $table->string('priority', 20)->default('medium');

            // 期限・完了日時
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();

            // カンバン表示順
            $table->unsignedInteger('position')->default(0);

            // 論理削除
            $table->softDeletes();

            $table->timestamps();

            // 検索・一覧表示用インデックス
            $table->index(
                ['workspace_id', 'status', 'due_date'],
                'tasks_workspace_status_due_index'
            );

            $table->index(
                ['workspace_id', 'priority'],
                'tasks_workspace_priority_index'
            );

            $table->index('created_by');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
