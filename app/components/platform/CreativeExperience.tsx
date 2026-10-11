"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Layers3,
  Sparkles,
  Ticket,
  X,
  Search,
  Command,
  Compass,
  Pause,
  Play,
} from "lucide-react";

export function CreativeArtwork({ product }: { product: "mentron" | "mlynq" }) {
  const learning = product === "mentron";
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`atelier-art ${product}`}
      aria-hidden="true"
      onPointerMove={(event) => {
        if (
          event.pointerType !== "mouse" ||
          document.documentElement.dataset.studioMotion === "paused" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--art-x",
          `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}deg`,
        );
        event.currentTarget.style.setProperty(
          "--art-y",
          `${((event.clientY - bounds.top) / bounds.height - 0.5) * -10}deg`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--art-x", "0deg");
        ref.current?.style.setProperty("--art-y", "0deg");
      }}
    >
      <div className="atelier-grid" />
      <div className="atelier-halo" />
      <div className="atelier-sculpture">
        <div className="atelier-sheet sheet-back">
          <span>
            {learning ? "COLLECT YOUR THOUGHTS" : "COLLECT YOUR MOMENTS"}
          </span>
        </div>
        <div className="atelier-sheet sheet-front">
          <div className="art-sheet-top">
            <span>{learning ? "FIELD NOTES / 01" : "ALL ACCESS / YOU"}</span>
            {learning ? <BookOpen size={24} /> : <Ticket size={24} />}
          </div>
          <div className="art-symbol">
            {learning ? (
              <span className="art-asterisk">✳</span>
            ) : (
              <div className="art-flower">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ transform: `rotate(${i * 45}deg)` }} />
                ))}
              </div>
            )}
          </div>
          <strong>
            {learning ? (
              <>
                Small sparks.
                <br />
                Big possibilities.
              </>
            ) : (
              <>
                Good people.
                <br />
                Great stories.
              </>
            )}
          </strong>
          <div className="art-sheet-bottom">
            <span>
              {learning ? "MAKE ROOM FOR IDEAS" : "KEEP THIS CHAPTER"}
            </span>
            <ArrowUpRight size={26} />
          </div>
        </div>
        <div className="atelier-sticker">
          {learning ? "WHAT\nIF?" : "YOU\nBELONG."}
        </div>
        <div className="atelier-caption">
          {learning
            ? "A work in progress. Just like us."
            : "Admit one. A whole world opens."}
        </div>
      </div>
      <div className="atelier-coordinate">
        {learning ? "LEARN / MAKE / REPEAT" : "HERE / NOW / TOGETHER"}
      </div>
    </div>
  );
}

const destinations = [
  ["Study notes", "/mentron/notes", "Notes, papers and course materials"],
  ["Projects", "/mentron/projects", "Build something with your community"],
  ["GATE preparation", "/mentron/gate", "Resources for the next step"],
  ["Marketplace", "/mentron/marketplace", "Browse the campus shop"],
  ["My orders", "/mentron/marketplace/orders", "Track your purchases"],
  [
    "My contributions",
    "/mentron/projects/contributions",
    "Your project contributions",
  ],
  [
    "Leaderboard",
    "/mentron/leaderboard",
    "Community contributions and progress",
  ],
  ["Societies", "/mentron/societies", "Find your community"],
  ["Team", "/mentron/team", "Meet the people behind Mentron"],
  ["Settings", "/mentron/settings", "Your Mentron preferences"],
  ["Campus events", "/mlynq/events", "Discover what is happening"],
  ["Attendance QR", "/mlynq/qr", "Your personal check-in code"],
  ["Attendance", "/mlynq/attendance", "Your participation record"],
  ["Certificates", "/mlynq/certificates", "Keep the achievements you earn"],
  ["History", "/mlynq/history", "Your campus journey"],
  ["Notifications", "/mlynq/notifications", "Stay in the loop"],
  ["Profile & membership", "/mlynq/profile", "Your account and membership"],
];

