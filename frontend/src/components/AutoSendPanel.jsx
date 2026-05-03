import { useState } from "react";
import api from "../services/api";

export default function AutoSendPanel({ campaignId, sentCount = 0, totalCount = 0 }) {
  const [loading, setLoading] = useState(false);

  const onSend = async () => {
    setLoading(true);
    try {
      await api.post(`/campaigns/${campaignId}/send`);
    } finally {
      setLoading(false);
    }
  };

  const progress = totalCount ? Math.round((sentCount / totalCount) * 100) : 0;

  return (
    <div className="card">
      <h3>Modo interno</h3>
      <span className="mode-badge mode-automatic">Interno - sin proveedor externo</span>
      <p>Progreso: {progress}%</p>
      <button onClick={onSend} disabled={loading}>
        {loading ? "Procesando..." : "Iniciar envio interno"}
      </button>
    </div>
  );
}
