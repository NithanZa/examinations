import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css';
import { Analytics } from "@vercel/analytics/react"

export default function MyApp({ Component, pageProps }) {
    return (
        <SessionProvider>
            <Component {...pageProps} />
            <Analytics />
        </SessionProvider>
    );
}
