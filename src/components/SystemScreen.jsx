// One friendly card for every system screen: short text and one clear next step (wireframe page 5).
// Never put raw error text or stack traces in here.
export default function SystemScreen({ title, children, actions }) {
  return (
    <section className="system" role="status">
      <h1>{title}</h1>
      <p>{children}</p>
      {actions && <div className="actions">{actions}</div>}
    </section>
  );
}
