import { Link, useNavigate } from "react-router";
import { useAuth } from "../stores/auth";

export function Nav() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="border-b border-border py-5">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm font-medium text-primary">
          <span className="w-2 h-2 rounded-full bg-accent" />
          shrt
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="font-mono text-xs text-secondary">{user.email}</span>
              <button
                onClick={handleLogout}
                className="h-9 px-5 border border-border text-secondary text-xs font-mono rounded-md transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="h-9 px-5 border border-border text-secondary text-xs font-mono rounded-md transition-colors duration-[120ms] ease-[var(--ease-expo)] hover:border-border-strong hover:text-primary inline-flex items-center"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
