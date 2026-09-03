import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PinStatus {
  hasPinSet: boolean;
}

interface Props {
  children: React.ReactNode;
}

/**
 * Protects one route entry with the user's optional PIN.
 *
 * Verification is intentionally local to this mounted gate instead of being
 * shared across routes. When Wouter leaves a protected route, this component
 * unmounts; the next route entry starts with verified=false and prompts again.
 */
export default function PinGate({ children }: Props) {
  const { user } = useUser();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    data: pinStatus,
    isLoading: statusLoading,
    isError: statusError,
    refetch,
  } = useQuery<PinStatus>({
    queryKey: ["pin-status", user?.id],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/api/users/me/pin-status`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch PIN status");
      }
      return response.json() as Promise<PinStatus>;
    },
    enabled: Boolean(user?.id),
    staleTime: Infinity,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${BASE_URL}/api/auth/pin-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Incorrect PIN.");
        return;
      }

      setPin("");
      setVerified(true);
    } catch {
      setError("Unable to verify PIN. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (statusLoading || !pinStatus) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-primary font-mono text-sm tracking-widest hud-cursor">
          CHECKING SECURITY STATUS...
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-destructive font-mono text-sm tracking-widest">
          SECURITY STATUS UNAVAILABLE
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!pinStatus.hasPinSet || verified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-[#080d1a] flex items-center justify-center px-4 hud-grid-bg relative">
      <div className="absolute top-4 left-4 text-[#00c8ff]/30 font-mono text-xs tracking-widest">
        SECURITY CHECKPOINT // ACTIVE
      </div>

      <div className="w-full max-w-sm bg-[#080d1a] border border-[#00c8ff]/40 shadow-[0_0_30px_rgba(0,200,255,0.15)] p-8 relative">
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
              autoFocus
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="· · · · · ·"
              aria-label="PIN"
              className="w-full bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] font-mono text-2xl tracking-[0.5em] text-center py-3 pr-10 focus:outline-none focus:border-[#00c8ff] transition-colors placeholder:text-[#00c8ff]/20"
            />
            <button
              type="button"
              aria-label={showPin ? "Hide PIN" : "Show PIN"}
              onClick={() => setShowPin((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00c8ff]/40 hover:text-[#00c8ff] transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-red-400 font-mono text-xs tracking-wide">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || pin.length < 4}
            className="w-full py-3 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] font-['Orbitron'] text-xs tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] hover:shadow-[0_0_10px_rgba(0,200,255,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Verifying…" : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}