import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AutoSendPanel from "../components/AutoSendPanel";
import ManualSendPanel from "../components/ManualSendPanel";
import api from "../services/api";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [preview, setPreview] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [campaignRes, previewRes, progressRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/preview`),
        api.get(`/campaigns/${id}/progress`),
      ]);
      setCampaign(campaignRes.data);
      setPreview(previewRes.data.links || []);
      setRecentLogs(progressRes.data.logs || []);
    };

    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (!campaign) return <p>Cargando...</p>;

  return (
    <section>
      <div className="card">
        <h2>{campaign.name}</h2>
        <p>Estado: {campaign.status}</p>
        <p>Enviados: {campaign.sentCount} / {campaign.totalCount}</p>
        <p>Canal: {campaign.channel || "internal"}</p>
      </div>
      <ManualSendPanel links={preview} />
      <AutoSendPanel campaignId={id} sentCount={campaign.sentCount} totalCount={campaign.totalCount} />
      <div className="card">
        <h3>Ultimos eventos de envio</h3>
        {!recentLogs.length ? (
          <p>Sin logs aun.</p>
        ) : (
          <ul>
            {recentLogs.map((log) => (
              <li key={log.id}>
                {log.name} - {log.phone} - {log.status} ({log.provider})
                {log.error ? ` - ${log.error}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
