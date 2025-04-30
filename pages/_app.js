import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css';
export default function MyApp({ Component, pageProps }) {
    return (
        <SessionProvider>
            <Component {...pageProps} />
        </SessionProvider>
    );
}
