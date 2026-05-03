import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const from = location.state?.from || "/dashboard";
  const expired = useMemo(() => new URLSearchParams(location.search).get("expired"), [location.search]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo iniciar sesión");
    }
  };

  return (
    <div className="nx-auth-page">
      <div className="nx-auth-brand-top">
        <span className="nx-brand-mark">N</span>
        <span>Novarix Messaging</span>
      </div>
      <div className="nx-auth-card card">
        <h2>Iniciar sesión</h2>
        <p className="nx-muted">Accedé al panel de mensajería Novarix.</p>
        {expired ? <p className="dashboard-error">Tu sesión expiró. Iniciá sesión de nuevo.</p> : null}
        {error ? <p className="dashboard-error">{error}</p> : null}
        <form onSubmit={onSubmit} className="nx-auth-form">
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button type="submit" className="nx-btn-primary-inline">
            Entrar
          </button>
        </form>
        <p className="nx-auth-footer">
          ¿No tenés acceso? Solicitá una cuenta al administrador de tu organización.
        </p>
      </div>
    </div>
  );
}
