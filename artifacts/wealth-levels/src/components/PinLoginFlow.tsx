/**
 * PinLoginFlow
 * Embedded in the sign-in page — lets a user authenticate with email + PIN.
 * On success calls signIn.create({ strategy: 'ticket', ticket }) to establish a Clerk session.
 */
import { useState } from "react";
import { useSignIn } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Eye, EyeOff, ChevronLeft, ArrowRight, ShieldCheck } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Props {
  onCancel: () => void;
}

type Step = "email" | "pin" | "done";

export default function PinLoginFlow({ onCancel }: Props) {
  const { signIn, setActive } = useSignIn();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailNext() {
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    setError("");
    setStep("pin");
  }

  async function handlePinSubmit() {
    setError("");
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/pin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Invalid email or PIN.");
        setLoading(false);
        return;
      }

      const { token } = data as { token: string };
      if (!signIn) { setError("Auth not ready. Try again."); setLoading(false); return; }

      const result = await signIn.create({ strategy: "ticket", ticket: token });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        setStep("done");
      } else {
        setError("Authentication incomplete. Try the standard login.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-[440px] bg-[#080d1a] border border-[#00c8ff]/40 shadow-[0_0_30px_rgba(0,200,255,0.12)] p-8 relative"
    >
      {/* corner decorations */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#00c8ff]/60" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#00c8ff]/60" />

      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-[#00c8ff]/40 bg-[#00c8ff]/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#00c8ff]" />
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-[0.3em] text-[#00c8ff]/50 uppercase">Quick Access</div>
                <div className="font-heading text-[#00c8ff] uppercase tracking-widest text-sm">Login with PIN</div>
              </div>
            </div>

            <label className="text-[10px] font-mono tracking-widest text-[#00c8ff]/60 uppercase mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleEmailNext()}
              placeholder="player@example.com"
              autoFocus
              className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-sm px-4 py-3 mb-1 focus:outline-none focus:border-[#00c8ff] transition-colors placeholder:text-[#66a3cc]/40"
            />
            {error && <p className="text-[11px] font-mono text-red-400 tracking-wide mb-3">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEmailNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] transition-all"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-1 px-4 py-3 border border-[#00c8ff]/20 text-[#66a3cc] text-xs font-mono tracking-widest uppercase hover:border-[#00c8ff]/40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </motion.div>
        )}

        {step === "pin" && (
          <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <KeyRound className="w-5 h-5 text-[#00c8ff]" />
              <div className="font-heading text-[#00c8ff] uppercase tracking-widest text-sm">Enter Secret PIN</div>
            </div>
            <p className="text-[11px] font-mono text-[#66a3cc] mb-5 tracking-wide">
              Signing in as <span className="text-[#00c8ff]/80">{email}</span>
            </p>

            <label className="text-[10px] font-mono tracking-widest text-[#00c8ff]/60 uppercase mb-2 block">
              Secret PIN
            </label>
            <div className="relative mb-1">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                onKeyDown={e => e.key === "Enter" && !loading && handlePinSubmit()}
                placeholder="••••••"
                autoFocus
                className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-2xl tracking-[0.6em] text-center py-4 focus:outline-none focus:border-[#00c8ff] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00c8ff]/40 hover:text-[#00c8ff] transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-[11px] font-mono text-red-400 tracking-wide mb-3">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePinSubmit}
                disabled={loading || pin.length < 4}
                className="flex-1 py-3 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying…" : "Authenticate"}
              </button>
              <button
                onClick={() => { setStep("email"); setPin(""); setError(""); }}
                className="flex items-center gap-1 px-4 py-3 border border-[#00c8ff]/20 text-[#66a3cc] text-xs font-mono tracking-widest uppercase hover:border-[#00c8ff]/40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 border-2 border-[#00c8ff]/60 bg-[#00c8ff]/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#00c8ff]" />
            </div>
            <div className="text-center">
              <div className="font-heading text-[#00c8ff] uppercase tracking-widest text-sm mb-1">Access Granted</div>
              <p className="text-xs font-mono text-[#66a3cc]">Redirecting to command center…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
