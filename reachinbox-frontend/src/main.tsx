import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const root = ReactDOM.createRoot(document.getElementById("root")!);

function Root() {
  const app = (
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  );

  // GoogleOAuthProvider requires a non-empty clientId; skip wrapping if not configured
  // so the demo/local-login fallback still works out of the box.
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
}

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
