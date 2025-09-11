"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PlayCircle,
  BookOpen,
  Image as ImageIcon,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {api} from "@/lib/api";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";

/* -------------------------
   Types
   ------------------------- */
type WeeklyBucket = {
  weekStart: string;
  completedCount: number;
  timeSpentSeconds: number;
};

type MonthlyBucket = {
  monthStart: string;
  completedCount: number;
  timeSpentSeconds: number;
};

interface Chapter {
  title?: string;
  chapterId: string;
  total: number;
  completed: number;
  percentage: number;
}

interface Subject {
  title?: string;
  subjectId: string;
  total: number;
  completed: number;
  percentage: number;
  chapters: Chapter[];
}

interface ClassData {
  title?: string;
  classId: string;
  total: number;
  completed: number;
  percentage: number;
  subjects: Subject[];
}

type ApiResponse = {
  success: boolean;
  overall: {
    totalContents: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percentage: number;
  };
  byType: Record<string, any>;
  weekly: WeeklyBucket[];
  monthly: MonthlyBucket[];
  classes: ClassData[];
  recent: any[];
  watchHistory: any[];
};

/* -------------------------
   Palette (no ambers)
   ------------------------- */
const COLORS = {
  primary: "#2563eb", // blue
  green: "#16a34a", // green-600
  indigo: "#4f46e5",
  pink: "#ec4899",
  sky: "#0ea5e9",
  slate: "#334155",
  gray: "#6b7280",
};

const TYPE_ICON: Record<string, JSX.Element> = {
  video: <PlayCircle className="h-5 w-5" />,
  file: <FileIcon className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  quiz: <BookOpen className="h-5 w-5" />,
};

/* -------------------------
   Image helper
   ------------------------- */
const AWS_BASE = process.env.NEXT_PUBLIC_AWS_STORAGE_URL || "";
const resolveImg = (v?: string) => {
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (!AWS_BASE) return v; // in case full url already
  return `${AWS_BASE}/${v.replace(/^\//, "")}`;
};

/* -------------------------
   Page
   ------------------------- */
