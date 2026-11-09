<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * ユーザー新規登録
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '入力内容に誤りがあります。',
                'errors' => $validator->errors(),
            ], 422);
        }

        // ユーザー・ワークスペース・メンバー登録を一括管理
        $result = DB::transaction(function () use ($request) {

            // 1. ユーザー作成
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
            ]);

            // 2. 個人用ワークスペース作成
            $workspace = Workspace::create([
                'name' => $user->name . 'のワークスペース',
                'owner_id' => $user->id,
                'type' => 'personal',
            ]);

            // 3. ユーザーをオーナーとして登録
            WorkspaceMember::create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            return [
                'user' => $user,
                'workspace' => $workspace,
            ];
        });

        // 登録完了後にログイン
        Auth::guard('web')->login($result['user']);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'ユーザー登録が完了しました。',
            'user' => $result['user'],
            'workspace' => $result['workspace'],
        ], 201);
    }

    /**
     * ログイン
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => '入力内容に誤りがあります。',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (! Auth::guard('web')->attempt($credentials)) {
            return response()->json([
                'message' => 'メールアドレスまたはパスワードが正しくありません。',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'ログインしました。',
            'user' => $request->user(),
        ]);
    }

    /**
     * ログアウト
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'ログアウトしました。',
        ]);
    }

    /**
     * ログイン中のユーザー情報取得
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
