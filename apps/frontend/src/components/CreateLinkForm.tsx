import { useState } from "react";
import { shortLinksApi } from "../services/api";

export function CreateLinkForm({ onSuccess }: { onSuccess: () => void }) {
  const [url, setUrl] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setIsPending(true);
    setError("");
    try {
      await shortLinksApi.create(url);
      setUrl("");
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          required
          placeholder="https://example.com/your-long-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 h-[52px] bg-surface border border-border rounded-md px-5 text-sm font-mono text-primary placeholder:text-muted outline-none focus:border-border-strong transition-colors duration-[120ms] ease-[var(--ease-expo)]"
        />
        <button
          type="submit"
          disabled={isPending || !url}
          className="h-[52px] px-5 bg-primary text-bg text-xs font-mono font-medium tracking-wide rounded-md cursor-pointer transition-opacity duration-[120ms] hover:opacity-[0.88] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Shortening…" : "Shorten"}
        </button>
      </form>
      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </div>
  );
}
