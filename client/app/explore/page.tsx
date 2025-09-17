"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Navbar from "@/components/navbar";
import ContentGrid from "@/components/content/ContentGrid";
import api from "@/lib/api";
import ThreeDotsSpinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type ContentItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey?: string;
  fileUrl?: string;
  videoUrl?: string;
  type?: string;
  createdAt?: string;
};

type ClassItem = { _id: string; name: string };
type SubjectItem = { _id: string; name: string; classId?: string };
type ChapterItem = { _id: string; name: string; subjectId?: string };

export default function ExplorePage() {
  // content
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPage = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 16;

  // taxonomy
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // filters / ui state
  const [selectedClass, setSelectedClass] = useState<string | "">("");
  const [selectedSubject, setSelectedSubject] = useState<string | "">("");
  const [selectedChapter, setSelectedChapter] = useState<string | "">("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  // refs for debouncing & cancelling
  const searchTimer = useRef<number | null>(null);
  const abortCtlRef = useRef<AbortController | null>(null);

  // types available (display order)
  const ALL_TYPES = useMemo(() => ["video", "image", "quiz", "file"], []);

  // --- Fetch taxonomy (classes) on mount ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/classes");
        if (!mounted) return;
        setClasses(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- When class is selected -> fetch subjects (dependent) ---
  useEffect(() => {
    setSubjects([]);
    setSelectedSubject("");
    setChapters([]);
    setSelectedChapter("");

    if (!selectedClass) return;

    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/subjects", {
          params: { classId: selectedClass, limit: 200 },
        });
        if (!mounted) return;
        setSubjects(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedClass]);

  // --- When subject is selected -> fetch chapters (dependent) ---
  useEffect(() => {
    setChapters([]);
    setSelectedChapter("");

    if (!selectedSubject) return;

    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/chapters", {
          params: { subjectId: selectedSubject, limit: 500 },
        });
        if (!mounted) return;
        setChapters(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch chapters", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedSubject]);

  // --- Debounce search input (500ms) ---
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 500) as unknown as number;

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // --- Build params for server (sends type when single, types csv when multiple) ---
  const buildParams = useCallback(
    (pageNum = page) => {
      const params: Record<string, any> = {
        page: pageNum,
        limit,
      };
      if (selectedClass) params.classId = selectedClass;
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedChapter) params.chapterId = selectedChapter;
      if (debouncedQuery) params.search = debouncedQuery;
      if (selectedType) params.type = selectedType;

      return params;
    },
    [
      selectedClass,
      selectedSubject,
      selectedChapter,
      selectedType,
      debouncedQuery,
      page,
    ]
  );

  // --- Fetch contents ---
  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (abortCtlRef.current) abortCtlRef.current.abort();
      const controller = new AbortController();
      abortCtlRef.current = controller;

      setLoading(true);
      try {
        const res = await api.get("/content", {
          params: buildParams(pageNum),
          signal: controller.signal,
        });

        setContents(Array.isArray(res.data.data) ? res.data.data : []);
        setPage(pageNum);
        if (res.data.pagination) setTotalPages(res.data.pagination.pages);
      } catch (err: any) {
        if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
          console.error("Failed to fetch content:", err);
          setContents([]);
        }
      } finally {
        setLoading(false);
        abortCtlRef.current = null;
      }
    },
    [buildParams]
  );

  const goToPage = useCallback(
    (pageNum: number) => {
      setPage(pageNum);
      router.push(`/explore?page=${pageNum}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    fetchPage(initialPage);
  }, [fetchPage, initialPage]); // run once

  // On filter/search change -> reset to page 1
  useEffect(() => {
    goToPage(1);
  }, [
    selectedClass,
    selectedSubject,
    selectedChapter,
    selectedType,
    debouncedQuery,
    goToPage,
  ]);

  const resetFilters = () => {
    setSelectedClass("");
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedType("");
    setSearchQuery("");
    setDebouncedQuery("");
    setPage(1);
  };

  const immediateSearch = () => {
    // cancel debounce and set debouncedQuery immediately
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    setDebouncedQuery(searchQuery.trim());
    setPage(1);
  };

  return (
    <main className="relative min-h-screen bg-neutral-100 pt-20">
      <Navbar />
      <div className="max-w-screen mx-auto px-6 lg:px-16 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RIGHT SECTION: filters + search + content */}
        <section className="lg:col-span-9 space-y-6">
          {/* Filters above search bar */}
          <div className="bg-white border border-gray-300 rounded-2xl shadow p-6 flex flex-row flex-wrap items-end gap-x-4 gap-y-2 justify-flex-start">
            {/* Class */}
            <div className="">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Class
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 p-3 bg-gray-50 text-sm"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Subject
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 p-3 bg-gray-50 text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">
                  {selectedClass ? "Select subject" : "Choose a class first"}
                </option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id} className="bg-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Chapter
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-gray-50 p-3 text-sm"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedSubject}
              >
                <option value="">
                  {selectedSubject
                    ? "Select chapter"
                    : "Choose a subject first"}
                </option>
                {chapters.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Types */}
            <div className="">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Content type
              </label>
              <select
                className="w-full p-3 rounded-lg border bg-gray-50 border-slate-200 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All types</option>
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}

            <button
              className="text-sm border p-2 rounded-md text-slate-500"
              onClick={resetFilters}
              aria-label="Reset filters"
            >
              Clear
            </button>

            <div className="bg-gray-50 border w-full rounded-2xl p-2 px-4 flex items-center gap-3">
              <Search className="h-7 w-7 text-slate-300" />
              <input
                placeholder="Search content by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-50 border-0 py-2 placeholder:text-normal lg:placeholder:text-lg lg:text-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") immediateSearch();
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                  className="p-2 rounded-md hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Content grid / results */}
          {loading ? (
            <div className="flex justify-center py-28">
              <ThreeDotsSpinner color="blue" />
            </div>
          ) : contents.length === 0 ? (
            <div className="rounded-2xl p-12 text-center text-slate-200">
              No content found. Try clearing filters or searching something
              else.
            </div>
          ) : (
            <>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <ContentGrid contents={contents} />
              )}

              {/* Pagination arrows */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(page + 1)}
                  disabled={
                    totalPages ? page >= totalPages : contents.length < limit
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </section>

        {/** RIGHT SECTION */}
        <aside className="h-auto lg:col-span-3 relative">
          <div className="lg:sticky lg:top-32 space-y-4">
            <Link href="/fun-break">
              <Image
                src={"/folder/fun-break.png"}
                alt="Fun Break"
                width={100}
                height={100}
                className="object-cover border border-gray-300 bg-yellow-100 h-full w-full rounded-xl shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
              />
            </Link>
            <Image
              src={"/folder/interactive-games.png"}
              alt="Fun Break"
              width={200}
              height={200}
              className="object-cover border border-gray-300 bg-purple-200 h-full w-full rounded-xl shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            />
            <Image
              src={"/folder/study-downloads.png"}
              alt="Fun Break"
              width={200}
              height={200}
              className="object-cover border border-gray-300 bg-white h-full w-full rounded-xl shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
