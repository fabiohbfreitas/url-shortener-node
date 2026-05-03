import { useState } from "react";
import { BASE } from "../services/api";

export type ShortLink = {
  slug: string;
  originalUrl: string;
  createdAt: string;
  visits: number;
};

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export function ShortLinkCard({
  link,
  onDelete,
}: {
  link: ShortLink;
  onDelete: (slug: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const shortUrl = `${BASE}/${link.slug}`;

  return (
    <div className="group bg-surface border border-border rounded-lg p-5 flex justify-between gap-3 transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:bg-raised hover:border-border-strong">
      <div className="min-w-0">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-md font-medium text-primary font-mono hover:text-accent transition-colors duration-[120ms]"
        >
          {shortUrl}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <p className="text-xs text-secondary font-mono truncate mt-0.5">{link.originalUrl}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-2xs text-muted">{timeAgo(link.createdAt)}</span>
          <span className="text-2xs text-muted">· {link.visits} clicks</span>
        </div>
      </div>
      <div className="flex items-start shrink-0">
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-danger font-mono">Are you sure?</span>
            <button
              onClick={() => {
                onDelete(link.slug);
              }}
              className="h-9 px-3 border border-danger/30 text-danger text-2xs font-mono font-medium tracking-wide rounded-md cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:bg-danger/10"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="h-9 px-3 border border-border text-secondary text-2xs font-mono rounded-md cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="h-9 px-3 border border-border text-danger text-2xs font-mono rounded-md cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-expo)] opacity-0 group-hover:opacity-100 hover:border-danger/50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
      <div className="h-5 w-48 bg-raised rounded mb-2" />
      <div className="h-4 w-72 bg-raised rounded mb-3" />
      <div className="flex gap-4">
        <div className="h-3 w-20 bg-raised rounded" />
        <div className="h-3 w-24 bg-raised rounded" />
      </div>
    </div>
  );
}
