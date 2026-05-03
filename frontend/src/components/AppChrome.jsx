import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout, useAuth } from "../hooks/useAuth";

export default function AppChrome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell nx-app">
      <header className="nx-app-header">
        <div className="nx-app-header-inner">
          <Link to="/dashboard" className="nx-brand">
            <span className="nx-brand-mark">N</span>
            <span>
              Novarix <small>Messaging</small>
            </span>
          </Link>
          <nav className="nx-app-nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/contacts">Contactos</Link>
            <Link to="/campaigns">Campañas</Link>
            <Link to="/templates">Templates</Link>
            <Link to="/whatsapp">WhatsApp</Link>
            {user?.role === "admin" ? <Link to="/admin">Administración</Link> : null}
          </nav>
          <div className="nx-app-user">
            <span className="nx-user-label">
              {user?.companyName || user?.name || "Cuenta"}
            </span>
            <button type="button" className="nx-btn-ghost-sm" onClick={onLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="main-content nx-main">
        <Outlet />
      </main>
    </div>
  );
}
