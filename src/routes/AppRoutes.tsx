import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, login, logout } from "../api/auth";
import AdminLayout from "../layouts/AdminLayout";
import LoginPage from "../pages/auth/LoginPage";
import type { ThemeMode } from "../config/app";
import { moduleRoutes } from "../config/modules";
import { AdminPageRoute } from "./adminPages";
import {
  clearAuthSession,
  getInitialCurrentUser,
  getInitialAuthState,
  getInitialThemeMode,
  getInitialUiSettings,
  persistAuthSession,
  syncThemeMode,
} from "../services/session";
import { persistApiTokens } from "../services/apiTokens";
import { getLoginRedirectPath, getProtectedLoginPath, moduleRouteEntries } from "../utils/navigation";

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);
  const [currentUser, setCurrentUser] = useState(getInitialCurrentUser);
  const [loginEmail, setLoginEmail] = useState("admin@acme.local");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("企业账号受保护，登录后进入当前工作区。");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const currentPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    syncThemeMode(themeMode, getInitialUiSettings().accentColor);
  }, [themeMode]);

  useEffect(() => {
    if (!isAuthenticated || currentUser) {
      return;
    }

    let ignore = false;

    void getCurrentUser()
      .then((user) => {
        if (ignore) {
          return;
        }

        persistAuthSession(rememberSession, user);
        setCurrentUser(user);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        clearAuthSession();
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      });

    return () => {
      ignore = true;
    };
  }, [currentUser, isAuthenticated, navigate, rememberSession]);

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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loginStatus === "loading") {
      return;
    }

    const normalizedEmail = loginEmail.trim();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const hasValidPassword = loginPassword.trim().length >= 6;

    if (!hasValidEmail || !hasValidPassword) {
      setLoginError("请输入有效邮箱和至少 6 位密码");
      setLoginMessage("");
      return;
    }

    setLoginError("");
    setLoginMessage("正在验证账号...");
    setLoginStatus("loading");

    try {
      const loginResult = await login({
        email: normalizedEmail,
        password: loginPassword,
        rememberSession,
      });

      persistApiTokens(loginResult.accessToken, loginResult.refreshToken, rememberSession);

      const user = await getCurrentUser();

      persistAuthSession(rememberSession, user);
      setCurrentUser(user);
      setIsAuthenticated(true);
      navigate(getLoginRedirectPath(location.state, location.search), { replace: true });
    } catch (error) {
      clearAuthSession();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setLoginError(error instanceof Error ? error.message : "登录失败，请稍后重试");
      setLoginMessage("");
    } finally {
      setLoginStatus("idle");
    }
  }

  function handleRecovery() {
    setLoginError("");
    setLoginMessage("请联系系统管理员重置密码");
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearAuthSession();
      setCurrentUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
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
      themeMode={themeMode}
      onEmailChange={updateLoginEmail}
      onPasswordChange={updateLoginPassword}
      onRememberChange={(checked) => setRememberSession(checked)}
      onTogglePassword={() => setShowPassword((visible) => !visible)}
      onThemeModeToggle={() => setThemeMode((mode) => (mode === "dark" ? "light" : "dark"))}
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
      <Route
        element={
          isAuthenticated ? (
            <AdminLayout
              currentUser={currentUser}
              themeMode={themeMode}
              onThemeModeChange={setThemeMode}
              onLogout={handleLogout}
            />
          ) : (
            loginRedirect
          )
        }
      >
        {moduleRouteEntries.map(([id, routePath]) => (
          <Route key={id} path={routePath} element={<AdminPageRoute moduleId={id} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? moduleRoutes.dashboard : "/login"} replace />} />
    </Routes>
  );
}

export default AppRoutes;
