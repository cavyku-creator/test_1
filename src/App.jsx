import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Toaster, toast } from "sonner";

/** ---------- 小工具 ---------- */
const ls = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }
};
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

/** ---------- 任务清单 ---------- */
function Tasks() {
  const [text, setText] = useState("");
  const [list, setList] = useState(() => ls.get("tasks", []));
  useEffect(()=>ls.set("tasks", list),[list]);

  const done = list.filter(t=>t.done).length;
  const progress = list.length ? Math.round(done / list.length * 100) : 0;

  const add = () => {
    const v = text.trim();
    if(!v) return;
    setList([{ id: crypto.randomUUID(), title: v, done:false, createdAt: Date.now() }, ...list]);
    setText("");
  };
  const toggle = (id)=> setList(list.map(t=> t.id===id? {...t,done:!t.done}:t));
  const del = (id)=> setList(list.filter(t=> t.id!==id));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>添加任务</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="例如：复习模电第3章 习题1-10" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
          <Button onClick={add}>添加</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>完成进度</CardTitle>
          <Badge variant="secondary">{progress}%</Badge>
        </CardHeader>
        <CardContent>
          <Progress value={progress}/>
          <p className="text-xs text-muted-foreground mt-2">共 {list.length} 项，已完成 {done} 项</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>任务列表</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {list.length===0 && <p className="text-sm text-muted-foreground">暂无任务，先在上面添加一个吧。</p>}
          {list.map(t=>(
            <div key={t.id} className="flex items-center gap-3">
              <Checkbox checked={t.done} onCheckedChange={()=>toggle(t.id)}/>
              <div className={`flex-1 ${t.done?'line-through text-muted-foreground':''}`}>{t.title}</div>
              <Button variant="secondary" size="sm" onClick={()=>del(t.id)}>删除</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** ---------- 番茄钟 ---------- */
function Pomodoro() {
  const [mins, setMins] = useState(()=> ls.get("pz_mins", 25));
  const [left, setLeft] = useState(()=> ls.get("pz_left", mins*60));
  const [running, setRunning] = useState(false);
  const timerRef = useRef();

  useEffect(()=>ls.set("pz_mins", mins),[mins]);
  useEffect(()=>ls.set("pz_left", left),[left]);

  useEffect(()=>{
    if(!running) return;
    timerRef.current = setInterval(()=> setLeft((s)=>{
      if (s<=1){ clearInterval(timerRef.current); setRunning(false); toast.success("番茄完成，休息一下！"); return 0; }
      return s-1;
    }),1000);
    return ()=> clearInterval(timerRef.current);
  },[running]);

  const start = ()=> { if(left<=0) setLeft(mins*60); setRunning(true); };
  const reset = ()=> { setRunning(false); setLeft(mins*60); };

  const mm = String(Math.floor(left/60)).padStart(2,"0");
  const ss = String(left%60).padStart(2,"0");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>设置</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2">
          <Input type="number" min={1} max={120} value={mins} onChange={e=>setMins(Number(e.target.value)||25)} className="w-24"/>
          <span className="text-sm text-muted-foreground">分钟/番茄</span>
          <Button onClick={()=>setLeft(mins*60)} variant="secondary">应用</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>番茄钟</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="text-5xl font-mono">{mm}:{ss}</div>
          <div className="flex gap-2">
            <Button onClick={start} disabled={running}>开始</Button>
            <Button onClick={()=>setRunning(false)} variant="secondary">暂停</Button>
            <Button onClick={reset} variant="outline">重置</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** ---------- 复习/便签 ---------- */
function Notes() {
  const [text, setText] = useState(()=> ls.get("notes", ""));
  useEffect(()=> ls.set("notes", text), [text]);

  const [review, setReview] = useState(()=> ls.get("review", []));
  useEffect(()=> ls.set("review", review), [review]);

  const add = ()=>{
    const t = prompt("输入需要安排复习的知识点（例如：信号与系统 第5章）");
    if(!t) return;
    const item = { id: crypto.randomUUID(), title: t, next: ymd(), count: 0 };
    setReview([item, ...review]);
  };
  const doneToday = (id)=>{
    setReview(review.map(r=> r.id===id ? { ...r, count:r.count+1, next: ymd(new Date(Date.now()+[1,3,7,14,30][Math.min(r.count,4)]*86400000)) } : r));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>便签</CardTitle>
          <Badge variant="secondary">{text.length} 字</Badge>
        </CardHeader>
        <CardContent>
          <Textarea rows={8} value={text} onChange={e=>setText(e.target.value)} placeholder="随手记：易错点、题目编号、明天要做什么……"/>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>复习计划（简单艾宾浩斯）</CardTitle>
          <Button size="sm" onClick={add}>添加</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {review.length===0 && <p className="text-sm text-muted-foreground">还没有复习项，点右上角添加。</p>}
          {review.map(r=>(
            <div key={r.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">下次复习：{r.next}（已复习 {r.count} 次）</div>
              </div>
              <Button size="sm" onClick={()=>doneToday(r.id)}>完成今天</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>每日打卡</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Badge>今天：{ymd()}</Badge>
          <Button onClick={()=>{ const k=`checkin:${ymd()}`; if(localStorage.getItem(k)){ toast.info("今天已经打过卡"); } else { localStorage.setItem(k,"1"); toast.success("打卡成功！"); }}}>打卡</Button>
          <p className="text-xs text-muted-foreground">提示：仅记录本地，换浏览器/清缓存会丢失。</p>
        </CardContent>
      </Card>
    </div>
  );
}

/** ---------- 容器页 ---------- */
export default function App() {
  // 全局加载历史番茄完成次数作为示例统计
  const [history, setHistory] = useState(()=> ls.get("history", []));
  useEffect(()=> ls.set("history", history), [history]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-bold">学习效率助手（基础版）</h1>
        <p className="text-sm text-muted-foreground">
          本地离线存储 | 任务清单 | 番茄钟 | 复习计划 | 便签 | 打卡
        </p>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList>
            <TabsTrigger value="tasks">任务</TabsTrigger>
            <TabsTrigger value="pomodoro">专注</TabsTrigger>
            <TabsTrigger value="notes">复习 / 便签</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4"><Tasks/></TabsContent>
          <TabsContent value="pomodoro" className="mt-4"><Pomodoro/></TabsContent>
          <TabsContent value="notes" className="mt-4"><Notes/></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
