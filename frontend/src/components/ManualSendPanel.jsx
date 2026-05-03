export default function ManualSendPanel({ links = [] }) {
  return (
    <div className="card">
      <h3>Modo manual</h3>
      <span className="mode-badge mode-manual">Manual - sin costo</span>
      <ul>
        {links.map((item) => (
          <li key={item.contactId}>
            {item.name} - {item.phone} -{" "}
            <a href={item.link} target="_blank" rel="noreferrer">
              Clic para enviar
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
