import { useEffect, useState } from "react";
import api from "../services/api";
import ContactImporter from "../components/ContactImporter";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", group: "" });
  const [filters, setFilters] = useState({ search: "", group: "" });

  useEffect(() => {
    loadContacts();
  }, [filters]);

  const loadContacts = async () => {
    const { data } = await api.get("/contacts", { params: filters });
    setContacts(data);
  };

  const create = async (event) => {
    event.preventDefault();
    await api.post("/contacts", form);
    setForm({ name: "", phone: "", group: "" });
    loadContacts();
  };

  return (
    <section>
      <form className="card" onSubmit={create}>
        <h2>Contactos</h2>
        <input value={form.name} placeholder="Nombre" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input value={form.phone} placeholder="Telefono" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input value={form.group} placeholder="Grupo" onChange={(e) => setForm({ ...form, group: e.target.value })} />
        <button type="submit">Agregar contacto</button>
      </form>
      <div className="card">
        <h3>Filtros</h3>
        <input
          placeholder="Buscar por nombre o telefono"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
        <input
          placeholder="Filtrar por grupo"
          value={filters.group}
          onChange={(e) => setFilters((prev) => ({ ...prev, group: e.target.value }))}
        />
      </div>
      <ContactImporter onImported={loadContacts} />
      <div className="card">
        <ul>{contacts.map((c) => <li key={c.id}>{c.name} - {c.phone} - {c.group || "Sin grupo"}</li>)}</ul>
      </div>
    </section>
  );
}