export default function ProgressPageKidsFriendly() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const studentId = params.get("id");
  console.log(studentId)

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (studentId) {
          const res = await api.get(
            `progress/admin/${studentId}?recentLimit=8&watchLimit=10`
          );
          if (!mounted) return;
          setData(res.data);
        } else {
          const res = await api.get(
            "progress/mine?recentLimit=8&watchLimit=10"
          );
          if (!mounted) return;
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError("Could not load progress. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  // helpers
  const formatTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const overallPct = Math.max(0, Math.min(100, data?.overall?.percentage ?? 0));

  const weeklyChartData = useMemo(
    () =>
      (data?.weekly || [])
        .slice()
        .reverse()
        .map((w) => ({
          name: new Date(w.weekStart).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          completed: w.completedCount,
          time: w.timeSpentSeconds || 0,
        })),
    [data?.weekly]
  );

  const monthlyChartData = useMemo(
    () =>
      (data?.monthly || [])
        .slice()
        .reverse()
        .map((m) => ({
          name: new Date(m.monthStart).toLocaleDateString(undefined, {
            month: "short",
          }),
          completed: m.completedCount,
        })),
    [data?.monthly]
  );

  const typePieData = useMemo(
    () =>
      Object.entries(data?.byType || {}).map(([key, val]) => ({
        name: key,
        value: val?.total || 0,
      })),
    [data?.byType]
  );

  const byTypeCards = useMemo(
    () => Object.keys(data?.byType || {}),
    [data?.byType]
  );

  // Parent-mode metrics
  const weeklyTotalTime = useMemo(
    () =>
      (data?.weekly || []).reduce(
        (sum, w) => sum + (w.timeSpentSeconds || 0),
        0
      ),
    [data?.weekly]
  );

  const weeklyStreak = useMemo(() => {
    const weeks = (data?.weekly || [])
      .slice()
      .sort((a, b) => +new Date(b.weekStart) - +new Date(a.weekStart));
    let streak = 0;
    for (const w of weeks) {
      if ((w.completedCount || 0) > 0) streak++;
      else break;
    }
    return streak;
  }, [data?.weekly]);

  const COLORS_LIST = [
    COLORS.primary,
    COLORS.green,
    COLORS.indigo,
    COLORS.pink,
    COLORS.sky,
    COLORS.slate,
  ];

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary/10">

      <main className="max-w-full lg:px-20 mx-auto px-6 py-6 lg:pt-28 space-y-8">
        {/* 🚀 TOP HERO */}
        <section className="rounded-3xl border shadow w-full bg-gray-50 p-6 lg:p-10 relative overflow-hidden">
          {/* subtle background shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />

          <div className="relative mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 🎯 Radial Progress + Encouragement */}
            <div className="col-span-1 flex items-center lg:items-start gap-6">
              <div className="w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="78%"
                    outerRadius="100%"
                    data={[
                      {
                        name: "Progress",
                        value: overallPct,
                        fill: COLORS.primary,
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar dataKey="value" cornerRadius={16} background />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                  {Math.round(overallPct)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Overall completion
                </div>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-4 py-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    Keep going — you’re awesome!
                  </span>
                </div>
              </div>
            </div>

            {/* 📊 Quick Stats */}
            <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard
                label="Completed"
                value={String(data?.overall?.completed ?? 0)}
                color={COLORS.green}
              />
              <StatCard
                label="In progress"
                value={String(data?.overall?.inProgress ?? 0)}
                color={COLORS.primary}
              />
              <StatCard
                label="Not started"
                value={String(data?.overall?.notStarted ?? 0)}
                color={COLORS.indigo}
              />
              <StatCard
                label="Video time"
                value={formatTime(data?.byType?.video?.timeSpent || 0)}
                color={COLORS.sky}
              />
            </div>
          </div>

          {/* ⚠️ Error banner */}
          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-white/90 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </section>

        {/* CLASSES */}
        <section className="rounded-2xl border shadow bg-gray-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-slate-800">
              View Progress
            </h3>
            <div className="text-xs text-gray-500">Tap to expand</div>
          </div>
          <ClassesProgress classes={data?.classes ?? []} />
        </section>

        {/* INSIGHTS ROW: Weekly / Monthly / Type mix */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border shadow bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-slate-800">
                Weekly Activity
              </h3>
              <div className="text-xs text-gray-500">Last weeks</div>
            </div>
            <div className="h-48">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyChartData}
                    margin={{ top: 6, right: 8, left: -12, bottom: 0 }}
                  >
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="completed"
                      radius={[8, 8, 0, 0]}
                      fill={COLORS.green}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Badge
                label="Streak"
                value={`${weeklyStreak} week${weeklyStreak === 1 ? "" : "s"}`}
              />
              <Badge
                label="Watch time (wk)"
                value={formatTime(weeklyTotalTime)}
              />
            </div>
          </div>

          <div className="rounded-2xl border shadow bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-slate-800">
                Monthly Trend
              </h3>
              <div className="text-xs text-gray-500">Recent months</div>
            </div>
            <div className="h-48">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyChartData}
                    margin={{ top: 6, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* CONTINUE WATCHING */}
        <section className="rounded-2xl border shadow bg-gray-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-slate-800">
              Continue Watching
            </h3>
            <div className="text-xs text-gray-500">Pick up where you left</div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading…</div>
            ) : (data?.watchHistory || []).length === 0 ? (
              <div className="text-gray-500 text-sm">
                No watch history yet — start a video!
              </div>
            ) : (
              (data?.watchHistory || []).map((w) => {
                const imgUrl = resolveImg(
                  (w.image as string) ||
                    (w.thumbnailKey as string) ||
                    (w.thumbnailUrl as string) ||
                    (w.contentThumbnail as string)
                );
                return (
                  <div
                    key={w.contentId}
                    className="min-w-[260px] rounded-2xl border bg-white p-3 flex-shrink-0"
                  >
                    <div className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-100">
                      {imgUrl ? (
                        <Image
                          width={400}
                          height={240}
                          src={imgUrl}
                          alt={w.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-indigo-900 text-base">
                          {(w.title || "").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <button className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-blue-600 text-white px-3 py-1">
                        <PlayCircle className="h-4 w-4" />
                        <span className="text-xs">Resume</span>
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm line-clamp-2 text-slate-800">
                        {w.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatTime(w.durationSeconds)} •{" "}
                        {Math.round(w.progress)}%
                      </div>

                      <div className="w-full mt-2 bg-gray-200 h-3 rounded-full">
                        <div
                          className="h-3 rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(100, w.progress))}%`,
                            backgroundColor: COLORS.green,
                          }}
                        />
                      </div>

                      <div className="mt-2 text-[11px] text-gray-500">
                        {new Date(w.lastWatchedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RECENT ACTIVITY (timeline-like grid) */}
        <section className="rounded-2xl border shadow bg-gray-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-slate-800">
              Recent Activity
            </h3>
            <div className="text-xs text-gray-500">Latest items</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-scroll">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading…</div>
            ) : (data?.recent || []).length === 0 ? (
              <div className="text-gray-500 text-sm">
                No recent activity yet
              </div>
            ) : (
              (data?.recent || []).map((r) => {
                const imgUrl = resolveImg(
                  (r.image as string) ||
                    (r.thumbnailKey as string) ||
                    (r.thumbnailUrl as string) ||
                    (r.contentThumbnail as string)
                );
                return (
                  <div
                    key={r._id || r.contentId}
                    className="p-3 rounded-2xl border bg-white flex flex-col gap-2"
                  >
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {imgUrl ? (
                        <Image
                          width={600}
                          height={300}
                          src={imgUrl}
                          alt={r.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-blue-700 text-lg">
                          {(r.title || "").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1">
                      <div className="text-sm line-clamp-2 text-slate-800">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-gray-600 capitalize">
                        {r.type} •{" "}
                        {r.completedAt
                          ? new Date(r.completedAt).toLocaleString()
                          : new Date(r.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-1 flex justify-between items-center text-xs text-gray-600">
                      {r.type === "quiz" && r.quizScore ? (
                        <span className="">Score: {r.quizScore}</span>
                      ) : (
                        <span>{r.status}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* FOOTER BANNER */}
      <footer className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-2xl border bg-gray-50 p-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-slate-800">
            Keep going! You&apos;re doing great.
          </span>
        </div>
      </footer>
    </div>
  </AdminLayout>
  );
}

/* -------------------------
   Reusable bits
   ------------------------- */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow transition">
      <div className="text-2xl mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center justify-between rounded-xl bg-white border px-3 py-2">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-xs text-slate-800 ml-2">{value}</span>
    </div>
  );
}

/* -------------------------
   Classes, Subjects, Chapters
   ------------------------- */
function ClassesProgress({ classes }: { classes: ClassData[] }) {
  if (!classes || classes.length === 0) {
    return <div className="text-gray-500">No class progress yet</div>;
  }
  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <ClassCard key={cls.classId} cls={cls} />
      ))}
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassData }) {
  const [open, setOpen] = useState(false);
  const title = cls.title ?? `Class ${cls.classId.slice(0, 6)}`;
  return (
    <div className="rounded-2xl bg-white border p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
            {title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-slate-800">{title}</div>
            <div className="text-xs text-gray-600">
              {cls.completed}/{cls.total} lessons
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-800">
            {Math.round(cls.percentage)}%
          </div>
          {open ? <ChevronDown /> : <ChevronRight />}
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          completed={cls.completed}
          total={cls.total}
          percent={cls.percentage}
          small
        />
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-3 pl-1">
          {cls.subjects.map((sub) => (
            <SubjectCard key={sub.subjectId} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({ sub }: { sub: Subject }) {
  const [open, setOpen] = useState(false);
  const title = sub.title ?? `Subject ${sub.subjectId.slice(0, 6)}`;
  return (
    <div className="bg-gray-50 rounded-xl border p-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
            {title.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-slate-800">{title}</div>
            <div className="text-xs text-gray-600">
              {sub.completed}/{sub.total} lessons
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm">{Math.round(sub.percentage)}%</div>
          {open ? <ChevronDown /> : <ChevronRight />}
        </div>
      </div>

      <div className="mt-2">
        <ProgressBar
          completed={sub.completed}
          total={sub.total}
          percent={sub.percentage}
          small
        />
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-2 pl-1">
          {sub.chapters.map((ch) => (
            <ChapterCard key={ch.chapterId} ch={ch} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterCard({ ch }: { ch: Chapter }) {
  const title = ch.title ?? `Chapter ${ch.chapterId.slice(0, 6)}`;
  return (
    <div className="bg-white rounded-lg border p-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-800">{title}</span>
        <span className="text-xs text-gray-600">
          {ch.completed}/{ch.total}
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar
          completed={ch.completed}
          total={ch.total}
          percent={ch.percentage}
          small
        />
      </div>
    </div>
  );
}

/* -------------------------
   Progress bar — consistent green
   ------------------------- */
function ProgressBar({
  completed,
  total,
  percent,
  small,
}: {
  completed: number;
  total: number;
  percent: number;
  small?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const barColor = COLORS.green;
  return (
    <div
      className={`${
        small ? "h-2" : "h-4"
      } w-full bg-gray-200 rounded-full overflow-hidden`}
    >
      <div
        style={{ width: `${pct}%`, backgroundColor: barColor }}
        className={`h-full rounded-full transition-all`}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  );
}
