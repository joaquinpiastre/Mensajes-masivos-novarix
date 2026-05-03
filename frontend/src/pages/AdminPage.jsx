import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    role: "client",
  });

  const load = async () => {
    setError("");
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const patchUser = async (id, payload) => {
    await api.patch(`/admin/users/${id}`, payload);
    load();
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/users", createForm);
      setCreateForm({ name: "", email: "", password: "", companyName: "", role: "client" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear usuario");
    }
  };

  if (loading) return <p className="nx-muted">Cargando administración…</p>;

  return (
    <section className="nx-admin">
      <div className="nx-admin-head">
        <h2>Administración de cuentas</h2>
        <p className="nx-muted">
          Gestioná empresas cliente: alta, rol y estado de la cuenta.
        </p>
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}

      <form className="card nx-admin-create" onSubmit={createUser}>
        <h3>Nueva cuenta empresa</h3>
        <div className="grid-2">
          <input
            required
            placeholder="Nombre contacto"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
          />
          <input
            required
            type="password"
            placeholder="Contraseña inicial"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
          <input
            placeholder="Nombre empresa (opcional)"
            value={createForm.companyName}
            onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
          />
          <select
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
          >
            <option value="client">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button type="submit" className="nx-btn-primary-inline">
          Crear cuenta
        </button>
      </form>

      <div className="card nx-admin-table-wrap">
        <h3>Cuentas</h3>
        <div className="nx-table-scroll">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Empresa / nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.companyName || u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      className="nx-select-inline"
                    >
                      <option value="client">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{u.active ? "Activa" : "Suspendida"}</td>
                  <td>
                    <button
                      type="button"
                      className="nx-btn-ghost-sm"
                      onClick={() => patchUser(u.id, { active: !u.active })}
                    >
                      {u.active ? "Suspender" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
