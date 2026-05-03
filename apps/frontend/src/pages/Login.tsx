import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../stores/auth";

type Step = "email" | "code";

export function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const user = useAuth((s) => s.user);
  const isInitialized = useAuth((s) => s.isInitialized);
  const login = useAuth((s) => s.login);
  const verify = useAuth((s) => s.verify);
  const isLoading = useAuth((s) => s.isLoading);
  const navigate = useNavigate();

  if (!isInitialized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSendCode = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    try {
      await login(email);
      setStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError("");
    try {
      await verify(email, code);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-2 font-mono text-sm font-medium text-primary mb-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          shrt
        </div>

        {step === "email" ? (
          <>
            <h1 className="font-display text-xl text-primary mb-1">Sign in</h1>
            <p className="text-xs text-secondary mb-6">
              Enter your email to receive a verification code.
            </p>

            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[52px] w-full bg-surface border border-border rounded-md px-5 text-sm font-mono text-primary placeholder:text-muted outline-none focus:border-border-strong transition-colors duration-[120ms] ease-[var(--ease-expo)]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-primary text-bg text-xs font-mono font-medium tracking-wide rounded-md transition-opacity duration-[120ms] hover:opacity-[0.88] disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send code →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl text-primary mb-1">Enter code</h1>
            <p className="text-xs text-secondary mb-1">
              Code sent to <span className="text-primary">{email}</span>
            </p>
            <p className="text-2xs text-muted font-mono uppercase tracking-widest mb-5">
              Check your backend console for the 6-digit code
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-[52px] w-full bg-surface border border-border rounded-md px-5 text-sm font-mono text-primary placeholder:text-muted text-center tracking-[0.3em] outline-none focus:border-border-strong transition-colors duration-[120ms] ease-[var(--ease-expo)]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-primary text-bg text-xs font-mono font-medium tracking-wide rounded-md transition-opacity duration-[120ms] hover:opacity-[0.88] disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Sign in →"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="h-9 w-full border border-border text-secondary text-xs font-mono rounded-md transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary"
              >
                ← Back
              </button>
            </form>
          </>
        )}

        {error && <p className="text-danger text-xs mt-3">{error}</p>}
      </div>
    </div>
  );
}
