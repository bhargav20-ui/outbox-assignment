import { Router } from "express";
import { randomUUID } from "crypto";

export const authRouter = Router();

/**
 * Exchange a Google ID token for a lightweight application session.
 * Google verifies the token at Google's tokeninfo endpoint; the app does not
 * silently substitute the demo Oliver Brown profile when OAuth fails.
 */
authRouter.post("/google", async (req, res) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken) {
    return res.status(400).json({ error: "Google ID token is required" });
  }

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid Google ID token" });
    }

    const googleUser = (await response.json()) as {
      sub?: string;
      email?: string;
      email_verified?: string;
      name?: string;
      picture?: string;
      aud?: string;
    };

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && googleUser.aud !== expectedClientId) {
      return res.status(401).json({ error: "Google token audience does not match" });
    }

    if (!googleUser.sub || !googleUser.email || googleUser.email_verified !== "true") {
      return res.status(401).json({ error: "Google account could not be verified" });
    }

    return res.json({
      token: randomUUID(),
      user: {
        name: googleUser.name || googleUser.email.split("@")[0],
        email: googleUser.email,
        avatarUrl: googleUser.picture,
      },
    });
  } catch (error) {
    console.error("Google authentication error", error);
    return res.status(502).json({ error: "Unable to verify Google login right now" });
  }
});
