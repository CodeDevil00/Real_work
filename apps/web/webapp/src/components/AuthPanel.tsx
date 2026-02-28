import type { User } from "../types/app";

type AuthMode = "login" | "register";

type AuthForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

type Props = {
  isLoggedIn: boolean;
  user: User | null;
  authMode: AuthMode;
  authForm: AuthForm;
  isAuthSubmitting: boolean;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthFormChange: (field: keyof AuthForm, value: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
  onRefreshProfile: () => void;
};

export default function AuthPanel({
  isLoggedIn,
  user,
  authMode,
  authForm,
  isAuthSubmitting,
  onAuthModeChange,
  onAuthFormChange,
  onSubmit,
  onLogout,
  onRefreshProfile,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Auth</h2>
        {isLoggedIn ? (
          <button className="ghost" onClick={onLogout}>
            Logout
          </button>
        ) : null}
      </div>

      {!isLoggedIn ? (
        <div className="stack">
          <div className="auth-switch">
            <button
              className={authMode === "login" ? "tab active" : "tab"}
              onClick={() => onAuthModeChange("login")}
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "tab active" : "tab"}
              onClick={() => onAuthModeChange("register")}
            >
              Register
            </button>
          </div>

          {authMode === "register" ? (
            <>
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) => onAuthFormChange("name", event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label>
                Phone
                <input
                  value={authForm.phone}
                  onChange={(event) => onAuthFormChange("phone", event.target.value)}
                  placeholder="9999999999"
                />
              </label>
            </>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => onAuthFormChange("email", event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => onAuthFormChange("password", event.target.value)}
            />
          </label>
          <button onClick={onSubmit} disabled={isAuthSubmitting}>
            {isAuthSubmitting
              ? "Submitting..."
              : authMode === "login"
              ? "Login"
              : "Create account"}
          </button>
        </div>
      ) : (
        <div className="stack">
          <p className="chip">
            {user?.name || user?.email} ({user?.role || "user"})
          </p>
          <button className="ghost" onClick={onRefreshProfile}>
            Refresh profile
          </button>
        </div>
      )}
    </section>
  );
}
