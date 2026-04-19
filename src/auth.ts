import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { connectDB } from "@/lib/db/mongodb"
import { Student } from "@/lib/db/models/Student"
import bcrypt from "bcryptjs"
import { sendWelcomeEmail } from "@/lib/services/email"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  experimental: { enableWebAuthn: false },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["pkce"],
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await Student.findOne({ email: credentials.email })
        if (!user || !user.password) return null
        const isCorrectPassword = await bcrypt.compare(credentials.password as string, user.password)
        if (!isCorrectPassword) return null
        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          image: user.image,
          role: "student",
          feeStatus: user.feeStatus || "pending",
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-create student record on first Google sign-in
      if (account?.provider === "google" && user.email) {
        try {
          await connectDB()
          const existing = await Student.findOne({ email: user.email })
          if (!existing) {
            const nameParts = (user.name || "").split(" ")
            await Student.create({
              first_name: nameParts[0] || "",
              last_name: nameParts.slice(1).join(" ") || "",
              email: user.email,
              image: user.image || "",
              provider: "google",
              password: null,
            })
            // Send Welcome Email
            try {
              await sendWelcomeEmail(user.email, nameParts[0] || "Student")
            } catch (emailErr) {
              console.error("[Auth] Welcome email failed:", emailErr)
            }
          }
        } catch (err) {
          console.error("[Auth] Google sign-in DB error:", err)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role || "student";
        // @ts-ignore
        token.feeStatus = user.feeStatus || "pending";
      } else if (token.email) {
        // Refresh feeStatus on every JWT verification to ensure UI is up-to-date
        try {
          await connectDB();
          const s = await Student.findOne({ email: token.email }).select("feeStatus").lean();
          if (s) {
            // @ts-ignore
            token.feeStatus = s.feeStatus;
            // @ts-ignore
            token.role = "student";
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role as string;
        // @ts-ignore
        session.user.feeStatus = token.feeStatus as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
