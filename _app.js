import { TonConnectUIProvider } from '@tonconnect/ui-react';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <TonConnectUIProvider manifestUrl="https://digit-exchange.vercel.app/tonconnect-manifest.json">
      <Component {...pageProps} />
    </TonConnectUIProvider>
  );
}
