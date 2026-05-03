import { useQuery } from "@tanstack/react-query";
import { shortLinksApi } from "../services/api";
import { ShortLinkCard, SkeletonCard } from "../components/ShortLinkCard";
import type { ShortLink } from "../components/ShortLinkCard";

export function HomePage() {
  const { data, isLoading, error, refetch } = useQuery<{ items: ShortLink[] }>({
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
          {data.items.map((link) => (
            <ShortLinkCard key={link.slug} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