export function CreativeControls() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const open = () => {
    setQuery("");
    dialog.current?.showModal();
    input.current?.focus();
  };
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);
  useEffect(() => {
    const saved = localStorage.getItem("studio-motion") === "paused";
    setPaused(saved);
    document.documentElement.dataset.studioMotion = saved ? "paused" : "on";
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);
  const visible = destinations.filter(([label, , detail]) =>
    `${label} ${detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="creative-tools">
        <button ref={trigger} onClick={open} aria-label="Find a feature">
          <Search size={18} />
          <span>Explore</span>
          <kbd>⌘ K</kbd>
        </button>
        <button
          aria-label={
            paused ? "Enable decorative motion" : "Pause decorative motion"
          }
          aria-pressed={paused}
          onClick={() => {
            const next = !paused;
            setPaused(next);
            document.documentElement.dataset.studioMotion = next
              ? "paused"
              : "on";
            localStorage.setItem("studio-motion", next ? "paused" : "on");
          }}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      <dialog
        ref={dialog}
        className="creative-command"
        aria-labelledby="feature-finder-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="command-heading">
          <div>
            <p>YOUR COMMUNITY, AT YOUR FINGERTIPS</p>
            <h2 id="feature-finder-title">Where to next?</h2>
          </div>
          <button onClick={close} aria-label="Close feature finder">
            <X />
          </button>
        </div>
        <label className="command-search">
          <Search size={20} />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find notes, events, your QR…"
            aria-label="Search features"
          />
        </label>
        <div className="command-results">
          {visible.length ? (
            visible.map(([label, href, detail]) => (
              <Link
                key={href}
                href={href}
                onClick={() => dialog.current?.close()}
              >
                <span
                  className={
                    "command-symbol " +
                    (href.startsWith("/mentron") ? "violet" : "teal")
                  }
                >
                  {href.startsWith("/mentron") ? (
                    <Layers3 size={20} />
                  ) : (
                    <Compass size={20} />
                  )}
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))
          ) : (
            <p className="command-empty">
              No matching feature. Try “notes”, “QR” or “events”.
            </p>
          )}
        </div>
        <p className="command-footer">
          <Command size={14} /> K to open · Escape to close
        </p>
      </dialog>
    </>
  );
}

export function DiscoveryDeck({ product }: { product: "mentron" | "mlynq" }) {
  const learning = product === "mentron";
  const options = learning
    ? [
        {
          label: "Learn",
          title: "A little clarity. A lot of possibility.",
          text: "Your course, organised. Browse notes, revisit past papers and find the explanation that finally clicks.",
          href: "/mentron/notes",
          action: "Open the library",
          icon: BookOpen,
          tag: "THE STUDY ROOM",
        },
        {
          label: "Build",
          title: "The best ideas need a second pair of hands.",
          text: "Explore projects, apply your skills and contribute to something bigger than an assignment.",
          href: "/mentron/projects",
          action: "Find a project",
          icon: Layers3,
          tag: "THE WORKSHOP",
        },
        {
          label: "Connect",
          title: "Find the people who ask “what if?”",
          text: "Discover societies and the people behind them. Take your curiosity beyond the classroom.",
          href: "/mentron/societies",
          action: "Meet your community",
          icon: Sparkles,
          tag: "THE COMMON ROOM",
        },
      ]
    : [
        {
          label: "Show up",
          title: "The next good story starts here.",
          text: "Find workshops, meetups and campus events. Open the details and make your next plan.",
          href: "/mlynq/events",
          action: "Explore events",
          icon: Ticket,
          tag: "THE CAMPUS CALENDAR",
        },
        {
          label: "Check in",
          title: "One small code. You’re part of it.",
          text: "Your personal attendance QR, ready for the coordinator. Keep your participation together.",
          href: "/mlynq/qr",
          action: "Open your QR",
          icon: Compass,
          tag: "YOUR CAMPUS PASS",
        },
        {
          label: "Collect",
          title: "You did the thing. Keep the moment.",
          text: "Revisit your certificates and participation. Every achievement has a place in your collection.",
          href: "/mlynq/certificates",
          action: "See your certificates",
          icon: Sparkles,
          tag: "THE KEEPSAKES",
        },
      ];
  const [selected, setSelected] = useState(0);
  const current = options[selected];
  const Icon = current.icon;
  return (
    <section className="discovery-section" id="explore">
      <div className="discovery-heading">
        <p className="s-eyebrow">A FEW WAYS TO MAKE IT YOURS</p>
        <h2>
          {learning ? (
            <>
              Curiosity has
              <br />
              <em>many doors.</em>
            </>
          ) : (
            <>
              A campus full of
              <br />
              <em>your kind of moments.</em>
            </>
          )}
        </h2>
      </div>
      <div className="discovery-deck">
        <div
          className="discovery-tabs"
          role="tablist"
          aria-label="Explore product features"
        >
          {options.map((o, i) => (
            <button
              key={o.label}
              role="tab"
              id={`${product}-tab-${i}`}
              aria-selected={selected === i}
              aria-controls={`${product}-feature-panel`}
              tabIndex={selected === i ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                let next = i;
                if (e.key === "ArrowRight") next = (i + 1) % 3;
                else if (e.key === "ArrowLeft") next = (i + 2) % 3;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = 2;
                else return;
                e.preventDefault();
                setSelected(next);
                document.getElementById(`${product}-tab-${next}`)?.focus();
              }}
            >
              <span>0{i + 1}</span>
              {o.label}
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
        <div
          className="discovery-panel"
          role="tabpanel"
          id={`${product}-feature-panel`}
          aria-labelledby={`${product}-tab-${selected}`}
          tabIndex={0}
        >
          <div key={selected} className="discovery-content">
            <div className="discovery-icon">
              <Icon size={50} strokeWidth={1.2} />
            </div>
            <p className="s-eyebrow">{current.tag}</p>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
            <Link className="s-button s-primary" href={current.href}>
              {current.action}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <span className="discovery-number" aria-hidden="true">
            0{selected + 1}
          </span>
        </div>
      </div>
    </section>
  );
}
