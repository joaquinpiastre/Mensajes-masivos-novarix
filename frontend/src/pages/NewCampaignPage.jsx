import { useNavigate } from "react-router-dom";
import CampaignWizard from "../components/CampaignWizard";
import api from "../services/api";

export default function NewCampaignPage() {
  const navigate = useNavigate();

  const onSubmit = async (payload) => {
    const { data } = await api.post("/campaigns", payload);
    navigate(`/campaigns/${data.id}`);
  };

  return <CampaignWizard onSubmit={onSubmit} />;
}
