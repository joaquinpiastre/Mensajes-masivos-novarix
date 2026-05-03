import { useEffect, useState } from "react";
import api from "../services/api";

const EMPTY_FORM = { phoneNumberId: "", accessToken: "", verifyToken: "" };

export default function WhatsappConfigPage() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Hola! Este es un mensaje de prueba.");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [error, setError] = useState("");

  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "");

  const loadConfig = async () => {
    try {
      const { data } = await api.get("/whatsapp/config");
      setConfig(data);
    } catch {
      setConfig(null);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      await api.post("/whatsapp/config", form);
      setSaveMsg("Configuracion guardada correctamente.");
      setForm(EMPTY_FORM);
      loadConfig();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar la configuracion.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestMsg("");
    setError("");
    try {
      const { data } = await api.post("/whatsapp/test", { phone: testPhone, message: testMessage });
      setTestMsg(`Mensaje enviado. ID: ${data.messageId || "ok"}`);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el mensaje de prueba.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <section>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Configuracion de WhatsApp</h2>
        <p style={{ color: "var(--nx-muted, #888)", marginTop: "0.25rem" }}>
          Cada empresa conecta su propia cuenta de WhatsApp Business. Las credenciales se guardan de forma segura y son exclusivas de tu cuenta.
        </p>
      </div>

      {/* Estado actual */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Estado de conexion</h3>
        {config ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
            <span className="status-tag status-sent" style={{ display: "inline-block", width: "fit-content" }}>
              Conectado
            </span>
            <p><strong>Phone Number ID:</strong> {config.phoneNumberId}</p>
            <p><strong>Access Token:</strong> {config.accessToken}</p>
            <p><strong>Verify Token:</strong> {config.verifyToken}</p>
            <p style={{ color: "var(--nx-muted, #888)", fontSize: "0.85rem" }}>
              Ultima actualización: {new Date(config.updatedAt).toLocaleString("es-AR")}
            </p>
            <hr />
            <p style={{ fontSize: "0.85rem" }}>
              <strong>URL del webhook para Meta:</strong>{" "}
              <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>
                {backendUrl}/webhook
              </code>
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--nx-muted, #888)" }}>
              Usá tu Verify Token al registrar el webhook en Meta for Developers.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "0.75rem" }}>
            <span className="status-tag status-failed" style={{ display: "inline-block", width: "fit-content" }}>
              No configurado
            </span>
            <p style={{ marginTop: "0.5rem", color: "var(--nx-muted, #888)" }}>
              Completa el formulario de abajo para conectar tu cuenta de WhatsApp Business.
            </p>
          </div>
        )}
      </div>

      {/* Formulario de credenciales */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>{config ? "Actualizar credenciales" : "Conectar WhatsApp Business"}</h3>
        <p style={{ color: "var(--nx-muted, #888)", fontSize: "0.875rem", margin: "0.5rem 0 1rem" }}>
          Obtene estos datos en{" "}
          <strong>Meta for Developers → Tu App → WhatsApp → Configuracion de API</strong>.
        </p>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Phone Number ID
            </label>
            <input
              required
              value={form.phoneNumberId}
              onChange={set("phoneNumberId")}
              placeholder="123456789012345"
              style={{ width: "100%" }}
            />
            <small style={{ color: "var(--nx-muted, #888)" }}>
              El ID numerico del numero registrado en Meta (no el numero de telefono).
            </small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Access Token
            </label>
            <input
              required
              type="password"
              value={form.accessToken}
              onChange={set("accessToken")}
              placeholder="EAAxxxxxxxxxxxxxxx"
              style={{ width: "100%" }}
            />
            <small style={{ color: "var(--nx-muted, #888)" }}>
              Token temporal (24hs) para pruebas o System User Token para produccion.
            </small>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
              Verify Token (webhook)
            </label>
            <input
              required
              value={form.verifyToken}
              onChange={set("verifyToken")}
              placeholder="mi_token_secreto_unico"
              style={{ width: "100%" }}
            />
            <small style={{ color: "var(--nx-muted, #888)" }}>
              Un string secreto que vos defines. Lo usas al registrar el webhook en Meta.
            </small>
          </div>

          {saveMsg && <p style={{ color: "green" }}>{saveMsg}</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" disabled={saving} style={{ alignSelf: "flex-start" }}>
            {saving ? "Guardando..." : "Guardar configuracion"}
          </button>
        </form>
      </div>

      {/* Test de envio */}
      {config && (
        <div className="card">
          <h3>Enviar mensaje de prueba</h3>
          <p style={{ color: "var(--nx-muted, #888)", fontSize: "0.875rem", margin: "0.5rem 0 1rem" }}>
            Verifica que la conexion funciona enviando un mensaje a tu propio numero.
          </p>
          <form onSubmit={handleTest} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                Numero de telefono destino
              </label>
              <input
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5491112345678"
                style={{ width: "100%" }}
              />
              <small style={{ color: "var(--nx-muted, #888)" }}>Formato: codigo de pais + numero (sin +).</small>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
                Mensaje de prueba
              </label>
              <textarea
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                style={{ width: "100%" }}
              />
            </div>

            {testMsg && <p style={{ color: "green" }}>{testMsg}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <button type="submit" disabled={testing} style={{ alignSelf: "flex-start" }}>
              {testing ? "Enviando..." : "Enviar prueba"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
