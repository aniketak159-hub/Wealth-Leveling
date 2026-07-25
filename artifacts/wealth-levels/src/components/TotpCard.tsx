/**
 * TotpCard
 * Manages TOTP 2-step verification setup / disable in the Profile page.
 */
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ShieldOff, ScanLine, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

type Phase =
  | "idle"
  | "setup-qr"    // showing QR + waiting for first code
  | "enabling"    // submitting enable request
  | "disabling";  // showing disable flow

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono tracking-[0.3em] text-primary/50 uppercase mb-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-primary/20" />
      {children}
      <div className="h-px flex-1 bg-primary/20" />
    </div>
  );
}

export default function TotpCard() {
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/totp/status`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTotpEnabled(data.totpEnabled);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const reset = () => {
    setPhase("idle");
    setQrDataUrl("");
    setManualSecret("");
    setCode("");
    setError("");
    setSuccess(null);
    setLoading(false);
  };

  // ── Enable flow ──────────────────────────────────────────────────────────────

  const handleStartSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/totp/setup`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Setup failed. Try again."); return; }
      setQrDataUrl(data.qrDataUrl);
      setManualSecret(data.secret);
      setPhase("setup-qr");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!/^\d{6}$/.test(code)) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    setError("");
    setPhase("enabling");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/totp/enable`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Code incorrect. Try again."); setPhase("setup-qr"); return; }
      setTotpEnabled(true);
      setSuccess("2-STEP VERIFICATION ENABLED");
      setTimeout(reset, 2500);
    } finally {
      setLoading(false);
    }
  };

  // ── Disable flow ─────────────────────────────────────────────────────────────

  const handleDisable = async () => {
    if (!/^\d{6}$/.test(code)) { setError("Enter your 6-digit authenticator code."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/totp/disable`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Code incorrect. Try again."); return; }
      setTotpEnabled(false);
      setSuccess("2-STEP VERIFICATION DISABLED");
      setTimeout(reset, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (totpEnabled === null) return null; // loading

  return (
    <div className="hud-panel p-4 mt-4">
      <SectionLabel>2-Step Verification</SectionLabel>

      {success && (
        <div className="flex items-center gap-2 text-green-400 text-sm font-mono py-2 mb-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* ── Idle — show status ─────────────────────────────────────────────── */}
      {phase === "idle" && !success && (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2.5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              {totpEnabled
                ? <ShieldCheck className="w-4 h-4 text-green-400" />
                : <ShieldOff className="w-4 h-4 text-primary/40" />
              }
              <div>
                <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Authenticator App</div>
                <div className="text-sm font-mono">
                  {totpEnabled
                    ? <span className="text-green-400">Active</span>
                    : <span className="text-muted-foreground">Not enabled</span>
                  }
                </div>
              </div>
            </div>
            {totpEnabled ? (
              <button
                onClick={() => { setPhase("disabling"); setError(""); setCode(""); }}
                className="text-[10px] font-mono tracking-wider text-destructive/60 hover:text-destructive flex items-center gap-1 transition-colors"
              >
                DISABLE
              </button>
            ) : (
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="text-[10px] font-mono tracking-wider text-primary/60 hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                {loading ? "LOADING…" : "ENABLE"}
              </button>
            )}
          </div>

          <p className="text-[10px] font-mono text-muted-foreground/55 tracking-wider leading-snug">
            {totpEnabled
              ? "PIN login requires both your PIN and a code from your authenticator app."
              : "Add a second layer to PIN login — requires Google Authenticator, Authy, or any TOTP app."}
          </p>
        </div>
      )}

      {/* ── QR code setup ─────────────────────────────────────────────────── */}
      {(phase === "setup-qr" || phase === "enabling") && (
        <div className="space-y-4">
          <p className="text-[11px] font-mono text-foreground/60 leading-relaxed">
            Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code to confirm.
          </p>

          {qrDataUrl && (
            <div className="flex justify-center">
              <div className="border border-primary/30 bg-white p-3 inline-block">
                <img src={qrDataUrl} alt="TOTP QR Code" className="w-40 h-40" />
              </div>
            </div>
          )}

          <div className="border border-primary/10 bg-primary/3 px-3 py-2">
            <div className="text-[9px] font-mono tracking-widest text-primary/40 uppercase mb-1">Manual entry key</div>
            <div className="text-[11px] font-mono text-foreground/50 break-all tracking-widest">{manualSecret}</div>
          </div>

          <div className="flex items-center gap-2 relative">
            <Input
              type={showCode ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && handleEnable()}
              className="font-mono text-sm pr-10 flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCode(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <div className="text-destructive text-xs font-mono">{error}</div>}

          <div className="flex gap-2">
            <Button
              onClick={handleEnable}
              disabled={loading || code.length < 6}
              size="sm"
              className="hud-button flex-1 h-8 text-xs gap-1.5"
            >
              <ScanLine className="w-3.5 h-3.5" />
              {loading ? "VERIFYING…" : "ACTIVATE 2FA"}
            </Button>
            <Button onClick={reset} variant="outline" size="sm" className="h-8 w-8 p-0 border-primary/30">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Disable flow ──────────────────────────────────────────────────── */}
      {phase === "disabling" && (
        <div className="space-y-3">
          <p className="text-[11px] font-mono text-foreground/60 leading-relaxed">
            Enter your current authenticator code to disable 2-step verification.
          </p>

          <div className="flex items-center gap-2 relative">
            <Input
              type={showCode ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit authenticator code"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              onKeyDown={e => e.key === "Enter" && !loading && handleDisable()}
              className="font-mono text-sm pr-10 flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCode(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <div className="text-destructive text-xs font-mono">{error}</div>}

          <div className="flex gap-2">
            <Button
              onClick={handleDisable}
              disabled={loading || code.length < 6}
              size="sm"
              variant="destructive"
              className="flex-1 h-8 text-xs"
            >
              {loading ? "DISABLING…" : "CONFIRM DISABLE"}
            </Button>
            <Button onClick={reset} variant="outline" size="sm" className="h-8 w-8 p-0 border-primary/30">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
