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

export function ShortLinkCard({ link }: { link: ShortLink }) {
  const shortUrl = `${BASE}/${link.slug}`;

  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex justify-between gap-3 transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:bg-raised hover:border-border-strong">
      <div className="min-w-0">
        <p className="text-md font-medium text-primary font-mono">{shortUrl}</p>
        <p className="text-xs text-secondary font-mono truncate mt-0.5">{link.originalUrl}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-2xs text-muted">{timeAgo(link.createdAt)}</span>
          <span className="text-2xs text-muted">· {link.visits} clicks</span>
        </div>
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
