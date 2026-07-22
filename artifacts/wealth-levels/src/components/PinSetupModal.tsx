/**
 * PinSetupModal
 * Shown once after a new player signs up — offers optional secret PIN setup.
 * Stored flag: localStorage key "wl_pin_prompt_seen"
 */
import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, X, ShieldCheck, EyeOff, Eye, ChevronRight } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function PinSetupModal() {
  const { isSignedIn, user } = useUser();
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<"prompt" | "enter" | "done">("prompt");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Only show for users who signed up within the last 10 minutes
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const isNew = Date.now() - createdAt < 10 * 60 * 1000;
    const seen = localStorage.getItem("wl_pin_prompt_seen");
    if (isNew && !seen) {
      // Small delay so dashboard loads first
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    }
  }, [isSignedIn, user]);

  function dismiss() {
    localStorage.setItem("wl_pin_prompt_seen", "1");
    setVisible(false);
  }

  async function handleSave() {
    setError("");
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }
    if (pin !== confirm) {
      setError("PINs do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/me/pin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save PIN.");
      } else {
        localStorage.setItem("wl_pin_prompt_seen", "1");
        setStep("done");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pin-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-sm bg-[#080d1a] border border-[#00c8ff]/40 shadow-[0_0_40px_rgba(0,200,255,0.15)] p-6"
          >
            {/* Corner decoration */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00c8ff]/60" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00c8ff]/60" />

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-[#00c8ff]/40 hover:text-[#00c8ff] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {step === "prompt" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 border border-[#00c8ff]/40 bg-[#00c8ff]/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-[#00c8ff]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.3em] text-[#00c8ff]/50 uppercase">Optional Setup</div>
                    <div className="text-sm font-heading tracking-widest text-[#00c8ff] uppercase">Secret PIN</div>
                  </div>
                </div>
                <p className="text-xs font-mono text-[#66a3cc] leading-relaxed mb-5">
                  Set a 4–6 digit secret PIN so you can log in faster next time — no password or OTP needed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("enter")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] transition-all"
                  >
                    Set PIN <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={dismiss}
                    className="px-4 py-2.5 border border-[#00c8ff]/20 text-[#66a3cc] text-xs font-mono tracking-widest uppercase hover:border-[#00c8ff]/40 transition-all"
                  >
                    Skip
                  </button>
                </div>
              </>
            )}

            {step === "enter" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-5 h-5 text-[#00c8ff]" />
                  <div className="text-sm font-heading tracking-widest text-[#00c8ff] uppercase">Create PIN</div>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-[#00c8ff]/60 uppercase mb-1 block">Enter PIN (4–6 digits)</label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-lg tracking-[0.5em] text-center py-3 focus:outline-none focus:border-[#00c8ff] transition-colors"
                        placeholder="••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00c8ff]/40 hover:text-[#00c8ff] transition-colors"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono tracking-widest text-[#00c8ff]/60 uppercase mb-1 block">Confirm PIN</label>
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-lg tracking-[0.5em] text-center py-3 focus:outline-none focus:border-[#00c8ff] transition-colors"
                      placeholder="••••••"
                    />
                  </div>
                  {error && <p className="text-[11px] font-mono text-red-400 tracking-wide">{error}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || pin.length < 4}
                    className="flex-1 py-2.5 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving…" : "Confirm PIN"}
                  </button>
                  <button
                    onClick={() => { setStep("prompt"); setPin(""); setConfirm(""); setError(""); }}
                    className="px-4 py-2.5 border border-[#00c8ff]/20 text-[#66a3cc] text-xs font-mono tracking-widest uppercase hover:border-[#00c8ff]/40 transition-all"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 border-2 border-[#00c8ff]/60 bg-[#00c8ff]/10 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-[#00c8ff]" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-heading tracking-widest text-[#00c8ff] uppercase mb-2">PIN Activated</div>
                    <p className="text-xs font-mono text-[#66a3cc] leading-relaxed">
                      Your secret PIN is set. Use it next time you log in for quick access.
                    </p>
                  </div>
                  <button
                    onClick={() => setVisible(false)}
                    className="w-full py-2.5 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] transition-all"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
