import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Admin",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(creds) {
                if (
                    creds.username === process.env.ADMIN_USER &&
                    creds.password === process.env.ADMIN_PASS
                ) {
                    return { name: "Admin", username: creds.username };
                }
                return null;
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt", maxAge: 3600 },
};

export default NextAuth(authOptions);
