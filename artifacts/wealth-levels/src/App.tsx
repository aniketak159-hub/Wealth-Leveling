import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes'; 
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import Home from "@/pages/Home";
import DashboardPage from "@/pages/Dashboard";
import AdminPage from "@/pages/Admin";
import ProfilePage from "@/pages/Profile";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#00c8ff",
    colorForeground: "#e6f7ff",
    colorMutedForeground: "#66a3cc",
    colorDanger: "#ff0000",
    colorBackground: "#080d1a",
    colorInput: "#0f172a",
    colorInputForeground: "#e6f7ff",
    colorNeutral: "#00b3e6",
    fontFamily: "'Share Tech Mono', monospace",
    borderRadius: "0px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#080d1a] border border-[#00c8ff]/30 shadow-[0_0_15px_rgba(0,200,255,0.2)] rounded-none w-[440px] max-w-full overflow-hidden relative hud-panel-inner",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#00c8ff] font-['Orbitron'] tracking-widest uppercase drop-shadow-[0_0_8px_rgba(0,200,255,0.4)]",
    headerSubtitle: "text-[#66a3cc] uppercase tracking-wider text-xs",
    socialButtonsBlockButtonText: "text-[#00c8ff] uppercase tracking-wider font-['Orbitron']",
    formFieldLabel: "text-[#00c8ff]/80 uppercase tracking-wider font-['Orbitron'] text-xs",
    footerActionLink: "text-[#00c8ff] hover:text-[#00c8ff]/80 uppercase tracking-wider",
    footerActionText: "text-[#66a3cc]",
    dividerText: "text-[#66a3cc] uppercase",
    identityPreviewEditButton: "text-[#00c8ff]",
    formFieldSuccessText: "text-[#22c55e]",
    alertText: "text-[#ff0000]",
    formButtonPrimary: "bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff] font-['Orbitron'] tracking-widest uppercase hover:bg-[#00c8ff]/20 hover:border-[#00c8ff] hover:shadow-[0_0_15px_rgba(0,200,255,0.5)] transition-all rounded-none",
    formFieldInput: "bg-[#0f172a] border border-[#00c8ff]/30 text-[#e6f7ff] rounded-none focus:ring-[#00c8ff] focus:border-[#00c8ff]",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative hud-grid-bg">
      <div className="absolute top-4 left-4 text-[#00c8ff]/30 font-mono text-xs tracking-widest">SECURE LOGIN PROTOCOL // INITIATED</div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative hud-grid-bg">
      <div className="absolute top-4 left-4 text-[#00c8ff]/30 font-mono text-xs tracking-widest">HUNTER REGISTRATION // STANDBY</div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function DashboardProtect() {
  return (
    <>
      <Show when="signed-in">
        <DashboardPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AdminProtect() {
  return (
    <>
      <Show when="signed-in">
        <AdminPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ProfileProtect() {
  return (
    <>
      <Show when="signed-in">
        <ProfilePage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "SYSTEM LOGIN",
            subtitle: "AUTHENTICATE TO ACCESS COMMAND CENTER",
          },
        },
        signUp: {
          start: {
            title: "INITIALIZE HUNTER",
            subtitle: "REGISTER CREDENTIALS TO BEGIN",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard" component={DashboardProtect} />
          <Route path="/admin" component={AdminProtect} />
          <Route path="/profile" component={ProfileProtect} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;