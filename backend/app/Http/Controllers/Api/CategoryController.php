<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function workspaceId(Request $request): int
    {
        $id = DB::table('workspace_members')
            ->where('user_id', $request->user()->id)
            ->orderBy('joined_at')
            ->value('workspace_id');

        abort_if($id === null, 404, 'ワークスペースが見つかりません。');

        return (int) $id;
    }

    public function index(Request $request): JsonResponse
    {
        $categories = Category::where(
            'workspace_id',
            $this->workspaceId($request)
        )->orderBy('name')->get();

        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')
                    ->where('workspace_id', $workspaceId),
            ],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $category = Category::create([
            ...$validated,
            'workspace_id' => $workspaceId,
        ]);

        return response()->json([
            'message' => 'カテゴリを作成しました。',
            'category' => $category,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $category = Category::where('workspace_id', $workspaceId)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')
                    ->where('workspace_id', $workspaceId)
                    ->ignore($category->id),
            ],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'カテゴリを更新しました。',
            'category' => $category->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $workspaceId = $this->workspaceId($request);

        $category = Category::where('workspace_id', $workspaceId)
            ->findOrFail($id);

        $category->delete();

        return response()->json([
            'message' => 'カテゴリを削除しました。',
        ]);
    }
}
