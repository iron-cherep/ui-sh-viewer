import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDocs } from "../app/DocsProvider";
import { AccentButton } from "../components/AccentButton";
import { FetchProgressPage } from "../components/FetchProgress";
import { FrameBox } from "../components/Frame";
import { WelcomeBackdrop } from "../components/WelcomeBackdrop";

/** Onboarding: explain the tool, take a token, then crawl with live progress. */
export function Welcome() {
  const { hydrated, hasToken, status, progress, error, connect } = useDocs();
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  // Returning users (token already stored) never see onboarding.
  if (hydrated && hasToken) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    const ok = await connect(trimmed);
    if (ok) navigate("/", { replace: true });
  }

  // Once a token is submitted, give the crawl the whole frame to itself.
  if (status === "connecting") {
    return (
      <FrameBox>
        <div className="grid h-full place-items-center">
          <FetchProgressPage progress={progress} />
        </div>
      </FrameBox>
    );
  }

  return (
    <FrameBox>
      {/* A static, blurred preview of the real app behind the onboarding modal. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 scale-[1.02] select-none blur-[3px]">
        <WelcomeBackdrop />
      </div>
      <div aria-hidden className="absolute inset-0 bg-zinc-950/70" />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="w-full max-w-md rounded-2xl bg-zinc-900/95 p-6 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-sm sm:p-8"
          >
            <div className="flex items-center gap-2.5">
              <h1 id="welcome-title" className="text-3xl font-semibold tracking-tight text-balance text-white">
                UI.SH MG
              </h1>
              <span className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[0.6875rem]/4 font-medium text-zinc-400 ring-1 ring-white/10">
                Unofficial
              </span>
            </div>
            <p className="mt-2 text-base/7 text-zinc-300 sm:text-sm/6">UI.SH&rsquo;s Missing GUI</p>
            <p className="mt-3 max-w-[52ch] text-base/7 text-pretty text-zinc-400 sm:text-sm/6">
              A read-only browser for the ui.sh documentation graph &mdash; not affiliated with ui.sh. Paste your
              access token to fetch the docs and browse them like a mini site.
            </p>

            <form onSubmit={onSubmit} className="mt-8">
              <label htmlFor="token" className="text-base/6 font-medium text-white sm:text-sm/6">
                Access token
              </label>
              <input
                id="token"
                name="token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste your ui.sh token"
                autoFocus
                required
                className="mt-2 w-full rounded-lg bg-zinc-950/60 px-3 py-2.5 text-base/6 text-white ring-1 ring-white/10 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-accent sm:py-2 sm:text-sm/6"
              />

              {error ? (
                <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-base/6 text-rose-300 ring-1 ring-rose-500/20 sm:text-sm/6">
                  {error}
                </p>
              ) : null}

              <AccentButton type="submit" className="mt-6 w-full" disabled={!token.trim()}>
                Connect &amp; fetch docs
              </AccentButton>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-xl bg-zinc-950/50 p-4 inset-ring inset-ring-white/10">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 stroke-accent" />
              <p className="text-base/6 text-zinc-400 sm:text-sm/6">
                Everything stays on this device. Your token is saved in your browser&rsquo;s local storage and sent
                only to the official ui.sh API to fetch documentation &mdash; no other servers are contacted, and
                nothing is uploaded, shared, or tracked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </FrameBox>
  );
}
