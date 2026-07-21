import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-destructive/50 bg-destructive/5 hud-panel">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
            <h1 className="text-2xl font-bold font-heading text-destructive drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">404 - SECTOR NOT FOUND</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            The navigational coordinates provided do not map to any known sector in the system database. 
          </p>
        </CardContent>
      </Card>
    </div>
  );
}