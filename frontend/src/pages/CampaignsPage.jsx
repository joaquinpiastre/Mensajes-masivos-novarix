import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    api.get("/campaigns").then(({ data }) => setCampaigns(data));
  }, []);

  return (
    <section className="card">
      <h2>Campanas</h2>
      <Link to="/campaigns/new">Crear campana</Link>
      <ul>
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <Link to={`/campaigns/${campaign.id}`}>{campaign.name}</Link> - {campaign.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
