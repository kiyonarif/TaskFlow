<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithWorkspace(): array
    {
        $user = User::create([
            'name' => 'カテゴリテストユーザー',
            'email' => uniqid('category-test-') . '@example.com',
            'password' => 'password123',
        ]);

        $workspace = Workspace::create([
            'name' => 'カテゴリテスト用ワークスペース',
            'owner_id' => $user->id,
            'type' => 'personal',
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        return [$user, $workspace];
    }

    public function test_guest_cannot_access_categories(): void
    {
        $this->getJson('/api/categories')
            ->assertUnauthorized();
    }

    public function test_user_can_create_list_update_and_delete_category(): void
    {
        [$user, $workspace] = $this->createUserWithWorkspace();

        $this->actingAs($user, 'sanctum');

        // 作成
        $createResponse = $this->postJson('/api/categories', [
            'name' => '開発',
            'color' => '#2563eb',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('category.name', '開発')
            ->assertJsonPath('category.color', '#2563eb');

        $categoryId = $createResponse->json('category.id');

        $this->assertDatabaseHas('categories', [
            'id' => $categoryId,
            'workspace_id' => $workspace->id,
            'name' => '開発',
        ]);

        // 一覧
        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $categoryId,
                'name' => '開発',
            ]);

        // 更新
        $this->putJson("/api/categories/{$categoryId}", [
            'name' => '設計',
            'color' => '#16a34a',
        ])
            ->assertOk()
            ->assertJsonPath('category.name', '設計')
            ->assertJsonPath('category.color', '#16a34a');

        // カテゴリに紐づくタスクを作成
        $task = Task::create([
            'workspace_id' => $workspace->id,
            'category_id' => $categoryId,
            'created_by' => $user->id,
            'title' => 'カテゴリ削除確認用',
            'status' => 'todo',
            'priority' => 'medium',
            'position' => 1,
        ]);

        // 削除
        $this->deleteJson("/api/categories/{$categoryId}")
            ->assertOk();

        $this->assertDatabaseMissing('categories', [
            'id' => $categoryId,
        ]);

        // 外部キーのnullOnDeleteによりカテゴリIDが解除される
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'category_id' => null,
        ]);
    }

    public function test_category_creation_rejects_invalid_input(): void
    {
        [$user] = $this->createUserWithWorkspace();

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/categories', [
            'name' => '',
            'color' => 'red',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'color',
            ]);
    }

    public function test_category_name_must_be_unique_in_workspace(): void
    {
        [$user] = $this->createUserWithWorkspace();

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/categories', [
            'name' => '重複カテゴリ',
            'color' => '#2563eb',
        ])->assertCreated();

        $this->postJson('/api/categories', [
            'name' => '重複カテゴリ',
            'color' => '#16a34a',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_cannot_access_another_workspaces_category(): void
    {
        [$user] = $this->createUserWithWorkspace();

        $otherUser = User::create([
            'name' => '別ユーザー',
            'email' => uniqid('other-category-') . '@example.com',
            'password' => 'password123',
        ]);

        $otherWorkspace = Workspace::create([
            'name' => '別ワークスペース',
            'owner_id' => $otherUser->id,
            'type' => 'personal',
        ]);

        $otherCategory = Category::create([
            'workspace_id' => $otherWorkspace->id,
            'name' => '他人のカテゴリ',
            'color' => '#ff0000',
        ]);

        $this->actingAs($user, 'sanctum');

        // 一覧に他ワークスペースのカテゴリが含まれない
        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonMissing([
                'name' => '他人のカテゴリ',
            ]);

        // 更新・削除できない
        $this->putJson("/api/categories/{$otherCategory->id}", [
            'name' => '不正な変更',
            'color' => '#000000',
        ])->assertNotFound();

        $this->deleteJson("/api/categories/{$otherCategory->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('categories', [
            'id' => $otherCategory->id,
            'name' => '他人のカテゴリ',
        ]);
    }
}
