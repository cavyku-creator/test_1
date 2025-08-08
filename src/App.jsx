// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import CalendarCheckin from "./components/CalendarCheckin";

/* ----------------------- 通用：本地持久化 Hook ----------------------- */
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

/* ----------------------- 任务清单 ----------------------- */
function TaskList() {
  const [tasks, setTasks] = useLocalStorage("tasks_v1", []); // [{id, text, done}]
  const [text, setText] = useState("");

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.done).length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  function addTask() {
    const v = text.trim();
    if (!v) return;
    setTasks((arr) => [
      ...arr,
      { id: Date.now(), text: v, done: false },
    ]);
    setText("");
  }
  function toggle(id) {
    setTasks((arr) =>
      arr.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }
  function remove(id) {
    setTasks((arr) => arr.filter((t) => t.id !== id));
  }
  function clearDone() {
    setTasks((arr) => arr.filter((t) => !t.done));
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">任务清单</div>
        {tasks.some((t) => t.done) && (
          <button
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
            onClick={clearDone}
          >
            清除已完成
          </button>
        )}
      </div>

      {/* 添加 */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="例如：复习信号与系统 第3章 习题1-10"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button
          onClick={addTask}
          className="px-3 py-2 text-sm rounded-lg border bg-slate-900 text-white hover:opacity-90"
        >
          添加
        </button>
      </div>

      {/* 进度 */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>进度：{progress}%</span>
          <span>
            {tasks.filter((t) => t.done).length}/{tasks.length}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded">
          <div
            className="h-2 bg-emerald-500 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 列表 */}
      {tasks.length === 0 ? (
        <div className="text-xs text-slate-400">暂无任务，先在上面添加一个吧。</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span
                className={`text-sm flex-1 ${
                  t.done ? "line-through text-slate-400" : ""
                }`}
              >
                {t.text}
              </span>
              <button
                className="text-xs text-slate-500 hover:text-rose-600"
                onClick={() => remove(t.id)}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------- 番茄钟（可配置） ----------------------- */
function FocusTimer() {
  const [minutes, setMinutes] = useLocalStorage("pomodoro_minutes_v1", 25);
  const [secondsLeft, setSecondsLeft] = useLocalStorage(
    "pomodoro_seconds_v1",
    minutes * 60,
  );
  const [running, setRunning] = useLocalStorage("pomodoro_running_v1", false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, setSecondsLeft]);

  // 当修改分钟并应用时，重置剩余时间
  function applyMinutes() {
    const m = Math.max(1, Math.min(90, Number(minutes) || 25));
    setMinutes(m);
    setSecondsLeft(m * 60);
    setRunning(false);
  }

  function start() {
    if (secondsLeft <= 0) setSecondsLeft(minutes * 60);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setSecondsLeft(minutes * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const percent =
    minutes > 0 ? Math.round(((minutes * 60 - secondsLeft) / (minutes * 60)) * 100) : 0;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
      <div className="text-sm font-medium">专注 · 番茄钟</div>

      {/* 设置 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">设置</span>
        <input
          type="number"
          min={1}
          max={90}
          className="w-20 rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-slate-300"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <span className="text-slate-500">分钟/番茄</span>
        <button
          className="ml-1 px-2 py-1 rounded-lg border bg-white hover:bg-slate-50"
          onClick={applyMinutes}
        >
          应用
        </button>
      </div>

      {/* 时间显示 */}
      <div className="text-4xl font-bold tracking-wider">{mm}:{ss}</div>

      {/* 进度 */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>进度：{percent}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded">
          <div
            className="h-2 bg-sky-500 rounded"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 控制 */}
      <div className="flex gap-2">
        {!running ? (
          <button
            className="px-3 py-2 text-sm rounded-lg border bg-emerald-600 text-white hover:opacity-90"
            onClick={start}
          >
            开始
          </button>
        ) : (
          <button
            className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
            onClick={pause}
          >
            暂停
          </button>
        )}
        <button
          className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
          onClick={reset}
        >
          重置
        </button>
      </div>
    </div>
  );
}

/* ----------------------- 复习 / 便签 + 日历 ----------------------- */
function ReviewPanel() {
  const [note, setNote] = useLocalStorage("review_note_v1", "");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white shadow-sm p-4">
        <div className="text-sm font-medium mb-2">便签</div>
        <textarea
          className="w-full h-28 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="随手记：易错点、题目编号、明天要做什么……"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-1 text-xs text-slate-400 text-right">{note.length} 字</div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm p-4">
        <div className="text-sm font-medium mb-3">每日打卡</div>
        <CalendarCheckin />
      </div>
    </div>
  );
}

/* ----------------------- 顶层 App ----------------------- */
const TABS = [
  { key: "task", text: "任务" },
  { key: "focus", text: "专注" },
  { key: "review", text: "复习 / 便签" },
];

export default function App() {
  const [tab, setTab] = useLocalStorage("ui_tab_v1", "task");

  return (
    <div className="min-h-screen">
      {/* 顶部 */}
      <div className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-bold tracking-tight">学习效率助手（基础版）</h1>
          <p className="mt-1 text-xs text-slate-500">
            本地离线存储 · 任务清单 · 番茄钟 · 复习计划 · 便签 · 打卡
          </p>
        </div>
      </div>

      {/* 内容版心 */}
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* 标签 */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition
                ${tab === t.key ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
            >
              {t.text}
            </button>
          ))}
        </div>

        {/* 对应内容 */}
        {tab === "task" && (
          <>
            <TaskList />
          </>
        )}

        {tab === "focus" && (
          <>
            <FocusTimer />
          </>
        )}

        {tab === "review" && (
          <>
            <ReviewPanel />
          </>
        )}
      </div>
    </div>
  );
}
