import { useEffect, useState } from "react";
import api from "../services/api";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: "", body: "", variables: [] });

  useEffect(() => {
    api.get("/templates").then(({ data }) => setTemplates(data));
  }, []);

  const loadTemplates = async () => {
    const { data } = await api.get("/templates");
    setTemplates(data);
  };

  const create = async (event) => {
    event.preventDefault();
    await api.post("/templates", form);
    setForm({ name: "", body: "", variables: [] });
    loadTemplates();
  };

  return (
    <section>
      <form className="card" onSubmit={create}>
        <h2>Templates</h2>
        <input value={form.name} placeholder="Nombre" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea value={form.body} placeholder="Cuerpo" onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <button type="submit">Guardar template</button>
      </form>
      <div className="card">
        <ul>{templates.map((t) => <li key={t.id}>{t.name} - {t.status}</li>)}</ul>
      </div>
    </section>
  );
}
