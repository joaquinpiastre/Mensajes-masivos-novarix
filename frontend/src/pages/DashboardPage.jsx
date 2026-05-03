import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const CAMPAIGN_STATUS_LABELS = {
  draft: "Borrador",
  sending: "Enviando",
  sent: "Enviada",
  failed: "Con errores",
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-AR");
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    campaigns: [],
    contacts: [],
    userName: "",
    importJobs: [],
    backendOk: false,
  });

  const load = async () => {
    setError("");
    try {
      const [meRes, campaignsRes, contactsRes, jobsRes, healthRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/campaigns"),
        api.get("/contacts"),
        api.get("/contacts/import-jobs"),
        fetch((import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "/health")),
      ]);

      const authError =
        meRes.status === "rejected" && meRes.reason?.response?.status === 401;
      if (authError) {
        setError("Tu sesion expiro o no iniciaste sesion. Volve a entrar en /login.");
      }

      setStats({
        campaigns: campaignsRes.status === "fulfilled" ? campaignsRes.value.data : [],
        contacts: contactsRes.status === "fulfilled" ? contactsRes.value.data : [],
        userName: meRes.status === "fulfilled" ? meRes.value.data.name || "" : "",
        importJobs: jobsRes.status === "fulfilled" ? jobsRes.value.data || [] : [],
        backendOk:
          healthRes.status === "fulfilled" ? healthRes.value.ok : false,
      });
    } catch {
      setError("No se pudo cargar el dashboard. Revisa el backend y vuelve a intentar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const totalCampaigns = stats.campaigns.length;
    const sentCampaigns = stats.campaigns.filter((item) => item.status === "sent").length;
    const failedCampaigns = stats.campaigns.filter((item) => item.status === "failed").length;
    const sendingCampaigns = stats.campaigns.filter((item) => item.status === "sending").length;
    const drafts = stats.campaigns.filter((item) => item.status === "draft").length;

    const totalDelivered = stats.campaigns.reduce((acc, item) => acc + (item.sentCount || 0), 0);
    const totalTarget = stats.campaigns.reduce((acc, item) => acc + (item.totalCount || 0), 0);
    const totalFailed = stats.campaigns.reduce((acc, item) => acc + (item.failedCount || 0), 0);
    const activeCampaigns = stats.campaigns.filter((item) => item.status === "sending").length;
    const deliveryRate = totalTarget ? Math.round((totalDelivered / totalTarget) * 100) : 0;
    const throughput = stats.campaigns.length ? Math.round(totalDelivered / stats.campaigns.length) : 0;

    return {
      totalCampaigns,
      sentCampaigns,
      failedCampaigns,
      sendingCampaigns,
      drafts,
      totalDelivered,
      totalTarget,
      totalFailed,
      activeCampaigns,
      throughput,
      deliveryRate,
    };
  }, [stats]);

  const recentCampaigns = useMemo(
    () =>
      [...stats.campaigns]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [stats.campaigns],
  );

  if (loading) {
    return <p>Cargando dashboard...</p>;
  }

  return (
    <section className="dashboard-layout">
      <div className="dashboard-header card">
        <div>
          <h2>Panel de control</h2>
          <p>
            {stats.userName ? `Hola, ${stats.userName}.` : "Bienvenido."} Aqui ves el estado real de tu operacion.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" onClick={load}>
            Actualizar
          </button>
          <span className={`health-pill ${stats.backendOk ? "ok" : "down"}`}>
            Backend: {stats.backendOk ? "online" : "offline"}
          </span>
        </div>
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}

      <div className="dashboard-kpis">
        <article className="card kpi-card">
          <p>Total de campanas</p>
          <strong>{metrics.totalCampaigns}</strong>
        </article>
        <article className="card kpi-card">
          <p>Contactos cargados</p>
          <strong>{stats.contacts.length}</strong>
        </article>
        <article className="card kpi-card">
          <p>Tasa de entrega</p>
          <strong>{metrics.deliveryRate}%</strong>
        </article>
        <article className="card kpi-card">
          <p>Campanas activas</p>
          <strong>{metrics.activeCampaigns}</strong>
        </article>
        <article className="card kpi-card">
          <p>Throughput promedio</p>
          <strong>{metrics.throughput}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Estado de campanas</h3>
          <ul className="status-list">
            <li>
              <span>Borradores</span>
              <strong>{metrics.drafts}</strong>
            </li>
            <li>
              <span>Enviando</span>
              <strong>{metrics.sendingCampaigns}</strong>
            </li>
            <li>
              <span>Enviadas</span>
              <strong>{metrics.sentCampaigns}</strong>
            </li>
            <li>
              <span>Con errores</span>
              <strong>{metrics.failedCampaigns}</strong>
            </li>
          </ul>
        </article>

        <article className="card">
          <h3>Rendimiento de envios</h3>
          <ul className="status-list">
            <li>
              <span>Mensajes enviados</span>
              <strong>{metrics.totalDelivered}</strong>
            </li>
            <li>
              <span>Mensajes objetivo</span>
              <strong>{metrics.totalTarget}</strong>
            </li>
            <li>
              <span>Mensajes fallidos</span>
              <strong>{metrics.totalFailed}</strong>
            </li>
          </ul>
          <div className="progress-wrap">
            <div className="progress-bar">
              <span style={{ width: `${metrics.deliveryRate}%` }} />
            </div>
            <small>Entrega total acumulada: {metrics.deliveryRate}%</small>
          </div>
        </article>

        <article className="card">
          <h3>Acciones rapidas</h3>
          <div className="quick-actions">
            <Link to="/contacts">Gestionar contactos</Link>
            <Link to="/campaigns/new">Crear campana</Link>
            <Link to="/templates">Editar templates</Link>
          </div>
        </article>

        <article className="card">
          <h3>Incidencias de importacion</h3>
          {!stats.importJobs.length ? (
            <p>Sin importaciones recientes.</p>
          ) : (
            <ul className="activity-list">
              {stats.importJobs.slice(0, 5).map((job) => (
                <li key={job.id}>
                  <div>
                    <strong>{job.fileName}</strong>
                    <p>
                      Importados: {job.importedRows} | Invalidos: {job.invalidRows} | Duplicados:{" "}
                      {job.duplicateRows}
                    </p>
                  </div>
                  <span className="status-tag status-failed">
                    {job.invalidRows > 0 ? "Revisar" : "OK"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Actividad reciente de campanas</h3>
          {!recentCampaigns.length ? (
            <p>Aun no hay campanas creadas.</p>
          ) : (
            <ul className="activity-list">
              {recentCampaigns.map((campaign) => (
                <li key={campaign.id}>
                  <div>
                    <strong>{campaign.name}</strong>
                    <p>{formatDate(campaign.createdAt)}</p>
                  </div>
                  <span className={`status-tag status-${campaign.status}`}>
                    {CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

      </div>
    </section>
  );
}
