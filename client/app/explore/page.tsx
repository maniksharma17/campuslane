"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import ContentGrid from "@/components/content/ContentGrid";
import api from "@/lib/api"; // works in both client + server

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

export default function ExplorePage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await api("/content"); // ✅ our fetch wrapper
        setContents(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("Failed to fetch content:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  return (
    <main className="min-h-screen bg-primary/10 pt-20">
      <Navbar />
      <div className="max-w-full lg:px-20 mx-auto px-4 sm:px-6 px-8 py-8">

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ContentGrid contents={contents} />
        )}
      </div>
    </main>
  );
}
