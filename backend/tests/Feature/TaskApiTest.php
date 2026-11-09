<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithWorkspace(): array
    {
        $user = User::factory()->create();

        $workspace = Workspace::create([
            'name' => 'Test Workspace',
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

    public function test_guest_cannot_access_tasks(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }

    public function test_user_can_create_list_update_and_soft_delete_task(): void
    {
        [$user, $workspace] = $this->createUserWithWorkspace();

        $this->actingAs($user, 'sanctum');

        $category = Category::create([
            'workspace_id' => $workspace->id,
            'name' => 'Test Category',
            'color' => '#3B82F6',
        ]);

        $response = $this->postJson('/api/tasks', [
            'title' => 'API Test Task',
            'description' => 'Test description',
            'status' => 'todo',
            'priority' => 'high',
            'due_date' => '2026-12-31',
            'category_id' => $category->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('task.title', 'API Test Task')
            ->assertJsonPath('task.status', 'todo')
            ->assertJsonPath('task.priority', 'high')
            ->assertJsonPath('task.category.id', $category->id);

        $taskId = $response->json('task.id');

        $this->assertDatabaseHas('tasks', [
            'id' => $taskId,
            'workspace_id' => $workspace->id,
            'title' => 'API Test Task',
        ]);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $taskId,
                'title' => 'API Test Task',
            ]);

        $this->putJson("/api/tasks/{$taskId}", [
            'title' => 'Updated Task',
            'priority' => 'medium',
        ])
            ->assertOk()
            ->assertJsonPath('task.title', 'Updated Task')
            ->assertJsonPath('task.priority', 'medium');

        $this->deleteJson("/api/tasks/{$taskId}")
            ->assertOk();

        $this->assertSoftDeleted('tasks', [
            'id' => $taskId,
        ]);
    }

    public function test_task_validation_rejects_invalid_input(): void
    {
        [$user] = $this->createUserWithWorkspace();

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/tasks', [
            'title' => '',
            'status' => 'invalid',
            'priority' => 'urgent',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors([
              'title',
              'status',
              'priority',
          ]);
    }

    public function test_user_cannot_access_another_workspaces_task(): void
    {
        [$user] = $this->createUserWithWorkspace();
        [, $otherWorkspace] = $this->createUserWithWorkspace();

        $task = Task::create([
            'workspace_id' => $otherWorkspace->id,
            'created_by' => $otherWorkspace->owner_id,
            'title' => 'Private Task',
            'status' => 'todo',
            'priority' => 'medium',
            'position' => 0,
        ]);

        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Changed Task',
        ])->assertNotFound();

        $this->deleteJson("/api/tasks/{$task->id}")
            ->assertNotFound();
    }

    public function test_task_cannot_use_category_from_another_workspace(): void
    {
        [$user, $workspace] = $this->createUserWithWorkspace();
        [, $otherWorkspace] = $this->createUserWithWorkspace();

        $category = Category::create([
            'workspace_id' => $otherWorkspace->id,
            'name' => 'Other Category',
            'color' => '#EF4444',
        ]);

        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/tasks', [
            'title' => 'Invalid Category Task',
            'category_id' => $category->id,
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['category_id']);
    }
}
