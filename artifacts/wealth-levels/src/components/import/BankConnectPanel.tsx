/**
 * Account Aggregator (AA) connect panel.
 * Shows bank connection status and initiates the consent flow when
 * SETU_CLIENT_ID / SETU_CLIENT_SECRET are configured on the server.
 * When AA is not configured, renders a clear "coming soon" card that
 * explains what AA is and how to enable it.
 */
import { useState, useEffect } from "react";
import { Link2, ExternalLink, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AAStatus {
  configured: boolean;
}

interface Props {
  /** Which FI types to request (defaults to DEPOSIT + MF + equities) */
  fiTypes?: string[];
}

export default function BankConnectPanel({ fiTypes = ["DEPOSIT", "MUTUAL_FUNDS", "EQUITIES"] }: Props) {
  const [status, setStatus] = useState<AAStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/aa/status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStatus(d as AAStatus))
      .catch(() => setStatus({ configured: false }));
  }, []);

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/aa/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fiTypes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as any).message ?? "Failed to initiate consent");
      }
      // Redirect to AA consent URL (user approves in their bank's AA app)
      if ((data as any).redirectUrl) {
        window.open((data as any).redirectUrl, "_blank", "noopener");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }

  if (!status) {
    return (
      <div className="border border-primary/20 p-4 flex items-center gap-3 animate-pulse">
        <Loader2 className="w-4 h-4 text-primary/40 animate-spin" />
        <p className="text-[10px] font-mono text-primary/40">CHECKING AA STATUS...</p>
      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="border border-primary/20 bg-primary/3 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary/50" />
          <p className="text-[10px] font-mono text-primary/60 tracking-widest">ACCOUNT AGGREGATOR — LIVE BANK SYNC</p>
        </div>
        <p className="text-[10px] font-mono text-primary/40 leading-relaxed">
          Connect your bank account via India's RBI-sanctioned Account Aggregator (AA) framework
          for automatic transaction sync. Requires FIU registration with Setu.
        </p>
        <div className="flex items-start gap-2 border border-warning/30 bg-warning/5 p-2.5">
          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-warning/70">
            NOT YET CONFIGURED — Set SETU_CLIENT_ID and SETU_CLIENT_SECRET in environment secrets to activate.
          </p>
        </div>
        <a
          href="https://setu.co/data/account-aggregator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-mono text-primary/50 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> REGISTER AS FIU ON SETU.CO
        </a>
      </div>
    );
  }

  return (
    <div className="border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <p className="text-[10px] font-mono text-primary/60 tracking-widest">ACCOUNT AGGREGATOR — ACTIVE</p>
        </div>
      </div>
      <p className="text-[10px] font-mono text-primary/40 leading-relaxed">
        Connect your bank, mutual fund, or brokerage account. Your bank will ask you to approve
        data sharing — no credentials are shared with this app.
      </p>
      {error && (
        <div className="border border-destructive/30 bg-destructive/5 p-2 text-center">
          <p className="text-[10px] font-mono text-destructive">{error}</p>
        </div>
      )}
      <Button
        size="sm"
        className="w-full"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> CONNECTING...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> CONNECT BANK ACCOUNT
          </span>
        )}
      </Button>
      <p className="text-[9px] font-mono text-primary/30 text-center">
        Powered by India's Account Aggregator framework · Consent required
      </p>
    </div>
  );
}
