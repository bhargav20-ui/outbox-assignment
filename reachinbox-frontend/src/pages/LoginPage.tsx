import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function LoginPage() {
  const { loginGoogle, loginDemo } = useAuth();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const submitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      push("Enter an email and password, or continue with Google.", "error");
      return;
    }
    loginDemo();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm bg-white border border-neutral-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-center text-neutral-900 mb-6">Login</h1>

        {hasGoogleClientId ? (
          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={(cred) => {
                if (!cred.credential) {
                  push("Google did not return a valid login credential.", "error");
                  return;
                }

                loginGoogle(cred.credential).catch((err) => {
                  console.error("Google login failed", err);
                  push("Google login failed. Please try again.", "error");
                });
              }}
              onError={() => {
                push("Google login was cancelled or failed. Please try again.", "error");
              }}
              width="288"
            />
          </div>
        ) : (
          <div className="mb-4">
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 border border-neutral-200 rounded-md py-2 text-sm font-medium text-neutral-400 bg-neutral-50 cursor-not-allowed"
            >
              <GoogleG /> Google login not configured
            </button>
            <p className="text-[11px] text-neutral-400 text-center mt-2">
              Configure VITE_GOOGLE_CLIENT_ID in Vercel to enable Google sign-in.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-neutral-100" />
          <span className="text-[11px] text-neutral-400">or sign up through email</span>
          <div className="flex-1 h-px bg-neutral-100" />
        </div>

        <form onSubmit={submitLocal} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email ID"
            className="w-full bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-400"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full bg-neutral-50 border border-neutral-100 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-md"
          >
            Login
          </button>
        </form>

        <button
          type="button"
          onClick={loginDemo}
          className="w-full text-[11px] text-neutral-400 hover:text-neutral-600 mt-4"
        >
          Use demo profile
        </button>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 2.9l6-6C34.6 5.1 29.6 3 24 3 16 3 9 7.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36.4 27 37 24 37c-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1C9 40.3 16 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-2.9 5.3-5.3 6.9l6.6 5.4C39.9 37.4 43 31.4 43 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}
