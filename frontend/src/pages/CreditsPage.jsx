import { CREDIT_PACKAGES } from "../utils/credits";
import api from "../services/api";

export default function CreditsPage() {
  const buy = async (packageId) => {
    const { data } = await api.post("/payments/create-preference", { packageId });
    if (data.initPoint) {
      window.open(data.initPoint, "_self");
    }
  };

  return (
    <section className="grid-2">
      {CREDIT_PACKAGES.map((pkg) => (
        <article className="card" key={pkg.id}>
          <h3>{pkg.label}</h3>
          <p>${pkg.price} ARS</p>
          <button onClick={() => buy(pkg.id)}>Comprar</button>
        </article>
      ))}
    </section>
  );
}
