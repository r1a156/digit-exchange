import { useState, useEffect } from 'react';
import Head from 'next/head';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const [walletBalance, setWalletBalance] = useState(null);
  const [currentDeal, setCurrentDeal] = useState(1);
  const [dealHistory, setDealHistory] = useState([]);
  const [sellerAddress, setSellerAddress] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Устанавливаем флаг клиентской стороны
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Данные о сделках
  const deals = [
    { i: 1, P: 10, R: 10, S: 7, royalty: 3 },
    { i: 2, P: 11, R: 15.714285714285714, S: 11, royalty: 4.714285714285714 },
    { i: 3, P: 15.714285714285714, R: 22.5, S: 15.75, royalty: 6.75 },
    { i: 4, P: 22.5, R: 33.75, S: 23.625, royalty: 10.125 },
    { i: 5, P: 33.75, R: 50.625, S: 35.4375, royalty: 15.1875 },
    { i: 6, P: 50.625, R: 75.9375, S: 53.15625, royalty: 22.78125 },
    { i: 7, P: 75.9375, R: 113.90625, S: 79.734375, royalty: 34.171875 },
    { i: 8, P: 113.90625, R: 113.90625, S: 113.90625, royalty: 51.2578125 },
    { i: 9, P: 113.90625, R: 113.90625, S: 113.90625, royalty: 0 },
  ];

  // Проверка баланса
  useEffect(() => {
    if (isClient && tonConnectUI?.account?.address) {
      async function fetchBalance() {
        try {
          const response = await fetch(
            `https://toncenter.com/api/v2/getAddressInformation?address=${tonConnectUI.account.address}`,
            { headers: { 'X-Api-Key': process.env.NEXT_PUBLIC_TONCENTER_API_KEY } }
          );
          const data = await response.json();
          setWalletBalance(data.result.balance / 1e9);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
      fetchBalance();
    }
  }, [isClient, tonConnectUI]);

  // Установка продавца
  const handleSetSeller = async () => {
    if (isClient && tonConnectUI?.connected) {
      setSellerAddress(tonConnectUI.account.address);
      alert('Seller wallet set!');
    } else {
      alert('Please connect a wallet to set as seller.');
    }
  };

  // Заключение сделки (1–8)
  const handleDeal = async () => {
    if (!isClient) return;

    const deal = deals[currentDeal - 1];
    const requiredAmount = deal.P + 0.05;

    if (!tonConnectUI?.connected) {
      alert('Please connect your wallet first.');
      return;
    }

    if (walletBalance < requiredAmount) {
      alert(`Insufficient balance. Required: ${requiredAmount.toFixed(2)} TON`);
      return;
    }

    if (currentDeal !== 1 && !sellerAddress) {
      alert('Seller wallet not set.');
      return;
    }

    try {
      const messages = [
        {
          address: process.env.NEXT_PUBLIC_PROJECT_WALLET,
          amount: (deal.P * 1e9).toString(),
        },
      ];

      if (currentDeal !== 1) {
        messages.push({
          address: sellerAddress,
          amount: (deal.S * 1e9).toString(),
        });
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages,
      };

      await tonConnectUI.sendTransaction(transaction);

      setDealHistory([
        { ...deal, buyer: tonConnectUI.account.address, seller: sellerAddress || 'N/A' },
        ...dealHistory,
      ]);
      setCurrentDeal(currentDeal + 1);
      setSellerAddress(tonConnectUI.account.address);

      alert(`Deal ${currentDeal} completed successfully!`);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
    }
  };

  // Автоматический выкуп для сделки 9
  useEffect(() => {
    if (isClient && currentDeal === 9 && sellerAddress) {
      const deal = deals[8];
      fetch('/api/autobuy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealNumber: 9,
          sellerAddress,
          amount: deal.P,
          sellerPayout: deal.S,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            setDealHistory([
              { ...deal, buyer: 'Project Wallet', seller: sellerAddress },
              ...dealHistory,
            ]);
            setCurrentDeal(10);
            alert('Deal 9 auto-bought by project wallet!');
          } else {
            alert('Auto-buy failed.');
          }
        })
        .catch((error) => {
          console.error('Auto-buy failed:', error);
          alert('Auto-buy failed. Please try again.');
        });
    }
  }, [isClient, currentDeal, sellerAddress]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Digit Exchange</title>
        <meta name="description" content="TON-based marketplace" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" />
      </Head>

      <main className={styles.main}>
        <img src="/icon.svg" alt="Digit Exchange Logo" className={styles.logo} />
        <h1 className={styles.title}>Digit Exchange</h1>

        <section className={styles.section}>
          {isClient && <TonConnectButton />}
          {isClient && tonConnectUI?.connected && (
            <div className={styles.walletInfo}>
              <p>
                <strong>Wallet:</strong>{' '}
                {tonConnectUI.account.address.slice(0, 6)}...{tonConnectUI.account.address.slice(-4)}
              </p>
              <p>
                <strong>Balance:</strong>{' '}
                {walletBalance ? walletBalance.toFixed(2) : 'Loading...'} TON
              </p>
              <button className={styles.button} onClick={handleSetSeller}>
                Set as Seller
              </button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Current Deal #{currentDeal}</h2>
          {currentDeal <= 8 && (
            <div className={styles.dealInfo}>
              <p>
                <strong>Price:</strong> {deals[currentDeal - 1].P.toFixed(2)} TON
              </p>
              <p>
                <strong>Seller Payout:</strong> {deals[currentDeal - 1].S.toFixed(2)} TON
              </p>
              <button
                className={styles.button}
                disabled={!isClient || !tonConnectUI?.connected || (currentDeal !== 1 && !sellerAddress)}
                onClick={handleDeal}
              >
                Buy Now
              </button>
            </div>
          )}
          {currentDeal === 9 && (
            <p className={styles.info}>Deal 9 will be auto-bought by the project.</p>
          )}
          {currentDeal > 9 && <p className={styles.info}>No more deals available.</p>}
        </section>

        <section className={styles.section}>
          <h2>Deal History</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Deal</th>
                <th>Price (P_i, TON)</th>
                <th>Seller Payout (S_i, TON)</th>
                <th>Buyer</th>
                <th>Seller</th>
              </tr>
            </thead>
            <tbody>
              {dealHistory.map((deal) => (
                <tr key={deal.i}>
                  <td>{deal.i}</td>
                  <td>{deal.P.toFixed(2)}</td>
                  <td>{deal.S.toFixed(2)}</td>
                  <td>
                    {deal.buyer === 'Project Wallet'
                      ? 'Project'
                      : `${deal.buyer.slice(0, 6)}...${deal.buyer.slice(-4)}`}
                  </td>
                  <td>
                    {deal.seller === 'N/A'
                      ? 'N/A'
                      : `${deal.seller.slice(0, 6)}...${deal.seller.slice(-4)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
