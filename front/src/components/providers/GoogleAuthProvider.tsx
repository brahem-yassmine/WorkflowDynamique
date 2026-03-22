'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  const isPlaceholder = clientId.includes("PASTE_YOUR_ID_HERE");

  if (!clientId || isPlaceholder) {
    if (isPlaceholder) {
      console.warn("⚠️ Google Auth has been implementation-ready, but is waiting for a real Client ID in .env.local.");
    } else {
      console.warn("⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.");
    }
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
