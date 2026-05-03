export default function MessagePreview({ message = "", contact = { name: "Cliente" } }) {
  const rendered = message.replaceAll("{{nombre}}", contact.name || "Cliente");

  return (
    <div className="card">
      <h3>Preview del mensaje</h3>
      <p>{rendered || "Aun no hay mensaje definido."}</p>
    </div>
  );
}
