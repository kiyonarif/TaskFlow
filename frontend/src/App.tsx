import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Users, Settings,
  Search, Bell, Plus, ChevronDown, MoreHorizontal, Clock3,
  CircleCheck, Circle, ListFilter, ArrowUpRight, Menu, X,
  Trash2, Sparkles, Flag, Pencil, Tag,
} from 'lucide-react'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import api from './lib/api'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type Priority = 'high' | 'medium' | 'low'

type Category = {
  id: number
  name: string
  color: string
}

type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  category: string
  categoryId: number | null
  categoryColor: string
}

type ApiTask = {
  id: number
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: Priority
  due_date: string | null
  category_id: number | null
  category: Category | null
}

const statusLabels: Record<TaskStatus, string> = {
  todo: '未着手',
  'in-progress': '進行中',
  done: '完了',
}

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function toTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? '',
    status: task.status === 'in_progress' ? 'in-progress' : task.status,
    priority: task.priority,
    dueDate: task.due_date ? task.due_date.slice(0, 10) : '',
    category: task.category?.name ?? '未分類',
    categoryId: task.category_id ?? task.category?.id ?? null,
    categoryColor: task.category?.color ?? '#94a3b8',
  }
}

function formatDate(date: string) {
  if (!date) return '期限なし'

  const value = new Date(`${date}T00:00:00`)
  if (Number.isNaN(value.getTime())) return '期限なし'

  return `${value.getMonth() + 1}月${value.getDate()}日`
}

