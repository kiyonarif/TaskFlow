
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_members', function (Blueprint $table) {
            $table->id();

            // 所属するワークスペース
            $table->foreignId('workspace_id')
                ->constrained('workspaces')
                ->cascadeOnDelete();

            // 所属するユーザー
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // owner: 所有者 / admin: 管理者 / member: 一般メンバー
            $table->string('role', 20)->default('member');

            // ワークスペースへの参加日時
            $table->timestamp('joined_at')->useCurrent();

            $table->timestamps();

            // 同じユーザーの重複所属を防止
            $table->unique(
                ['workspace_id', 'user_id'],
                'workspace_members_workspace_user_unique'
            );

            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_members');
    }
};
