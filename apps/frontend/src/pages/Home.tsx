import { useQuery } from "@tanstack/react-query";
import { shortLinksApi } from "../services/api";

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function SkeletonCard() {
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

export function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["short-links"],
    queryFn: () => shortLinksApi.list(),
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-muted mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        Recent links
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="text-danger text-xs">
          Failed to load links: {(error as Error).message}
          <button
            onClick={() => refetch()}
            className="ml-3 underline underline-offset-2 hover:text-primary transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && data && data.items.length === 0 && (
        <p className="text-secondary text-sm">No links yet.</p>
      )}

      {!isLoading && !error && data && data.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.items.map(
            (link: { slug: string; originalUrl: string; createdAt: string; visits: number }) => (
              <div
                key={link.slug}
                className="bg-surface border border-border rounded-lg p-5 flex justify-between gap-3 transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:bg-raised hover:border-border-strong"
              >
                <div className="min-w-0">
                  <p className="text-md font-medium text-primary font-mono">
                    {window.location.origin.replace(":5173", ":3000")}/{link.slug}
                  </p>
                  <p className="text-xs text-secondary font-mono truncate mt-0.5">
                    {link.originalUrl}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-2xs text-muted">{timeAgo(link.createdAt)}</span>
                    <span className="text-2xs text-muted">· {link.visits} clicks</span>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
