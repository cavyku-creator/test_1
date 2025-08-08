import React, { useEffect, useMemo, useState } from "react";
import CalendarCheckin from "./components/CalendarCheckin";

/** 小工具：localStorage Hook */
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

/** 工具：时间格式化 */
const pad = (n) => String(n).padStart(2, "0");
const formatTime = (sec) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

export default function App() {
  const [tab, setTab] = useLocalStorage("ui.tab", "tasks");

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">
            学习效率助手（基础版）
          </h1>

          {/* 顶部导航 */}
          <nav className="flex gap-2 text-sm">
            {[
              { id: "tasks", name: "任务" },
              { id: "focus", name: "专注" },
              { id: "review", name: "复习 / 便签" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg border transition
                ${
                  tab === t.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white hover:bg-indigo-50 border-gray-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 内容区 */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {tab === "tasks" && <TaskSection />}
        {tab === "focus" && <FocusSection />}
        {tab === "review" && <ReviewNotesSection />}
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        仅记录在本地（localStorage）。更换浏览器/清缓存会丢失。
      </footer>
    </div>
  );
}

/* ===================== 任务清单 ===================== */

function TaskSection() {
  const [tasks, setTasks] = useLocalStorage("tasks.items", []);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("普通");

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    const done = tasks.filter((t) => t.done).length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const addTask = () => {
    if (!text.trim()) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        text: text.trim(),
        done: false,
        priority,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setText("");
  };

  const toggle = (id) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done));

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-3">任务清单</h2>

      {/* 输入 */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="flex-1 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="例如：复习电路第3章 / 刷题1-10"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <select
          className="rounded-lg border px-3 py-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>普通</option>
          <option>重要</option>
          <option>紧急</option>
        </select>
        <button
          onClick={addTask}
          className="rounded-lg bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700"
        >
          添加
        </button>
      </div>

      {/* 进度 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>完成进度</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 列表 */}
      <ul className="divide-y">
        {tasks.length === 0 && (
          <li className="py-8 text-center text-gray-500">暂无任务，先在上面添加一个吧。</li>
        )}
        {tasks.map((t) => (
          <li key={t.id} className="py-3 flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded"
              checked={t.done}
              onChange={() => toggle(t.id)}
            />
            <div className="flex-1">
              <div
                className={`font-medium ${
                  t.done ? "line-through text-gray-400" : ""
                }`}
              >
                {t.text}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                优先级：{t.priority}
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-red-500 text-sm"
              onClick={() => remove(t.id)}
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {tasks.some((t) => t.done) && (
        <div className="mt-4 text-right">
          <button
            onClick={clearDone}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            清除已完成
          </button>
        </div>
      )}
    </section>
  );
}

/* ===================== 专注番茄钟 ===================== */

function FocusSection() {
  const [minutes, setMinutes] = useLocalStorage("focus.minutes", 25);
  const [remain, setRemain] = useLocalStorage("focus.remain", minutes * 60);
  const [running, setRunning] = useLocalStorage("focus.running", false);
  const [lastTick, setLastTick] = useState(null);

  // 当时长修改时，若未运行则同步重置
  useEffect(() => {
    if (!running) setRemain(minutes * 60);
  }, [minutes, running, setRemain]);

  // 计时
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let prev = performance.now();

    const loop = (now) => {
      const deltaSec = Math.max(0, Math.floor((now - prev) / 1000));
      if (deltaSec > 0) {
        setRemain((r) => Math.max(0, r - deltaSec));
        prev = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [running, setRemain]);

  // 归零响铃（简单提示）
  useEffect(() => {
    if (remain === 0 && running) {
      setRunning(false);
      try {
        new AudioContext();
        // 浏览器限制可能不播放，这里仅做占位
      } catch {}
      alert("时间到！休息一下吧～");
    }
  }, [remain, running, setRunning]);

  const start = () => {
    if (remain === 0) setRemain(minutes * 60);
    setRunning(true);
    setLastTick(Date.now());
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemain(minutes * 60);
  };

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-1">番茄钟</h2>
      <p className="text-xs text-gray-500 mb-4">
        先设定分钟数，点击开始即可计时。页面刷新也会续上。
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">设定</span>
        <input
          type="number"
          min={1}
          max={180}
          className="w-24 rounded-lg border px-3 py-2"
          value={minutes}
          onChange={(e) => {
            const m = Math.max(1, Math.min(180, Number(e.target.value || 1)));
            setMinutes(m);
          }}
        />
        <span className="text-sm text-gray-500">分钟/番茄</span>
      </div>

      <div className="text-5xl sm:text-6xl font-mono tracking-widest mb-4">
        {formatTime(remain)}
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            className="rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
            onClick={start}
          >
            开始
          </button>
        ) : (
          <button
            className="rounded-lg bg-amber-500 text-white px-4 py-2 hover:bg-amber-600"
            onClick={pause}
          >
            暂停
          </button>
        )}
        <button
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          onClick={reset}
        >
          重置
        </button>
      </div>
    </section>
  );
}

/* ===================== 复习 + 便签（含日历打卡） ===================== */

function ReviewNotesSection() {
  const [note, setNote] = useLocalStorage(
    "notes.daily",
    "随手记：刷错题、题目编号，明天要做什么……"
  );

  return (
    <section className="grid gap-6">
      {/* 数据概览 + 日历 */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-2">每日打卡 · 日历</h2>
        <CalendarCheckin />
      </div>

      {/* 便签 */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
        <h3 className="text-base font-semibold mb-2">便签</h3>
        <textarea
          className="w-full min-h-[180px] rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="text-xs text-gray-400 mt-1 text-right">
          {note.length} 字
        </div>
      </div>
    </section>
  );
}
