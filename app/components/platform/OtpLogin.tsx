"use client";
import { useState } from "react";
import { getPlatformClient } from "@/app/lib/platform/browser";
import { productHome, type Product } from "@/app/lib/platform/config";
export function OtpLogin({
  product,
  primary = false,
}: {
  product: Product;
  primary?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const client = getPlatformClient();
      if (!sent) {
        const { error } = await client.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await client.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: code.trim(),
          type: "email",
        });
        if (error) throw error;
        const { error: joinError } = await client.rpc("enroll_current_user", {
          p_product: product,
        });
        if (joinError) {
          window.location.assign("/join?product=" + product);
          return;
        }
        window.location.assign(productHome(product));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  const form = (
    <form
      onSubmit={submit}
      className={primary ? "space-y-4 s-otp-form" : "mt-4 space-y-4"}
    >
      <label className="block text-sm">
        Email address
        <input
          type="email"
          autoComplete="email"
          required
          disabled={sent || busy}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block w-full rounded-xl border border-white/20 bg-white/5 p-3"
        />
      </label>
      {sent && (
        <label className="block text-sm">
          Verification code
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            required
            disabled={busy}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-white/20 bg-white/5 p-3"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-cyan-300 px-4 font-bold text-black"
      >
        {busy
          ? "Please wait…"
          : sent
            ? "Verify and open Mlynq"
            : "Send sign-in code"}
      </button>
      {sent && (
        <>
          <p role="status" className="text-sm">
            Check your inbox for the sign-in code.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            Use another email
          </button>
        </>
      )}
    </form>
  );
  return primary ? (
    <div className="s-otp-login">{form}</div>
  ) : (
    <details className="mt-5 rounded-2xl border border-white/10 p-4">
      <summary className="cursor-pointer text-cyan-300">
        Sign in with an email code
      </summary>
      {form}
    </details>
  );
}
