"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, ArrowUpRight, Layers3, Compass } from "lucide-react";
import { login } from "./actions";
import { OtpLogin } from "@/app/components/platform/OtpLogin";
import { OrbitArtwork } from "@/app/components/platform/ProductLanding";

function LoginFields({ brand }: { brand: string }) {
  const { pending } = useFormStatus();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <fieldset disabled={pending} className="s-auth-fields">
      <label htmlFor="login-email">Email address</label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="username"
        required
        placeholder="you@example.com"
      />
      <div className="s-password-label">
        <label htmlFor="login-password">Password</label>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
      <div className="s-password-input">
        <input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      <button
        className="s-button s-primary s-auth-submit"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing you in…" : "Sign in to " + brand}
        <ArrowUpRight size={19} />
      </button>
    </fieldset>
  );
}

export default function LoginPage() {
  const params = useSearchParams();
  const product = params.get("product") === "mlynq" ? "mlynq" : "mentron";
  const brand = product === "mlynq" ? "Mlynq" : "Mentron";
  const error = params.get("error"),
    message = params.get("message");
  return (
    <main className={"studio studio-" + product + " s-auth-page"}>
      <nav className="s-nav" aria-label="Account navigation">
        <Link className="s-brand" href={"/" + product}>
          {product === "mlynq" ? <Compass size={25} /> : <Layers3 size={25} />}{" "}
          {brand}
        </Link>
        <Link className="s-text-link" href="/">
          Both worlds <ArrowUpRight size={16} />
        </Link>
      </nav>
      <div className="s-auth-layout">
        <section className="s-auth-story">
          <p className="s-eyebrow">ONE ACCOUNT. YOUR WHOLE COMMUNITY.</p>
          <h1>
            {product === "mentron" ? (
              <>
                A little curiosity.
                <br />A lot of possibility.
              </>
            ) : (
              <>
                Your people.
                <br />
                Your next chapter.
              </>
            )}
          </h1>
          <p>
            {product === "mentron"
              ? "Pick up a new idea, find a useful note or build something together."
              : "Catch the next event, keep your campus pass close and celebrate what you achieve."}
          </p>
          <div className="s-auth-art">
            <OrbitArtwork product={product} />
          </div>
          <span className="s-eyebrow">MENTRON + MLYNQ · ISTE SCTCE</span>
        </section>
        <section className="s-auth-card" aria-labelledby="welcome-title">
          <p className="s-eyebrow">GOOD TO SEE YOU</p>
          <h2 id="welcome-title">Welcome back.</h2>
          <p className="s-auth-intro">Sign in to your shared ISTE account.</p>
          {error && (
            <p role="alert" className="s-auth-error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="s-auth-message">
              {message}
            </p>
          )}
          <form action={login}>
            <input type="hidden" name="product" value={product} />
            <LoginFields brand={brand} />
          </form>
          <OtpLogin product={product} />
          <p className="s-auth-signup">
            New around here?{" "}
            <Link href={"/signup?product=" + product}>
              Create an account <ArrowUpRight size={14} />
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
