import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import "./LoginPage.css";

export type LoginPageProps = {
  email: string;
  password: string;
  rememberSession: boolean;
  showPassword: boolean;
  status: "idle" | "loading";
  error: string;
  message: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (checked: boolean) => void;
  onTogglePassword: () => void;
  onRecoveryClick: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function LoginPage({
  email,
  password,
  rememberSession,
  showPassword,
  status,
  error,
  message,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onRecoveryClick,
  onSubmit,
}: LoginPageProps) {
  const isLoading = status === "loading";
  const hasError = Boolean(error);

  return (
    <main className="login-page">
      <section className="login-card" aria-label="登录表单">
        <header className="login-header">
          <div className="login-brand">
            <span className="login-logo" aria-hidden="true">
              <img src="/logo.png" alt="" />
            </span>
            <span>
              <strong>Acme Admin</strong>
              <span>管理后台</span>
            </span>
          </div>

          <div className="login-copy">
            <h1>登录工作台</h1>
            <p>使用管理员账号继续进入 Acme Admin。</p>
          </div>
        </header>

        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email">邮箱</label>
            <span className={`login-input ${hasError ? "error" : ""}`}>
              <Mail size={16} strokeWidth={2.1} />
              <input
                id="login-email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                type="email"
                placeholder="admin@acme.local"
                autoComplete="username"
                aria-invalid={hasError}
                aria-describedby="login-message"
              />
            </span>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">密码</label>
            <span className={`login-input ${hasError ? "error" : ""}`}>
              <LockKeyhole size={16} strokeWidth={2.1} />
              <input
                id="login-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="输入密码"
                autoComplete="current-password"
                aria-invalid={hasError}
                aria-describedby="login-message"
              />
              <button
                className="login-input-action"
                type="button"
                onClick={onTogglePassword}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? <EyeOff size={15} strokeWidth={2.1} /> : <Eye size={15} strokeWidth={2.1} />}
              </button>
            </span>
          </div>

          <div className="login-options">
            <label className="login-check">
              <input
                checked={rememberSession}
                onChange={(event) => onRememberChange(event.target.checked)}
                type="checkbox"
              />
              <span>保持登录</span>
            </label>
            <button className="login-link" type="button" onClick={onRecoveryClick}>
              忘记密码
            </button>
          </div>

          <p
            className={`login-message ${hasError ? "error" : ""}`}
            id="login-message"
            role={hasError ? "alert" : "status"}
            aria-live="polite"
          >
            {hasError ? error : message}
          </p>

          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="spin" size={15} strokeWidth={2.2} /> : <ArrowRight size={15} strokeWidth={2.4} />}
            {isLoading ? "登录中..." : "登录"}
          </button>
        </form>

        <footer className="login-footer-note">
          <ShieldCheck size={14} strokeWidth={2.1} />
          <span>可在系统设置中启用单点登录与二次验证</span>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;
