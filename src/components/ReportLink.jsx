// "Report this", "Report a problem" and "Request Contributor access" all open the same Google Form (DEC-63).
// The form address is public, so it can live in a VITE_ variable. Pre-filling the page address is not verified.
const FORM_URL = import.meta.env.VITE_FEEDBACK_FORM_URL;

export default function ReportLink({ children, className = 'btn' }) {
  if (!FORM_URL) {
    return <button type="button" className={className} disabled>{children} (form link not set up yet)</button>;
  }
  return <a className={className} href={FORM_URL} target="_blank" rel="noopener noreferrer">{children}</a>;
}
