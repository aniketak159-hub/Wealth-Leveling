import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface PinRecheckContextValue {
  verifiedAt: number | null;
  markVerified: () => void;
  clearVerification: () => void;
}

const PinRecheckContext = createContext<PinRecheckContextValue | null>(null);

export function PinRecheckProvider({ children }: { children: ReactNode }) {
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);

  const markVerified = useCallback(() => setVerifiedAt(Date.now()), []);
  const clearVerification = useCallback(() => setVerifiedAt(null), []);

  return (
    <PinRecheckContext.Provider value={{ verifiedAt, markVerified, clearVerification }}>
      {children}
    </PinRecheckContext.Provider>
  );
}

export function usePinRecheck() {
  const ctx = useContext(PinRecheckContext);
  if (!ctx) throw new Error("usePinRecheck must be used inside PinRecheckProvider");
  return ctx;
}
