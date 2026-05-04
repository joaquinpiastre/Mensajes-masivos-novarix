import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const emptyDraft = {
  name: "",
  email: "",
  companyName: "",
  role: "client",
  active: true,
  credits: 0,
  newPassword: "",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
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

  const openEdit = (u) => {
    setEditing(u.id);
    setDraft({
      name: u.name || "",
      email: u.email || "",
      companyName: u.companyName || "",
      role: u.role || "client",
      active: Boolean(u.active),
      credits: Number(u.credits) || 0,
      newPassword: "",
    });
    setError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setDraft(emptyDraft);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: draft.name.trim(),
        email: draft.email.trim(),
        companyName: draft.companyName.trim() || null,
        role: draft.role,
        active: draft.active,
        credits: draft.credits,
      };
      if (draft.newPassword.trim()) {
        payload.newPassword = draft.newPassword.trim();
      }
      await api.patch(`/admin/users/${editing}`, payload);
      closeEdit();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const patchUser = async (id, payload) => {
    setError("");
    try {
      await api.patch(`/admin/users/${id}`, payload);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Error al actualizar");
    }
  };

  const deleteUser = async (id, label) => {
    if (id === user?.id) return;
    if (!window.confirm(`¿Eliminar definitivamente la cuenta ${label}? Se borran campañas, contactos y datos asociados.`)) {
      return;
    }
    setError("");
    try {
      await api.delete(`/admin/users/${id}`);
      if (editing === id) closeEdit();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo eliminar");
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/users", createForm);
      setCreateForm({ name: "", email: "", password: "", companyName: "", role: "client" });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear usuario");
    }
  };

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <section className="nx-admin">
        <p className="nx-muted nx-admin-loading">Cargando administración…</p>
      </section>
    );
  }

  const editingRow = editing ? users.find((u) => u.id === editing) : null;

  return (
    <section className="nx-admin">
      <div className="nx-admin-head">
        <h2>Administración</h2>
        <p className="nx-muted">
          Editá datos de cuenta, créditos, contraseña, rol y estado. Podés suspender o eliminar usuarios.
        </p>
      </div>

      {error ? <p className="dashboard-error nx-admin-banner">{error}</p> : null}

      <form className="card nx-admin-create nx-surface" onSubmit={createUser}>
        <h3>Nueva cuenta</h3>
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

      <div className="card nx-admin-table-wrap nx-surface">
        <h3>Usuarios ({users.length})</h3>
        <div className="nx-table-scroll">
          <table className="nx-table nx-table-dark">
            <thead>
              <tr>
                <th>Nombre / empresa</th>
                <th>Email</th>
                <th>Créditos</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Alta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.companyName ? <div className="nx-cell-sub">{u.companyName}</div> : null}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.credits ?? 0}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      className="nx-select-inline"
                      disabled={u.id === user?.id}
                    >
                      <option value="client">Cliente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`nx-pill ${u.active ? "nx-pill-ok" : "nx-pill-off"}`}>
                      {u.active ? "Activa" : "Suspendida"}
                    </span>
                  </td>
                  <td className="nx-cell-muted">{formatDate(u.createdAt)}</td>
                  <td className="nx-admin-actions">
                    <button type="button" className="nx-btn-ghost-table" onClick={() => openEdit(u)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="nx-btn-ghost-table"
                      onClick={() => patchUser(u.id, { active: !u.active })}
                      disabled={u.id === user?.id}
                    >
                      {u.active ? "Dar de baja" : "Reactivar"}
                    </button>
                    <button
                      type="button"
                      className="nx-btn-danger-table"
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={u.id === user?.id}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingRow ? (
        <div className="nx-modal-overlay" role="presentation" onClick={closeEdit}>
          <div
            className="nx-modal card nx-surface"
            role="dialog"
            aria-labelledby="nx-admin-edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nx-modal-head">
              <h3 id="nx-admin-edit-title">Editar usuario</h3>
              <button type="button" className="nx-modal-close" onClick={closeEdit} aria-label="Cerrar">
                ×
              </button>
            </div>
            <p className="nx-muted nx-modal-email">{editingRow.email}</p>
            <div className="nx-modal-grid">
              <label>
                Nombre
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </label>
              <label className="nx-modal-span2">
                Empresa (opcional)
                <input
                  value={draft.companyName}
                  onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                />
              </label>
              <label>
                Créditos
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={draft.credits}
                  onChange={(e) => setDraft({ ...draft, credits: Number(e.target.value) })}
                />
              </label>
              <label>
                Rol
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  disabled={editingRow.id === user?.id}
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label className="nx-modal-span2">
                Nueva contraseña (opcional)
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Dejar vacío para no cambiar"
                  value={draft.newPassword}
                  onChange={(e) => setDraft({ ...draft, newPassword: e.target.value })}
                />
              </label>
              <label className="nx-modal-check nx-modal-span2">
                <input
                  type="checkbox"
                  className="nx-checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  disabled={editingRow.id === user?.id}
                />
                <span>Cuenta activa</span>
              </label>
            </div>
            <div className="nx-modal-footer">
              <button type="button" className="nx-btn-secondary-inline" onClick={closeEdit}>
                Cancelar
              </button>
              <button type="button" className="nx-btn-primary-inline" onClick={saveEdit} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
