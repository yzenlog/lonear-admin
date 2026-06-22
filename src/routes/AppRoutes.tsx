import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import LoginPage from "../pages/auth/LoginPage";
import { moduleRoutes } from "../config/modules";
import { AdminPageRoute } from "./adminPages";
import { clearAuthSession, getInitialAuthState, persistAuthSession } from "../services/session";
import { getLoginRedirectPath, getProtectedLoginPath, moduleRouteEntries } from "../utils/navigation";

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);
  const [loginEmail, setLoginEmail] = useState("admin@acme.local");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("企业账号受保护，登录后进入当前工作区。");
  const currentPath = `${location.pathname}${location.search}`;

  function updateLoginEmail(value: string) {
    setLoginEmail(value);
    setLoginError("");
    setLoginMessage("企业账号受保护，登录后进入当前工作区。");
  }

  function updateLoginPassword(value: string) {
    setLoginPassword(value);
    setLoginError("");
    setLoginMessage("企业账号受保护，登录后进入当前工作区。");
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = loginEmail.trim();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const hasValidPassword = loginPassword.trim().length >= 6;

    if (!hasValidEmail || !hasValidPassword) {
      setLoginError("请输入有效邮箱和至少 6 位密码");
      setLoginMessage("");
      return;
    }

    setLoginError("");
    setLoginStatus("loading");

    window.setTimeout(() => {
      persistAuthSession(rememberSession);
      setLoginStatus("idle");
      setIsAuthenticated(true);
      navigate(getLoginRedirectPath(location.state, location.search), { replace: true });
    }, 520);
  }

  function handleRecovery() {
    setLoginError("");
    setLoginMessage("请联系系统管理员重置密码");
  }

  function handleLogout() {
    clearAuthSession();
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }

  const loginPage = (
    <LoginPage
      email={loginEmail}
      password={loginPassword}
      rememberSession={rememberSession}
      showPassword={showPassword}
      status={loginStatus}
      error={loginError}
      message={loginMessage}
      onEmailChange={updateLoginEmail}
      onPasswordChange={updateLoginPassword}
      onRememberChange={(checked) => setRememberSession(checked)}
      onTogglePassword={() => setShowPassword((visible) => !visible)}
      onRecoveryClick={handleRecovery}
      onSubmit={handleLogin}
    />
  );
  const loginRedirect = <Navigate to={getProtectedLoginPath(currentPath)} state={{ from: currentPath }} replace />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? moduleRoutes.dashboard : "/login"} replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={getLoginRedirectPath(location.state, location.search)} replace /> : loginPage
        }
      />
      <Route element={isAuthenticated ? <AdminLayout onLogout={handleLogout} /> : loginRedirect}>
        {moduleRouteEntries.map(([id, routePath]) => (
          <Route key={id} path={routePath} element={<AdminPageRoute moduleId={id} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? moduleRoutes.dashboard : "/login"} replace />} />
    </Routes>
  );
}

export default AppRoutes;
