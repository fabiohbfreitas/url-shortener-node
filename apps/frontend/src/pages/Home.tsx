import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { shortLinksApi } from "../services/api";
import { ShortLinkCard, SkeletonCard } from "../components/ShortLinkCard";
import { CreateLinkForm } from "../components/CreateLinkForm";
import type { ShortLink } from "../components/ShortLinkCard";

const LIMIT = 10;

export function HomePage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ items: ShortLink[]; total: number }>({
    queryKey: ["short-links", page],
    queryFn: () => shortLinksApi.list(page, LIMIT),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => shortLinksApi.remove(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["short-links"] }),
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["short-links"] });
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-muted mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        Recent links
      </div>

      <CreateLinkForm onSuccess={handleCreateSuccess} />

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
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((link) => (
              <ShortLinkCard
                key={link.slug}
                link={link}
                onDelete={(slug) => deleteMutation.mutate(slug)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 font-mono text-2xs text-muted">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 px-5 border border-border text-secondary text-xs font-mono rounded-md cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-9 px-5 border border-border text-secondary text-xs font-mono rounded-md cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
