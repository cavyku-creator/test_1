import React, { useMemo, useState } from "react";

/**
 * 本地打卡日历
 * - 单击某一天可切换是否打卡
 * - 统计：本月累计/连续天数/今天是否打卡
 * - 全部数据保存在 localStorage('calendar.checkin')
 */
export default function CalendarCheckin() {
  const today = new Date();
  const [ym, setYm] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-11
  });

  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("calendar.checkin");
      return raw ? JSON.parse(raw) : {}; // {'2025-08-08': true}
    } catch {
      return {};
    }
  });

  const save = (next) => {
    setData(next);
    try {
      localStorage.setItem("calendar.checkin", JSON.stringify(next));
    } catch {}
  };

  const firstDay = new Date(ym.year, ym.month, 1);
  const startWeekday = firstDay.getDay(); // 0-6
  const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate();
  const cells = useMemo(() => {
    const arr = [];
    // 前面空位
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    // 当月日期
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(new Date(ym.year, ym.month, d));
    }
    // 补齐 6 行
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [startWeekday, daysInMonth, ym]);

  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const toggle = (d) => {
    const k = iso(d);
    const next = { ...data, [k]: !data[k] };
    save(next);
  };

  // 统计
  const summaries = useMemo(() => {
    // 本月累计
    let monthly = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const k = iso(new Date(ym.year, ym.month, i));
      if (data[k]) monthly++;
    }

    // 连续
    let streak = 0;
    let ptr = new Date(ym.year, ym.month, Math.min(today.getDate(), daysInMonth));
    // 往前数
    while (true) {
      const k = iso(ptr);
      if (data[k]) {
        streak++;
        ptr.setDate(ptr.getDate() - 1);
      } else break;
    }

    const todayKey = iso(today);
    const checkedToday = !!data[todayKey];

    return { monthly, streak, checkedToday };
  }, [data, ym, daysInMonth, today]);

  const changeMonth = (delta) => {
    const d = new Date(ym.year, ym.month + delta, 1);
    setYm({ year: d.getFullYear(), month: d.getMonth() });
  };

  const weekNames = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="grid gap-3">
      {/* 顶部工具条 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-gray-600">
          <span className="mr-4">本月：{summaries.monthly} 天累计</span>
          <span className="mr-4">连续：{summaries.streak} 天</span>
          <span>今天：{summaries.checkedToday ? "已打卡" : "未打卡"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            上一月
          </button>
          <button
            onClick={() =>
              setYm({ year: today.getFullYear(), month: today.getMonth() })
            }
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            今月
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            下一月
          </button>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-7 text-center text-sm text-gray-500">
        {weekNames.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />;
          const k = iso(d);
          const isToday = k === iso(today);
          const checked = !!data[k];

          return (
            <button
              key={i}
              onClick={() => toggle(d)}
              className={`aspect-square rounded-xl border text-sm flex items-center justify-center transition
                ${
                  checked
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }
                ${isToday ? "ring-2 ring-indigo-400" : ""}
              `}
              title={k + (checked ? " · 已打卡" : " · 未打卡")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
