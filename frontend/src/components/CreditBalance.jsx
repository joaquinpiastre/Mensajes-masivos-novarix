import { useAuth } from "../hooks/useAuth";

export default function CreditBalance() {
  const { user } = useAuth();
  return (
    <span className="mode-badge mode-automatic">
      Creditos: {user?.credits ?? 0}
    </span>
  );
}
