import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { AuthUser } from "./types";

// In-memory or environment-backed user store for local accounts
interface StoredUser extends AuthUser {
  passwordHash?: string;
}

const DEFAULT_USERS: Map<string, StoredUser> = new Map([
  [
    "admin@langgraph.ai",
    {
      id: "usr_admin",
      email: "admin@langgraph.ai",
      name: "Admin Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      provider: "local",
      passwordHash: "password123",
      createdAt: Date.now(),
    },
  ],
]);

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    (email, password, done) => {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = DEFAULT_USERS.get(normalizedEmail);

      if (existingUser) {
        if (existingUser.passwordHash === password) {
          return done(null, existingUser);
        } else {
          return done(null, false, { message: "Invalid credentials" });
        }
      }

      // If user is logging in with a new email and password, register them smoothly
      if (email.includes("@") && password.length >= 4) {
        const newUser: StoredUser = {
          id: `usr_${Math.random().toString(36).substring(2, 9)}`,
          email: normalizedEmail,
          name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          provider: "local",
          passwordHash: password,
          createdAt: Date.now(),
        };
        DEFAULT_USERS.set(normalizedEmail, newUser);
        return done(null, newUser);
      }

      return done(null, false, { message: "Invalid email or password" });
    }
  )
);

// Configure Passport Google Strategy (if credentials provided)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      (_accessToken: string, _refreshToken: string, profile: Profile, done: (err: any, user?: any) => void) => {
        const user: AuthUser = {
          id: profile.id,
          email: profile.emails?.[0]?.value || `${profile.id}@google.com`,
          name: profile.displayName || profile.name?.givenName || "Google User",
          avatarUrl: profile.photos?.[0]?.value,
          provider: "google",
          createdAt: Date.now(),
        };
        return done(null, user);
      }
    )
  );
}

// Local authentication execution helper
export async function authenticateLocal(email: string, password: string): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    passport.authenticate("local", { session: false }, (err: any, user: AuthUser | false, info: any) => {
      if (err) return reject(err);
      if (!user) return reject(new Error(info?.message || "Invalid credentials"));
      resolve(user);
    })({ body: { email, password } });
  });
}

// Google OAuth URL generator
export function getGoogleOAuthUrl(redirectUri: string): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUri,
    client_id: GOOGLE_CLIENT_ID || "MOCK_GOOGLE_CLIENT_ID",
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

// Google OAuth Code Exchange
export async function exchangeGoogleCodeForUser(code: string, redirectUri: string): Promise<AuthUser> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    // If running in development without real Google credentials, provide mock profile for verification
    return {
      id: `google_${Math.random().toString(36).substring(2, 9)}`,
      email: "google.user@example.com",
      name: "Google Explorer",
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      provider: "google",
      createdAt: Date.now(),
    };
  }

  // Real token exchange
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.access_token) {
    throw new Error(tokens.error_description || "Failed to exchange Google OAuth code");
  }

  // Fetch Google User Profile
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.email) {
    throw new Error("Failed to fetch Google profile");
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || profile.given_name || "Google User",
    avatarUrl: profile.picture,
    provider: "google",
    createdAt: Date.now(),
  };
}

export default passport;
