import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-head" style={{ paddingBlock: "80px" }}>
      <p className="eyebrow">404</p>
      <h1>We couldn’t find that page</h1>
      <p>The recipe may have been renamed or removed.</p>
      <div className="actions"><Link className="btn add" href="/menu">Browse all recipes</Link><Link className="btn ghost" href="/">Go home</Link></div>
    </div>
  );
}
