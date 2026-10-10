import Link from "next/link";
import { ArrowUpRight, Layers3, Compass } from "lucide-react";
import { OrbitArtwork } from "./components/platform/ProductLanding";
export default function PlatformHome() {
  return (
    <main className="studio">
      <div className="s-gateway">
        <p className="s-eyebrow">
          <span />
          ISTE SCTCE · MADE FOR YOUR NEXT CHAPTER
        </p>
        <h1>
          One community.
          <br />
          <span style={{ color: "#b6a0ff" }}>A world of possibility.</span>
        </h1>
        <p>
          A place for your ideas. A place for your people. Explore both with one
          ISTE account.
        </p>
        <div className="s-worlds">
          {(["mentron", "mlynq"] as const).map((product) => (
            <Link
              href={"/" + product}
              key={product}
              className={"s-world " + product}
            >
              <div className="s-world-title">
                <span className="s-world-label">
                  {product === "mentron"
                    ? "LEARN · BUILD · SHARE"
                    : "CONNECT · SHOW UP · BELONG"}
                </span>
                {product === "mentron" ? (
                  <Layers3 size={22} />
                ) : (
                  <Compass size={22} />
                )}
              </div>
              <OrbitArtwork product={product} />
              <div className="s-world-title">
                <h2>{product === "mentron" ? "Mentron" : "Mlynq"}</h2>
                <ArrowUpRight size={28} />
              </div>
              <p>
                {product === "mentron"
                  ? "Your study space, project workshop and community of curious minds."
                  : "Your campus companion for events, membership and every milestone."}
              </p>
              <span className="s-text-link">
                Explore {product === "mentron" ? "Mentron" : "Mlynq"}{" "}
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
        <div className="s-hero-actions">
          <Link className="s-button s-secondary" href="/login">
            Already part of the community? Sign in <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
