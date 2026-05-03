import { useState } from "react";
import api from "../services/api";

export default function ContactImporter({ onImported }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState({ name: "", phone: "", group: "", tags: "" });
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onFileChange = async (event) => {
    const selected = event.target.files?.[0];
    setError("");
    setFile(selected || null);
    setPreview(null);
    setResult(null);
    if (!selected) return setStep(1);

    const formData = new FormData();
    formData.append("file", selected);
    try {
      setLoading(true);
      const { data } = await api.post("/contacts/import/preview", formData);
      setPreview(data);
      setMapping({
        name: data.sourceKeys?.name || "",
        phone: data.sourceKeys?.phone || "",
        group: data.sourceKeys?.group || "",
        tags: data.sourceKeys?.tags || "",
      });
      setStep(2);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "No se pudo leer el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const runPreview = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/contacts/import/preview", formData);
      setPreview(data);
      setStep(3);
    } catch (previewError) {
      setError(previewError.response?.data?.message || "No se pudo validar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/contacts/import", formData);
      setResult(data);
      onImported();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "No se pudo importar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Importador profesional de contactos</h3>
      <p>Paso {step} de 3</p>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} />
      {error ? <p className="dashboard-error">{error}</p> : null}

      {step >= 2 && preview ? (
        <>
          <h4>Mapeo de columnas</h4>
          <div className="grid-2">
            {["name", "phone", "group", "tags"].map((target) => (
              <label key={target}>
                {target}
                <select
                  value={mapping[target] || ""}
                  onChange={(event) =>
                    setMapping((prev) => ({ ...prev, [target]: event.target.value }))
                  }
                >
                  <option value="">Sin mapear</option>
                  {preview.columnsDetected?.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {step === 2 ? (
            <button onClick={runPreview} disabled={loading}>
              {loading ? "Validando..." : "Validar importacion"}
            </button>
          ) : null}
        </>
      ) : null}

      {step === 3 && preview ? (
        <>
          <h4>Resumen de validacion</h4>
          <p>
            Filas: {preview.totalRows} | Validas: {preview.validRows} | Invalidas:{" "}
            {preview.invalidRows}
          </p>
          <ul>
            {preview.preview?.slice(0, 8).map((row) => (
              <li key={row.rowNumber}>
                Fila {row.rowNumber}: {row.data.name || "Sin nombre"} - {row.data.phone || "-"}{" "}
                {row.errors.length ? `(${row.errors.join(", ")})` : ""}
              </li>
            ))}
          </ul>
          <button onClick={onUpload} disabled={loading}>
            {loading ? "Importando..." : "Confirmar importacion"}
          </button>
        </>
      ) : null}

      {result ? (
        <p>
          Importados: {result.importedRows}, duplicados: {result.duplicateRows}, invalidos:{" "}
          {result.invalidRows}
        </p>
      ) : null}
    </div>
  );
}
