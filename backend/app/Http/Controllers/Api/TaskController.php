<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * ログインユーザーが所属するワークスペースIDを取得する。
     */
    private function workspaceId(Request $request): int
    {
        $workspaceId = DB::table('workspace_members')
            ->where('user_id', $request->user()->id)
            ->orderBy('joined_at')
            ->value('workspace_id');

        abort_if($workspaceId === null, 404, 'ワークスペースが見つかりません。');

        return (int) $workspaceId;
    }

    /**
     * タスク一覧
     */
    public function index(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $tasks = Task::with('category')
            ->where('workspace_id', $workspaceId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['tasks' => $tasks]);
    }

    /**
     * タスク作成
     */
    public function store(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'done'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')
                    ->where('workspace_id', $workspaceId),
            ],
            'assigned_to' => [
                'nullable',
                Rule::exists('workspace_members', 'user_id')
                    ->where('workspace_id', $workspaceId),
            ],
        ]);

        $status = $validated['status'] ?? 'todo';

        $task = Task::create([
            ...$validated,
            'workspace_id' => $workspaceId,
            'created_by' => $request->user()->id,
            'completed_at' => $status === 'done' ? now() : null,
            'position' => (int) Task::where('workspace_id', $workspaceId)->max('position') + 1,
        ]);

        return response()->json([
            'message' => 'タスクを作成しました。',
            'task' => $task->load('category'),
        ], 201);
    }

    /**
     * タスク更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $task = Task::where('workspace_id', $workspaceId)
            ->findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'done'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'due_date' => ['nullable', 'date'],
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')
                    ->where('workspace_id', $workspaceId),
            ],
            'assigned_to' => [
                'nullable',
                Rule::exists('workspace_members', 'user_id')
                    ->where('workspace_id', $workspaceId),
            ],
        ]);

        if (array_key_exists('status', $validated)) {
            $validated['completed_at'] =
                $validated['status'] === 'done' ? now() : null;
        }

        $task->update($validated);

        return response()->json([
            'message' => 'タスクを更新しました。',
            'task' => $task->fresh()->load('category'),
        ]);
    }

    /**
     * タスク削除（論理削除）
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $task = Task::where('workspace_id', $workspaceId)
            ->findOrFail($id);

        $task->delete();

        return response()->json([
            'message' => 'タスクを削除しました。',
        ]);
    }
}