function Dashboard() {
  const { user, logout } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [taskError, setTaskError] = useState('')

  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo')
  const [newDueDate, setNewDueDate] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<number | ''>('')

  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#64748b')
  const [categorySaving, setCategorySaving] = useState(false)

  async function fetchTasks() {
    const response = await api.get<{ tasks: ApiTask[] }>('/api/tasks')
    setTasks(response.data.tasks.map(toTask))
  }

  async function fetchCategories() {
    const response = await api.get<{ categories: Category[] }>('/api/categories')
    setCategories(response.data.categories)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTasks(), fetchCategories()])
        setTaskError('')
      } catch (error) {
        console.error('データ取得エラー:', error)
        setTaskError('データを取得できませんでした。ページを再読み込みしてください。')
      } finally {
        setTasksLoading(false)
      }
    }

    void loadData()
  }, [])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'done').length
    const inProgress = tasks.filter((task) => task.status === 'in-progress').length
    const todo = tasks.filter((task) => task.status === 'todo').length
    const total = tasks.length
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

    return { completed, inProgress, todo, total, percentage }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const normalize = (value: string | undefined) =>
      (value ?? '').normalize('NFKC').trim().toLocaleLowerCase()

    const keyword = normalize(search)

    return tasks.filter((task) => {
      const matchesStatus = activeFilter === 'all' || task.status === activeFilter
      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter
      const matchesCategory =
        categoryFilter === 'all' || task.categoryId === categoryFilter

      const searchableValues = [
        task.title,
        task.description,
        task.category,
        statusLabels[task.status],
        task.status,
        priorityLabels[task.priority],
        task.priority,
        task.dueDate,
        formatDate(task.dueDate),
      ]

      const matchesSearch =
        !keyword || searchableValues.some((value) => normalize(value).includes(keyword))

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch
    })
  }, [tasks, activeFilter, priorityFilter, categoryFilter, search])

  function openCreateTask() {
    setEditingTaskId(null)
    setNewTitle('')
    setNewDescription('')
    setNewPriority('medium')
    setNewStatus('todo')
    setNewDueDate('')
    setNewCategoryId('')
    setIsModalOpen(true)
  }

  function openEditTask(task: Task) {
    setEditingTaskId(task.id)
    setNewTitle(task.title)
    setNewDescription(task.description)
    setNewPriority(task.priority)
    setNewStatus(task.status)
    setNewDueDate(task.dueDate)
    setNewCategoryId(task.categoryId ?? '')
    setIsModalOpen(true)
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newTitle.trim()) return

    const payload = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: newStatus === 'in-progress' ? 'in_progress' : newStatus,
      priority: newPriority,
      due_date: newDueDate || null,
      category_id: newCategoryId === '' ? null : newCategoryId,
    }

    try {
      setTaskError('')

      if (editingTaskId === null) {
        const response = await api.post<{ task: ApiTask }>('/api/tasks', payload)
        setTasks((current) => [toTask(response.data.task), ...current])
      } else {
        const response = await api.patch<{ task: ApiTask }>(
          `/api/tasks/${editingTaskId}`,
          payload,
        )
        const updatedTask = toTask(response.data.task)
        setTasks((current) =>
          current.map((task) => task.id === editingTaskId ? updatedTask : task),
        )
      }

      setIsModalOpen(false)
      setEditingTaskId(null)
      setActiveFilter('all')
      setSearch('')
    } catch (error) {
      console.error('タスク保存エラー:', error)
      setTaskError('タスクの保存に失敗しました。入力内容やログイン状態を確認してください。')
    }
  }

  async function changeTaskStatus(id: number, status: TaskStatus) {
    const apiStatus = status === 'in-progress' ? 'in_progress' : status

    try {
      setTaskError('')
      const response = await api.patch<{ task: ApiTask }>(`/api/tasks/${id}`, {
        status: apiStatus,
      })
      const updatedTask = toTask(response.data.task)

      setTasks((current) =>
        current.map((task) => task.id === id ? updatedTask : task),
      )
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      setTaskError('ステータスの変更に失敗しました。')
    }
  }

  async function toggleTask(id: number) {
    const currentTask = tasks.find((task) => task.id === id)
    if (!currentTask) return

    await changeTaskStatus(id, currentTask.status === 'done' ? 'todo' : 'done')
  }

  async function deleteTask(id: number) {
    if (!window.confirm('このタスクを削除しますか？')) return

    try {
      setTaskError('')
      await api.delete(`/api/tasks/${id}`)
      setTasks((current) => current.filter((task) => task.id !== id))
    } catch (error) {
      console.error('タスク削除エラー:', error)
      setTaskError('タスクの削除に失敗しました。')
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!categoryName.trim()) return

    try {
      setCategorySaving(true)
      setTaskError('')

      const response = await api.post<{ category: Category }>('/api/categories', {
        name: categoryName.trim(),
        color: categoryColor,
      })

      setCategories((current) =>
        [...current, response.data.category].sort((a, b) =>
          a.name.localeCompare(b.name, 'ja'),
        ),
      )
      setCategoryName('')
      setCategoryColor('#64748b')
    } catch (error) {
      console.error('カテゴリ作成エラー:', error)
      setTaskError('カテゴリの作成に失敗しました。同じ名前が登録済みでないか確認してください。')
    } finally {
      setCategorySaving(false)
    }
  }

  async function editCategory(category: Category) {
    const name = window.prompt('新しいカテゴリ名を入力してください。', category.name)
    if (name === null || !name.trim() || name.trim() === category.name) return

    try {
      setTaskError('')
      const response = await api.patch<{ category: Category }>(
        `/api/categories/${category.id}`,
        { name: name.trim(), color: category.color },
      )

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? response.data.category : item,
        ),
      )
      await fetchTasks()
    } catch (error) {
      console.error('カテゴリ更新エラー:', error)
      setTaskError('カテゴリの更新に失敗しました。同じ名前が登録済みでないか確認してください。')
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `「${category.name}」を削除しますか？\nこのカテゴリが設定されたタスクは「未分類」になります。`,
    )
    if (!confirmed) return

    try {
      setTaskError('')
      await api.delete(`/api/categories/${category.id}`)
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      )
      setTasks((current) =>
        current.map((task) =>
          task.categoryId === category.id
            ? { ...task, category: '未分類', categoryId: null, categoryColor: '#94a3b8' }
            : task,
        ),
      )
      if (categoryFilter === category.id) setCategoryFilter('all')
    } catch (error) {
      console.error('カテゴリ削除エラー:', error)
      setTaskError('カテゴリの削除に失敗しました。')
    }
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="メニューを閉じる"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><CheckSquare size={21} strokeWidth={2.5} /></div>
          <span>TaskFlow</span>
          <button className="mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">TF</div>
          <div className="workspace-info">
            <strong>マイワークスペース</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={16} className="muted-icon" />
        </div>

        <div className="nav-section">
          <p className="nav-heading">MENU</p>
          <button className="nav-item active">
            <LayoutDashboard size={18} /><span>ダッシュボード</span>
          </button>
          <button className="nav-item" onClick={() => setActiveFilter('all')}>
            <CheckSquare size={18} /><span>すべてのタスク</span>
            <span className="nav-count">{stats.total}</span>
          </button>
          <button className="nav-item" onClick={() => setActiveFilter('todo')}>
            <CalendarDays size={18} /><span>未着手のタスク</span>
          </button>
        </div>

        <div className="nav-section">
          <p className="nav-heading">WORKSPACE</p>
          <button className="nav-item">
            <Users size={18} /><span>メンバー</span>
          </button>
          <button className="nav-item">
            <Settings size={18} /><span>設定</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={17} /></div>
            <strong>毎日の仕事を、もっとスムーズに。</strong>
            <p>TaskFlowでタスクと進捗を一元管理しましょう。</p>
          </div>
          <div className="profile">
            <div className="profile-avatar">{user?.name?.charAt(0) ?? 'U'}</div>
            <div className="profile-info">
              <strong>{user?.name ?? 'TaskFlow User'}</strong>
              <span>Personal account</span>
            </div>
            <button
              className="task-more"
              onClick={() => void logout()}
              title="ログアウト"
              aria-label="ログアウト"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="メニューを開く">
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>マイワークスペース</span>
            <span className="breadcrumb-divider">/</span>
            <strong>ダッシュボード</strong>
          </div>
          <div className="topbar-actions">
            <div className="topbar-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="タスクを検索..."
                aria-label="タスクを検索"
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button notification-button" aria-label="通知">
              <Bell size={19} /><span className="notification-dot" />
            </button>
            <button
              type="button"
              className="topbar-avatar"
              onClick={() => void logout()}
              title="ログアウト"
              aria-label="ログアウト"
            >
              {user?.name?.charAt(0) ?? 'U'}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow"><Sparkles size={14} />YOUR WORKSPACE</div>
              <h1>おかえりなさい！</h1>
              <p>今日も一つずつ、タスクを進めていきましょう。</p>
            </div>
            <button className="primary-button" onClick={openCreateTask}>
              <Plus size={18} />新しいタスク
            </button>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>すべてのタスク</span>
                <div className="stat-icon purple"><CheckSquare size={19} /></div>
              </div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-foot">
                <span className="stat-caption">登録されているタスク</span>
                <span className="stat-trend"><ArrowUpRight size={14} />TOTAL</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>完了したタスク</span>
                <div className="stat-icon green"><CircleCheck size={19} /></div>
              </div>
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-foot">
                <span className="stat-caption">完了済み</span>
                <span className="stat-trend green-text">{stats.percentage}% 完了</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>進行中</span>
                <div className="stat-icon blue"><Clock3 size={19} /></div>
              </div>
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-foot">
                <span className="stat-caption">現在取り組んでいるタスク</span>
                <span className="stat-trend blue-text">IN PROGRESS</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>未着手</span>
                <div className="stat-icon orange"><Circle size={19} /></div>
              </div>
              <div className="stat-value">{stats.todo}</div>
              <div className="stat-foot">
                <span className="stat-caption">これから取り組むタスク</span>
                <span className="stat-trend orange-text">TO DO</span>
              </div>
            </div>
          </section>

          <section className="overview-grid">
            <div className="panel progress-panel">
              <div className="panel-heading">
                <div><h2>タスクの進捗</h2><p>ワークスペース全体の進捗状況</p></div>
                <button className="subtle-icon-button" aria-label="進捗メニュー"><MoreHorizontal size={20} /></button>
              </div>
              <div className="progress-summary">
                <div>
                  <span className="progress-number">{stats.percentage}%</span>
                  <span className="progress-label">完了</span>
                </div>
                <span className="progress-count">{stats.completed} / {stats.total} タスク</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${stats.percentage}%` }} />
              </div>
              <div className="progress-legend">
                <span><i className="legend-dot done-dot" />完了 {stats.completed}</span>
                <span><i className="legend-dot working-dot" />進行中 {stats.inProgress}</span>
                <span><i className="legend-dot todo-dot" />未着手 {stats.todo}</span>
              </div>
            </div>

            <div className="panel quick-panel">
              <div className="panel-heading">
                <div><h2>クイックアクション</h2><p>よく使う操作</p></div>
                <div className="quick-sparkle"><Sparkles size={18} /></div>
              </div>
              <button className="quick-action" onClick={openCreateTask}>
                <span className="quick-action-icon purple"><Plus size={18} /></span>
                <span><strong>タスクを追加</strong><small>新しいタスクを作成する</small></span>
                <ArrowUpRight size={17} className="quick-arrow" />
              </button>
              <button className="quick-action" onClick={() => setActiveFilter('in-progress')}>
                <span className="quick-action-icon blue"><Clock3 size={18} /></span>
                <span><strong>進行中のタスク</strong><small>作業中のタスクを確認する</small></span>
                <ArrowUpRight size={17} className="quick-arrow" />
              </button>
            </div>
          </section>

          {taskError && (
            <div role="alert" style={{
              marginBottom: 16, padding: '12px 16px', borderRadius: 10,
              background: '#fff1f2', color: '#be123c', fontSize: 13,
            }}>
              {taskError}
            </div>
          )}

          <section className="panel tasks-panel">
            <div className="tasks-heading">
              <div><h2>タスク一覧</h2><p>タスクの確認と管理ができます</p></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="filter-button"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
                  aria-label="優先度で絞り込み"
                >
                  <option value="all">すべての優先度</option>
                  <option value="high">優先度：高</option>
                  <option value="medium">優先度：中</option>
                  <option value="low">優先度：低</option>
                </select>
                <select
                  className="filter-button"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
                  }
                  aria-label="カテゴリで絞り込み"
                >
                  <option value="all">すべてのカテゴリ</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button className="filter-button" onClick={() => {
                  setPriorityFilter('all')
                  setCategoryFilter('all')
                  setActiveFilter('all')
                  setSearch('')
                }}>
                  <ListFilter size={16} />条件クリア
                </button>
              </div>
            </div>

            <div className="task-tabs">
              {([
                ['all', 'すべて'],
                ['todo', '未着手'],
                ['in-progress', '進行中'],
                ['done', '完了'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  className={`task-tab ${activeFilter === value ? 'selected' : ''}`}
                  onClick={() => setActiveFilter(value)}
                >
                  {label}
                  {value === 'all' && <span>{stats.total}</span>}
                  {value === 'todo' && <span>{stats.todo}</span>}
                  {value === 'in-progress' && <span>{stats.inProgress}</span>}
                  {value === 'done' && <span>{stats.completed}</span>}
                </button>
              ))}
            </div>

            <div className="task-list">
              {tasksLoading ? (
                <div className="empty-state"><span>データを読み込んでいます...</span></div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <CheckSquare size={30} />
                  <strong>タスクが見つかりません</strong>
                  <span>検索条件を変更するか、新しいタスクを追加してください。</span>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div className="task-row" key={task.id}>
                    <button
                      className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => void toggleTask(task.id)}
                      aria-label={task.status === 'done' ? '未完了に戻す' : '完了にする'}
                    >
                      {task.status === 'done' && <CircleCheck size={19} />}
                    </button>

                    <div className="task-main">
                      <strong className={task.status === 'done' ? 'task-done' : ''}>{task.title}</strong>
                      <span>{task.description}</span>
                    </div>

                    <span
                      className="task-category"
                      style={{ borderLeft: `3px solid ${task.categoryColor}`, paddingLeft: 7 }}
                    >
                      {task.category}
                    </span>

                    <span className={`priority-badge priority-${task.priority}`}>
                      <Flag size={12} />{priorityLabels[task.priority]}
                    </span>

                    <select
                      className={`status-badge status-${task.status}`}
                      value={task.status}
                      onChange={(event) =>
                        void changeTaskStatus(task.id, event.target.value as TaskStatus)
                      }
                      aria-label={`${task.title}のステータス`}
                    >
                      <option value="todo">未着手</option>
                      <option value="in-progress">進行中</option>
                      <option value="done">完了</option>
                    </select>

                    <span className="task-date">
                      <CalendarDays size={14} />{formatDate(task.dueDate)}
                    </span>

                    <button
                      className="task-more"
                      onClick={() => openEditTask(task)}
                      aria-label={`${task.title}を編集`}
                      title="タスクを編集"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="task-more"
                      onClick={() => void deleteTask(task.id)}
                      aria-label={`${task.title}を削除`}
                      title="タスクを削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="tasks-footer">
              <span>{filteredTasks.length} 件のタスクを表示中</span>
              <span>TaskFlow Workspace</span>
            </div>
          </section>

          <section className="panel" style={{ marginTop: 24, padding: 24 }}>
            <div className="panel-heading">
              <div>
                <h2><Tag size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />カテゴリ管理</h2>
                <p>タスクを分類するカテゴリを作成・編集・削除できます</p>
              </div>
            </div>

            <form
              onSubmit={createCategory}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}
            >
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="新しいカテゴリ名"
                maxLength={100}
                required
                style={{
                  flex: '1 1 200px', minWidth: 0, padding: '11px 13px',
                  border: '1px solid #e2e8f0', borderRadius: 9,
                }}
              />
              <input
                type="color"
                value={categoryColor}
                onChange={(event) => setCategoryColor(event.target.value)}
                title="カテゴリカラー"
                aria-label="カテゴリカラー"
                style={{ width: 48, height: 42, padding: 3, border: '1px solid #e2e8f0', borderRadius: 9 }}
              />
              <button className="primary-button" type="submit" disabled={categorySaving}>
                <Plus size={17} />{categorySaving ? '作成中...' : 'カテゴリを追加'}
              </button>
            </form>

            {categories.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>カテゴリはまだありません。</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 12px', border: '1px solid #e2e8f0',
                      borderRadius: 10, background: '#fff',
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: category.color,
                    }} />
                    <strong style={{ fontSize: 13 }}>{category.name}</strong>
                    <button
                      className="task-more"
                      onClick={() => void editCategory(category)}
                      title="カテゴリ名を編集"
                      aria-label={`${category.name}を編集`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="task-more"
                      onClick={() => void deleteCategory(category)}
                      title="カテゴリを削除"
                      aria-label={`${category.name}を削除`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="app-footer">
            <span>© 2026 TaskFlow</span>
            <span>Make work flow better.</span>
          </footer>
        </div>
      </main>

      {isModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false)
          }}
        >
          <div className="task-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{editingTaskId === null ? 'NEW TASK' : 'EDIT TASK'}</span>
                <h2>{editingTaskId === null ? '新しいタスクを作成' : 'タスクを編集'}</h2>
                <p>必要な情報を入力してください。</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="閉じる">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTask}>
              <label className="form-field">
                <span>タスク名 <b>*</b></span>
                <input
                  autoFocus
                  required
                  maxLength={255}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="例：週次ミーティングの資料を作成する"
                />
              </label>

              <label className="form-field">
                <span>説明</span>
                <textarea
                  rows={3}
                  maxLength={10000}
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  placeholder="タスクの詳細を入力..."
                />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <span>優先度</span>
                  <select
                    value={newPriority}
                    onChange={(event) => setNewPriority(event.target.value as Priority)}
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>ステータス</span>
                  <select
                    value={newStatus}
                    onChange={(event) => setNewStatus(event.target.value as TaskStatus)}
                  >
                    <option value="todo">未着手</option>
                    <option value="in-progress">進行中</option>
                    <option value="done">完了</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label className="form-field">
                  <span>カテゴリ</span>
                  <select
                    value={newCategoryId}
                    onChange={(event) =>
                      setNewCategoryId(event.target.value === '' ? '' : Number(event.target.value))
                    }
                  >
                    <option value="">未分類</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>期限</span>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(event) => setNewDueDate(event.target.value)}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  キャンセル
                </button>
                <button type="submit" className="primary-button">
                  {editingTaskId === null ? <Plus size={17} /> : <Pencil size={16} />}
                  {editingTaskId === null ? 'タスクを作成' : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AuthenticatedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: '#3158a7', fontSize: 14,
      }}>
        TaskFlowを読み込んでいます...
      </div>
    )
  }

  if (!user) return <AuthPage />

  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
