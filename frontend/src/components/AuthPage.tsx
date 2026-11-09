
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Layers3, LoaderCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './AuthPage.css'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const { login, register } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password, passwordConfirmation)
      }
    } catch (err: unknown) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string
              errors?: Record<string, string[]>
            }
          }
        }
      ).response?.data

      const validationMessage = response?.errors
        ? Object.values(response.errors).flat()[0]
        : undefined

      setError(
        validationMessage ||
        response?.message ||
        '通信に失敗しました。時間をおいて再度お試しください。',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="auth-brand-logo">
          <Layers3 size={26} />
        </div>

        <span className="auth-brand-name">TaskFlow</span>
        <span className="auth-brand-caption">WORK SMARTER, TOGETHER.</span>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">YOUR WORKSPACE, REIMAGINED</span>
          <h1>
            仕事の流れを、
            <br />
            もっとシンプルに。
          </h1>
          <p>
            タスクもチームも、ひとつの場所で。
            <br />
            毎日の仕事をスムーズに進めましょう。
          </p>

          <div className="auth-feature">
            <CheckCircle2 size={18} />
            <span>タスクを一元管理</span>
          </div>
          <div className="auth-feature">
            <CheckCircle2 size={18} />
            <span>チームの進捗を可視化</span>
          </div>
          <div className="auth-feature">
            <CheckCircle2 size={18} />
            <span>いつでもどこでもアクセス</span>
          </div>
        </div>

        <span className="auth-copyright">
          © 2026 TaskFlow. All rights reserved.
        </span>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <Layers3 size={23} />
            <span>TaskFlow</span>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">
              {mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
            </span>
            <h2>
              {mode === 'login' ? 'おかえりなさい' : 'アカウントを作成'}
            </h2>
            <p>
              {mode === 'login'
                ? 'アカウント情報を入力してログインしてください。'
                : '必要な情報を入力して登録してください。'}
            </p>
          </div>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              ログイン
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              新規登録
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                <span>名前</span>
                <input
                  type="text"
                  placeholder="山田 太郎"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              <span>メールアドレス</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>パスワード</span>
              <input
                type="password"
                placeholder="8文字以上"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                minLength={8}
                required
              />
            </label>

            {mode === 'register' && (
              <label>
                <span>パスワード（確認）</span>
                <input
                  type="password"
                  placeholder="もう一度入力してください"
                  value={passwordConfirmation}
                  onChange={(event) =>
                    setPasswordConfirmation(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="auth-spinner" size={18} />
                  処理中...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'ログインする' : 'アカウントを作成'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            {mode === 'login'
              ? 'アカウントをお持ちでない方は'
              : 'すでにアカウントをお持ちの方は'}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? '新規登録' : 'ログイン'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
