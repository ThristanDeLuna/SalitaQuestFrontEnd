// Stand-in until the owner of each screen builds it.
export default function Placeholder({ title, owner }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="muted">{owner ? `This screen is built by Member ${owner}.` : 'Nothing here.'}</p>
    </>
  );
}
