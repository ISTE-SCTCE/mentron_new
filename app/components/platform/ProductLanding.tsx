"use client";
import Link from "next/link";
import { CreativeArtwork, DiscoveryDeck } from "./CreativeExperience";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers3,
  CalendarDays,
  QrCode,
  Award,
  Compass,
  Check,
  GraduationCap,
} from "lucide-react";

export function OrbitArtwork({ product }: { product: "mentron" | "mlynq" }) {
  return <CreativeArtwork product={product} />;
}
export function ProductLanding({ product }: { product: "mentron" | "mlynq" }) {
  const learning = product === "mentron",
    brand = learning ? "Mentron" : "Mlynq";
  const features = learning
    ? [
        {
          icon: BookOpen,
          title: "A better place to study.",
          text: "Find notes, past papers and materials organised around your course.",
          label: "The library",
          href: "/mentron/notes",
        },
        {
          icon: Layers3,
          title: "Make something together.",
          text: "Discover projects, find your people and turn an idea into a contribution.",
          label: "The workshop",
          href: "/mentron/projects",
        },
        {
          icon: Sparkles,
          title: "More than your syllabus.",
          text: "Explore communities, opportunities and the work happening around you.",
          label: "The community",
          href: "/mentron/societies",
        },
      ]
    : [
        {
          icon: CalendarDays,
          title: "Be where it happens.",
          text: "Workshops, meetups and campus events. Find your next reason to show up.",
          label: "Your calendar",
          href: "/mlynq/events",
        },
        {
          icon: QrCode,
          title: "Walk in. Check in.",
          text: "Keep your personal attendance QR close, ready when your coordinator needs it.",
          label: "Your campus pass",
          href: "/mlynq/qr",
        },
        {
          icon: Award,
          title: "Keep what you earn.",
          text: "Your participation, attendance and certificates, together in one place.",
          label: "Your collection",
          href: "/mlynq/certificates",
        },
      ];
  return (
    <div className={"studio studio-" + product + " creative-landing"}>
      <nav className="s-nav" aria-label={brand + " navigation"}>
        <Link className="s-brand" href={"/" + product}>
          <span className="s-brand-mark">
            {learning ? <Layers3 size={23} /> : <Compass size={25} />}
          </span>
          {brand}
          <span className="s-brand-by">by ISTE SCTCE</span>
        </Link>
        <div className="s-nav-links">
          <a href="#explore">Explore</a>
          <Link href={"/login?product=" + product}>
            Sign in <ArrowUpRight size={15} />
          </Link>
        </div>
      </nav>
      <main id="main-content">
        <section className="s-hero">
          <div className="s-hero-copy">
            <p className="s-eyebrow">
              <span />
              {learning
                ? "FOR THE CURIOUS. FOR THE DOERS."
                : "YOUR CHAPTER STARTS HERE."}
            </p>
            <h1 className="s-title">
              {learning ? (
                <>
                  A space for
                  <br />
                  your next
                  <br />
                  <em>big “what if?”</em>
                </>
              ) : (
                <>
                  Less ordinary.
                  <br />
                  More
                  <br />
                  <em>your kind of campus.</em>
                </>
              )}
            </h1>
            <p className="s-intro">
              {learning
                ? "A shared space to learn a little deeper, build something new and find the people who get it."
                : "Less searching. More showing up. Your ISTE membership, events and achievements, all in your corner."}
            </p>
            <div className="s-hero-actions">
              <Link
                className="s-button s-primary"
                href={learning ? "/mentron/dashboard" : "/mlynq/home"}
              >
                Step inside {brand} <ArrowUpRight size={19} />
              </Link>
              <a className="s-text-link" href="#explore">
                Take a look around <ArrowRight size={16} />
              </a>
            </div>
            <div className="s-hero-note">
              <span className="s-small-symbol">
                <GraduationCap size={19} />
              </span>
              <span>
                Made for the SCTCE community.
                <br />
                <strong>One ISTE account. Both worlds.</strong>
              </span>
            </div>
          </div>
          <div className="s-hero-visual">
            <div className="s-visual-heading">
              <span>
                {learning ? "THE NEXT CHAPTER" : "THE CAMPUS COMPANION"}
              </span>
              <ArrowUpRight size={19} />
            </div>
            <OrbitArtwork product={product} />
            <div className="s-visual-bottom">
              <span>
                {learning ? "Stay curious." : "Stay connected."}
                <br />
                <strong>{learning ? "Keep going." : "Make it count."}</strong>
              </span>
              <span className="s-round-arrow">
                <ArrowUpRight size={29} />
              </span>
            </div>
            <div className="s-float-card">
              <span className="s-float-icon">
                {learning ? <BookOpen size={23} /> : <Check size={23} />}
              </span>
              <div>
                <strong>
                  {learning
                    ? "A little clarity goes a long way."
                    : "Your campus, in your pocket."}
                </strong>
                <p>
                  {learning
                    ? "Notes. Projects. New possibilities."
                    : "Membership. Moments. Milestones."}
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="s-ribbon">
          <span>LEARN</span>
          <i />
          <span>CONNECT</span>
          <i />
          <span>MAKE YOUR MARK</span>
          <i />
          <span>ISTE SCTCE</span>
          <i />
          <span>KEEP EXPLORING</span>
        </div>
        <DiscoveryDeck product={product} />
        <section className="s-explore">
          <div className="s-section-heading">
            <div>
              <p className="s-eyebrow">A SPACE THAT WORKS FOR YOU</p>
              <h2>
                {learning ? "Follow your curiosity." : "Make campus yours."}
              </h2>
            </div>
            <p>
              {learning
                ? "The resources you need. The connections you didn’t know you needed."
                : "From your first event to your next achievement, bring it all together."}
            </p>
          </div>
          <div className="s-feature-grid">
            {features.map(({ icon: Icon, ...f }, i) => (
              <Link
                key={f.title}
                href={f.href}
                className={"s-feature s-feature-" + i}
              >
                <div className="s-feature-top">
                  <Icon size={27} strokeWidth={1.6} />
                  <span>0{i + 1}</span>
                </div>
                <p className="s-eyebrow">{f.label}</p>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <span className="s-feature-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="s-cross-product">
          <span className="s-cross-icon">
            {learning ? <Compass size={38} /> : <Layers3 size={38} />}
          </span>
          <div>
            <p className="s-eyebrow">TWO PRODUCTS. ONE COMMUNITY.</p>
            <h2>
              {learning
                ? "Campus life continues in Mlynq."
                : "Your next idea lives in Mentron."}
            </h2>
            <p>
              {learning
                ? "Events, membership and every milestone along the way."
                : "Notes, projects and a community that builds together."}
            </p>
          </div>
          <Link
            href={learning ? "/mlynq" : "/mentron"}
            className="s-button s-secondary"
          >
            Explore {learning ? "Mlynq" : "Mentron"} <ArrowUpRight size={17} />
          </Link>
        </section>
        <section className="s-final-cta">
          <p className="s-eyebrow">COME AS YOU ARE. SEE WHERE YOU GO.</p>
          <h2>
            {learning
              ? "Your next chapter starts with a hello."
              : "Something good is happening here."}
          </h2>
          <Link
            href={"/signup?product=" + product}
            className="s-button s-primary"
          >
            Find your place <ArrowUpRight size={20} />
          </Link>
        </section>
      </main>
      <footer className="s-footer">
        <Link className="s-brand" href={"/" + product}>
          {brand}
          <span className="s-brand-by">ISTE SCTCE</span>
        </Link>
        <span>A little more connected.</span>
        <Link href="/mentron/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
