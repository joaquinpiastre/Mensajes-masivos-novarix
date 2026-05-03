import { useEffect, useState } from "react";
import MessagePreview from "./MessagePreview";
import api from "../services/api";

export default function CampaignWizard({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    message: "",
    mode: "manual",
    channel: "internal",
    audienceRules: {
      groups: [],
      tags: [],
      optInOnly: true,
      search: "",
    },
  });
  const [groups, setGroups] = useState([]);
  const [tags, setTags] = useState([]);
  const [audience, setAudience] = useState({ total: 0, sample: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFilters = async () => {
      const [groupsRes, tagsRes] = await Promise.all([
        api.get("/contacts/groups"),
        api.get("/contacts/tags"),
      ]);
      setGroups(groupsRes.data || []);
      setTags(tagsRes.data || []);
    };
    loadFilters();
  }, []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (field, value) => {
    setForm((prev) => {
      const prevValues = prev.audienceRules[field] || [];
      const exists = prevValues.includes(value);
      return {
        ...prev,
        audienceRules: {
          ...prev.audienceRules,
          [field]: exists ? prevValues.filter((item) => item !== value) : [...prevValues, value],
        },
      };
    });
  };

  const previewAudience = async () => {
    const { data } = await api.post("/campaigns/audience/preview", form.audienceRules);
    setAudience(data);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.message.includes("{{nombre}}")) {
      setError("Te recomendamos incluir {{nombre}} para personalizar el mensaje.");
      return;
    }
    await onSubmit(form);
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Nueva campana</h2>
      <input name="name" placeholder="Nombre de campana" onChange={update} />
      <textarea
        name="message"
        placeholder="Mensaje (usar {{nombre}} para variable)"
        onChange={update}
      />
      <select name="mode" value={form.mode} onChange={update}>
        <option value="manual">Manual</option>
        <option value="automatic">Automatico</option>
      </select>
      <select name="channel" value={form.channel} onChange={update}>
        <option value="internal">Canal interno</option>
        <option value="meta_api">Meta API (opcional)</option>
      </select>

      <h3>Segmentacion de audiencia</h3>
      <p>Selecciona grupos/tags para decidir a quien se enviara.</p>
      <div className="grid-2">
        <div>
          <strong>Grupos</strong>
          {groups.length ? groups.map((group) => (
            <label key={group} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={form.audienceRules.groups.includes(group)}
                onChange={() => toggleArrayItem("groups", group)}
              />
              {group}
            </label>
          )) : <p>No hay grupos.</p>}
        </div>
        <div>
          <strong>Tags</strong>
          {tags.length ? tags.map((tag) => (
            <label key={tag} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={form.audienceRules.tags.includes(tag)}
                onChange={() => toggleArrayItem("tags", tag)}
              />
              {tag}
            </label>
          )) : <p>No hay tags.</p>}
        </div>
      </div>
      <input
        placeholder="Buscar por nombre o telefono"
        value={form.audienceRules.search}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            audienceRules: { ...prev.audienceRules, search: event.target.value },
          }))
        }
      />
      <label>
        <input
          type="checkbox"
          checked={form.audienceRules.optInOnly}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              audienceRules: { ...prev.audienceRules, optInOnly: event.target.checked },
            }))
          }
        />
        Solo contactos con opt-in
      </label>
      <button type="button" onClick={previewAudience}>Calcular audiencia</button>
      <p>Alcance estimado: {audience.total || 0}</p>
      <button type="submit">Guardar campana</button>
      {error ? <p className="dashboard-error">{error}</p> : null}
      <MessagePreview message={form.message} />
    </form>
  );
}
