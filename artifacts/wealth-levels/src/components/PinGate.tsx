/**
 * PinGate
 *
 * Wraps a protected route. On every mount (i.e. every route entry):
 *   - If the user has no PIN set → renders children immediately.
 *   - If PIN is set but not yet verified this mount → shows a PIN prompt overlay.
 *   - If PIN is set and verified → renders children.
 *
 * On unmount (route exit) it always clears the verification, so the next
 * entry to any protected route will re-prompt.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { usePinRecheck } from "@/contexts/PinRecheckContext";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Props {
  children: React.ReactNode;
}

export default function PinGate({ children }: Props) {
  const { user } = useUser();
  const { verifiedAt, markVerified, clearVerification } = usePinRecheck();

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch once per user — staleTime: Infinity so it never refetches mid-session.
  const { data: pinStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["pin-status", user?.id],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/users/me/pin-status`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pin status");
      return res.json() as Promise<{ hasPinSet: boolean }>;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  // Clear verification on every unmount so the next route entry re-prompts.
  useEffect(() => {
    return () => clearVerification();
  }, [clearVerification]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/pin-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Incorrect PIN.");
        return;
      }
      markVerified();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Still loading — avoid content flash; render nothing until we know.
  if (statusLoading || !pinStatus) return null;

  // No PIN set — pass through unconditionally.
  if (!pinStatus.hasPinSet) return <>{children}</>;

  // Verified this mount — pass through.
  if (verifiedAt !== null) return <>{children}</>;

  // PIN set, not verified — show checkpoint overlay.
  return (
    <div className="min-h-[100dvh] bg-[#080d1a] flex items-center justify-center px-4 hud-grid-bg relative">
      <div className="absolute top-4 left-4 text-[#00c8ff]/30 font-mono text-xs tracking-widest">
        SECURITY CHECKPOINT // ACTIVE
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#080d1a] border border-[#00c8ff]/40 shadow-[0_0_30px_rgba(0,200,255,0.15)] p-8 relative"
      >
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00c8ff]" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00c8ff]" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00c8ff]" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00c8ff]" />

        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-[#00c8ff] shrink-0" />
          <div>
            <p className="font-['Orbitron'] text-[#00c8ff] text-sm tracking-widest uppercase">
              Re-Entry Verification
            </p>
            <p className="text-[#66a3cc] font-mono text-[10px] tracking-wider mt-0.5 uppercase">
              Enter your PIN to proceed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="· · · · · ·"
              autoFocus
              className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-2xl tracking-[0.5em] text-center py-3 pr-10 focus:outline-none focus:border-[#00c8ff] transition-colors placeholder:text-[#00c8ff]/20"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00c8ff]/40 hover:text-[#00c8ff] transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 font-mono text-xs tracking-wide">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || pin.length < 4}
            className="w-full py-3 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] font-['Orbitron'] text-xs tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] hover:shadow-[0_0_10px_rgba(0,200,255,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Verifying…" : "Confirm"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
