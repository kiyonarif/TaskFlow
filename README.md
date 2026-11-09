# TaskFlow

React・TypeScript・Laravelを使用して開発したタスク管理Webアプリケーションです。

個人およびチームでのタスク管理を想定し、タスク・カテゴリ管理、認証、ワークスペース単位のデータ管理を実装しています。

## 1. 開発目的

Webアプリケーションの設計・開発・テストを一貫して経験し、フロントエンドとバックエンド双方の技術力を向上させることを目的とした個人開発プロジェクトです。

## 2. 主な機能

### 認証
- ユーザー登録
- ログイン・ログアウト
- 認証状態の管理

### タスク管理
- タスク一覧表示
- タスクの新規作成・編集・削除
- ステータス管理
- 優先度管理
- 期限管理
- カテゴリ設定
- キーワード検索
- 論理削除

### カテゴリ管理
- カテゴリの新規作成・編集・削除
- カテゴリ一覧表示
- ワークスペース単位の管理

### データ管理・アクセス制御
- ワークスペース単位のデータ管理
- 他ワークスペースのデータへの不正アクセス防止
- メンバー・ロールを考慮したデータ構造

※開発途中の機能は、実装・動作確認後に順次更新します。

## 3. 使用技術

| 分類 | 技術 |
|---|---|
| フロントエンド | React / TypeScript |
| ビルドツール | Vite |
| CSS | Tailwind CSS |
| アイコン | Lucide React |
| HTTP通信 | Axios |
| バックエンド | PHP / Laravel 12 |
| API認証 | Laravel Sanctum |
| データベース | MySQL 8.4 |
| テスト用DB | SQLite（インメモリ） |
| テスト | PHPUnit |
| コンテナ | Docker / Docker Compose |
| Webサーバー | Nginx |

## 4. システム構成

```text
Browser
  |
  v
React + TypeScript
  |
  | HTTP / REST API
  v
Nginx
  |
  v
Laravel 12
  |
  v
MySQL 8.4
```

## 5. ディレクトリ構成

```text
TaskFlow/
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── tests/
├── frontend/
│   ├── src/
│   └── public/
├── docker/
├── docs/
│   └── TESTING.md
├── docker-compose.yml
└── README.md
```

## 6. 開発環境

### 前提条件
- Docker Desktop
- Node.js
- npm

### バックエンド・DBの起動

```bash
docker compose up -d --build
```

### フロントエンドの起動

別のターミナルで実行します。

```bash
cd frontend
npm install
npm run dev
```

### アクセス先

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:5173 |
| バックエンド | http://localhost:8000 |

※初回起動時には環境変数の設定とデータベースのマイグレーションが必要です。

## 7. テスト

以下のコマンドでバックエンドのテストを実行できます。

```bash
docker compose exec app php artisan test
```

### テスト実績（2026年11月9日時点）

| テスト対象 | 結果 |
|---|---:|
| Unit ExampleTest | 1件 PASS |
| Feature CategoryApiTest | 5件 PASS |
| Feature ExampleTest | 1件 PASS |
| Feature TaskApiTest | 5件 PASS |
| **合計** | **12件 PASS** |

- 成功：12件
- 失敗：0件
- アサーション：54件

詳細は [テスト仕様書](docs/TESTING.md) を参照してください。

## 8. 今後の開発予定

- チームメンバー管理機能の拡充
- 招待機能の実装・検証
- コメント機能
- アクティビティログ
- カンバン表示
- カレンダー表示
- フロントエンドのテスト拡充
- セキュリティ対策の強化
- 無料サービスを利用したWeb公開

## 9. 開発について

本アプリケーションは個人開発プロジェクトです。

要件整理、設計、実装、テスト、環境構築を通じて、Webアプリケーション開発に必要な技術の習得と実践に取り組んでいます。
