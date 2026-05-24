import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rateLimiter";

// Shared headers for server-to-server calls to the Express backend.
// The INTERNAL_API_KEY lets the backend return sensitive wards (e.g. password hash).
const internalHeaders = () => ({
  "x-api-key": process.env.INTERNAL_API_KEY || "",
});

function createCustomJWT(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "1h" },
  );
}

async function ensureBackendUserAndFetch({
  email,
  name,
  provider,
  profilePic,
}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  if (!email) throw new Error("Missing email");

  const encodedEmail = encodeURIComponent(email);

  // 1) Ensure user exists in backend DB (idempotent-ish: backend returns 409 if exists)
  try {
    await axios.post(`${baseUrl}/api/users`, {
      name,
      email,
      socialAccounts: provider,
      profilePic: profilePic || null,
    });
  } catch (err) {
    // 409 = already exists, OK
    if (err?.response?.status !== 409) {
      throw err;
    }
  }

  // 2) Fetch canonical backend user (Mongo _id + roles)
  const res = await axios.get(`${baseUrl}/api/users/email/${encodedEmail}`, {
    headers: internalHeaders(),
  });
  return res.data;
}

// This is a basic NextAuth configuration
// You'll need to customize it based on your actual authentication needs
const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const encodedEmail = encodeURIComponent(credentials.email);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

          // Check account lockout
          try {
            const lockRes = await axios.get(
              `${baseUrl}/api/users/email/${encodedEmail}`,
              { headers: internalHeaders() },
            );
            const userData = lockRes.data;

            // Check if account is locked
            if (
              userData.lockUntil &&
              new Date(userData.lockUntil) > new Date()
            ) {
              const minsLeft = Math.ceil(
                (new Date(userData.lockUntil) - new Date()) / 60000,
              );
              throw new Error(
                `AccountLocked:Account is locked. Try again in ${minsLeft} minutes.`,
              );
            }

            // Check email verification (skip for social accounts)
            // if (
            //   !userData.emailVerified &&
            //   (!userData.socialAccounts || userData.socialAccounts.length === 0)
            // ) {
            //   throw new Error(
            //     "EmailNotVerified:Please verify your email before logging in.",
            //   );
            // }

            // Verify password
            const isValid = await bcrypt.compare(
              credentials.password,
              userData.password,
            );

            if (isValid) {
              // Reset login attempts on success
              try {
                await axios.patch(
                  `${baseUrl}/api/users/internal/login-attempts/${encodedEmail}`,
                  { loginAttempts: 0, lockUntil: null },
                  { headers: internalHeaders() },
                );
              } catch (_) {
                // Non-critical, continue
              }

              return {
                id: userData._id,
                email: userData.email,
                name: userData.name,
                roles: userData.roles,
                image: userData.profilePic,
              };
            }

            // Record failed attempt
            try {
              const attempts = (userData.loginAttempts || 0) + 1;
              const update = { loginAttempts: attempts };
              if (attempts >= 5) {
                update.lockUntil = new Date(
                  Date.now() + 15 * 60 * 1000,
                ).toISOString();
              }
              await axios.patch(
                `${baseUrl}/api/users/internal/login-attempts/${encodedEmail}`,
                update,
                { headers: internalHeaders() },
              );
            } catch (_) {
              // Non-critical
            }

            return null;
          } catch (err) {
            if (
              err.message?.startsWith("AccountLocked:") ||
              err.message?.startsWith("EmailNotVerified:")
            ) {
              throw err;
            }
            // User not found or other error
            return null;
          }
        } catch (err) {
          if (
            err.message?.startsWith("AccountLocked:") ||
            err.message?.startsWith("EmailNotVerified:")
          ) {
            throw new Error(err.message);
          }
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Debug log for troubleshooting
      // console.log('JWT callback:', { token, user, account });

      // On every subsequent request (no account/user present), ensure accessToken
      // is present and not expired. This also upgrades sessions created before
      // accessToken was added to the JWT callback.
      if (!account && !user) {
        const needsReissue = (() => {
          if (!token.accessToken) return true; // missing – old session
          try {
            const decoded = jwt.decode(token.accessToken);
            const expiresIn = decoded?.exp
              ? decoded.exp - Math.floor(Date.now() / 1000)
              : -1;
            return expiresIn < 300; // expired or near-expiry
          } catch (_) {
            return true;
          }
        })();

        if (needsReissue && (token.userId || token.email)) {
          token.accessToken = createCustomJWT({
            id: token.userId,
            email: token.email,
            roles: token.roles,
          });
        }
        return token;
      }

      if (account && user) {
        const provider = account.provider;
        const email = user.email || null;

        // For OAuth providers, NextAuth's `user.id` is typically the provider account id,
        // but the rest of the app/backend expects MongoDB's _id.
        // Ensure user exists in backend and fetch canonical user data.
        if (provider && provider !== "credentials" && email) {
          try {
            const backendUser = await ensureBackendUserAndFetch({
              email,
              name: user.name || email.split("@")[0],
              provider,
              profilePic: user.image,
            });

            token.userId = backendUser._id;
            token.email = backendUser.email;
            token.roles = backendUser.roles;
            token.accessToken = createCustomJWT({
              id: backendUser._id,
              email: backendUser.email,
              roles: backendUser.roles,
            });
          } catch (err) {
            // Fallback: keep sign-in working with a JWT-shaped token
            // (some UI logic expects `session.accessToken` to be a JWT).
            token.userId = user.id || user._id || token.userId || null;
            token.email = email;
            token.roles = user.roles || token.roles || "user";
            token.accessToken = createCustomJWT({
              id: token.userId,
              email: token.email,
              roles: token.roles,
            });
          }
        } else {
          // Credentials provider: user.id already maps to Mongo _id
          token.userId = user.id || user._id || null;
          token.email = user.email || null;
          token.roles = user.roles || null;
          token.accessToken = createCustomJWT(user);
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.userId || null;
      session.user.email = token.email || null;
      session.user.roles = token.roles || null;

      // Generate HMAC offline token for sendBeacon fallback
      const secret = process.env.NEXTAUTH_SECRET;
      if (secret && token.email) {
        session.offlineToken = crypto
          .createHmac("sha256", secret)
          .update(`${token.email}:offline`)
          .digest("hex");
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET };

// Rate-limit login attempts (POST requests to NextAuth)
export async function POST(request, context) {
  const { limited, retryAfter } = checkRateLimit(request, 10, 15 * 60 * 1000);
  if (limited) {
    return new Response(
      JSON.stringify({
        error: "Too many login attempts. Please try again later.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }
  return handler(request, context);
}
