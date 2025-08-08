// src/components/CalendarCheckin.jsx
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";

function useLocalStorage(key, initialValue) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

export default function CalendarCheckin() {
  // 允许左右切月查看历史
  const [cursor, setCursor] = useState(dayjs());
  const todayStr = dayjs().format("YYYY-MM-DD");
  const [days, setDays] = useLocalStorage("checkin_days", []); // ['2025-08-08', ...]
  const checked = useMemo(() => new Set(days), [days]);

  function toggle(dateStr) {
    setDays((arr) => {
      const s = new Set(arr);
      s.has(dateStr) ? s.delete(dateStr) : s.add(dateStr);
      return Array.from(s).sort();
    });
  }

  // 统计
  const total = days.length;
  const consecutive = useMemo(() => {
    let cnt = 0;
    let d = dayjs();
    while (checked.has(d.format("YYYY-MM-DD"))) {
      cnt++;
      d = d.subtract(1, "day");
    }
    return cnt;
  }, [checked]);

  // 当月计算
  const startOfMonth = cursor.startOf("month");
  const endOfMonth = cursor.endOf("month");
  const startWeekIdx = startOfMonth.day(); // 0-6
  const totalDays = endOfMonth.date();

  const cells = [];
  for (let i = 0; i < startWeekIdx; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(dayjs(startOfMonth).date(d));
  }

  return (
    <div className="w-full">
      {/* 顶部操作 + 统计条：整体宽度收敛 */}
      <div className="mx-auto max-w-[880px] flex items-center justify-between mb-2">
        <div className="text-xs text-slate-600">
          共打卡：<span className="font-medium">{total}</span> 天；
          连续：<span className="font-medium">{consecutive}</span> 天；
          {checked.has(todayStr) ? <span className="text-emerald-600"> 今天已打卡 ✓</span> : <span> 今天未打卡</span>}
        </div>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
            onClick={() => setCursor((d) => d.subtract(1, "month"))}
          >
            上一月
          </button>
          <button
            className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
            onClick={() => setCursor(dayjs())}
          >
            本月
          </button>
          <button
            className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
            onClick={() => setCursor((d) => d.add(1, "month"))}
          >
            下一月
          </button>
        </div>
      </div>

      {/* 星期标题（限制整体宽度） */}
      <div className="mx-auto max-w-[880px] grid grid-cols-7 text-center text-xs text-slate-500 mb-1">
        {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      {/* 日历格（紧凑、高度固定；容器限制最大宽度） */}
      <div className="mx-auto max-w-[880px] grid grid-cols-7 gap-1">
        {cells.map((c, idx) =>
          c ? (
            <button
              key={idx}
              onClick={() => toggle(c.format("YYYY-MM-DD"))}
              className={`h-10 sm:h-11 md:h-12 w-full rounded-lg border text-xs sm:text-sm
                          flex items-center justify-center select-none transition
                          ${checked.has(c.format("YYYY-MM-DD"))
                            ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                            : "bg-white hover:bg-slate-50"}`}
              title={c.format("YYYY-MM-DD")}
            >
              {c.date()}
            </button>
          ) : (
            <div key={idx} className="h-10 sm:h-11 md:h-12" />
          )
        )}
      </div>
    </div>
  );
}
