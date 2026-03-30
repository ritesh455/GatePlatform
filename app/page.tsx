"use client";

import App from "../src/App";
import { AuthProvider } from "../src/contexts/AuthContext";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}