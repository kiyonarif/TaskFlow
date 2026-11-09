
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();

            // ワークスペース名
            $table->string('name', 100);

            // ワークスペースの所有者
            $table->foreignId('owner_id')
                ->constrained('users')
                ->restrictOnDelete();

            // personal: 個人用 / team: チーム用
            $table->string('type', 20)->default('personal');

            $table->timestamps();

            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspaces');
    }
};
