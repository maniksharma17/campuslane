// components/content/ContentGrid.tsx
import React from "react";
import ContentCard from "./ContentCard";

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

export default function ContentGrid({ contents }: { contents: ContentItem[] }) {
  if (!contents || contents.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">No content available yet.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {contents.map((c) => (
        <ContentCard key={c._id} content={c} />
      ))}
    </div>
  );
}
