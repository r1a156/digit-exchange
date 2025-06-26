import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Схема сделок
  const deals = useMemo(() => [
    { i: 1, P: 1.625, R: 0.5, S: 0.5, royalty: 1.125 },
    { i: 2, P: 3.234375, R: 1.7875, S: 1.7875, royalty: 1.446875 },
    { i: 3, P: 5.447265625, R: 3.5578125, S: 3.5578125, royalty: 1.889453125 },
    { i: 4, P: 8.489990234375, R: 5.9919921875, S: 5.9919921875, royalty: 2.497998046875 },
    { i: 5, P: 12.673736572265625, R: 9.3389892578125, S: 9.3389892578125, royalty: 3.334747314453125 },
    { i: 6, P: 18.426387786865234, R: 13.941110229492188, S: 13.941110229492188, royalty: 4.485277557373047 },
    { i: 7, P: 26.336283206939697, R: 20.269026565551758, S: 20.269026565551758, royalty: 6.067256641387939 },
    { i: 8, P: 28, R: 20.8, S: 20.8, royalty: 7.2 },
  ], []);

  // Очистка ошибок
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Установка флага клиентской стороны
  useEffect(() => {
    setIsClient(true);
    console.log('isClient установлен в true');
  }, []);

  // Отладка состояния подключения кошелька
  useEffect(() => {
    console.log('Состояние tonConnectUI:', {
      connected: tonConnectUI?.connected,
      address: tonConnectUI?.account?.address,
    });
  }, [tonConnectUI]);

  // Получение баланса кошелька
  useEffect(() => {
    if (isClient && tonConnectUI?.connected && tonConnectUI?.account?.address) {
      async function fetchBalance() {
        try {
          setIsLoading(true);
          console.log('Запрос баланса для адреса:', tonConnectUI.account.address);
          const response = await fetch(
            `/api/getBalance?address=${encodeURIComponent(tonConnectUI.account.address)}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          const balance = data.result.balance / 1e9;
          setWalletBalance(balance);
          console.log('Баланс загружен:', balance);
        } catch (error) {
          console.error('Ошибка получения баланса:', error.message);
          setError('Не удалось загрузить баланс: ' + error.message);
          setWalletBalance(0);
        } finally {
          setIsLoading(false);
        }
      }
      fetchBalance();
    }
  }, [isClient, tonConnectUI]);

  // Установка продавца
  const handleSetSeller = useCallback(async () => {
    if (isClient && tonConnectUI?.connected) {
      setSellerAddress(tonConnectUI.account.address);
      setError('Кошелёк продавца установлен!');
    } else {
      setError('Подключите кошелёк, чтобы установить его как продавца.');
    }
  }, [isClient, tonConnectUI]);

  // Обработка сделки (1–7)
  const handleDeal = useCallback(async () => {
    if (!isClient || !tonConnectUI?.connected) {
      setError('Подключите кошелёк.');
      return;
    }

    const deal = deals[currentDeal - 1];
    if (!deal || isNaN(deal.P) || isNaN(deal.S)) {
      console.error('Неверные данные сделки:', deal);
      setError('Неверные данные сделки');
      return;
    }

    const requiredAmount = deal.P + 0.05;
    if (walletBalance === null || walletBalance < requiredAmount) {
      setError(`Недостаточно средств. Требуется: ${requiredAmount.toFixed(2)} TON`);
      return;
    }

    if (currentDeal !== 1 && !sellerAddress) {
      setError('Кошелёк продавца не установлен.');
      return;
    }

    try {
      setIsLoading(true);
      const messages = [
        {
          address: process.env.NEXT_PUBLIC_PROJECT_WALLET || 'UQCJFymQcEZYOp8UbITHMaHo8HH8FPVzTWTrqxN6tB0O3_Kn',
          amount: (deal.P * 1e9).toString(),
        },
      ];

      if (currentDeal !== 1 && sellerAddress) {
        messages.push({
          address: sellerAddress,
          amount: (deal.S * 1e9).toString(),
        });
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages,
      };

      console.log('Отправка транзакции:', transaction);
      await tonConnectUI.sendTransaction(transaction, { payloads: [] });

      setDealHistory([
        { ...deal, buyer: tonConnectUI.account.address, seller: currentDeal === 1 ? 'Платформа' : sellerAddress },
        ...dealHistory,
      ]);
      setCurrentDeal(currentDeal + 1);
      setSellerAddress(tonConnectUI.account.address);

      setError(`Сделка #${currentDeal} успешно завершена!`);
    } catch (error) {
      console.error('Ошибка транзакции:', error.message);
      setError('Транзакция не удалась: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, tonConnectUI, walletBalance, currentDeal, sellerAddress, deals, dealHistory]);

  // Проверка баланса кошелька проекта
  const checkProjectWalletBalance = useCallback(async () => {
    try {
      const projectWallet = process.env.NEXT_PUBLIC_PROJECT_WALLET || 'UQCJFymQcEZYOp8UbITHMaHo8HH8FPVzTWTrqxN6tB0O3_Kn';
      const response = await fetch(
        `/api/getBalance?address=${encodeURIComponent(projectWallet)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const balance = data.result.balance / 1e9;
      const requiredAmount = deals[7].P + 0.05;
      if (balance < requiredAmount) {
        throw new Error(`Недостаточно средств на кошельке проекта: ${balance.toFixed(2)} TON, требуется ${requiredAmount.toFixed(2)} TON`);
      }
      console.log('Баланс кошелька проекта:', balance);
      return balance;
    } catch (error) {
      console.error('Ошибка проверки баланса проекта:', error.message);
      throw error;
    }
  }, [deals]);

  // Автоматический выкуп для сделки #8
  useEffect(() => {
    if (isClient && currentDeal === 8 && sellerAddress) {
      const deal = deals[7];
      async function performAutoBuy() {
        try {
          setIsLoading(true);
          console.log('Запуск автовыкупа для сделки #8', { sellerAddress, deal });

          await checkProjectWalletBalance();

          const response = await fetch('/api/autobuy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dealNumber: 8,
              sellerAddress,
              amount: deal.P,
              sellerPayout: deal.S,
            }),
          });

          const result = await response.json();
          console.log('Ответ от /api/autobuy:', result);

          if (result.success) {
            setDealHistory([
              { ...deal, buyer: 'Кошелёк проекта', seller: sellerAddress },
              ...dealHistory,
            ]);
            setCurrentDeal(9);
            setError('Сделка #8 автоматически выкуплена проектом!');
          } else {
            throw new Error(result.error || 'Неизвестная ошибка автовыкупа');
          }
        } catch (error) {
          console.error('Ошибка автовыкупа:', error.message);
          setError('Автовыкуп не удался: ' + error.message);
        } finally {
          setIsLoading(false);
        }
      }
      performAutoBuy();
    }
  }, [isClient, currentDeal, sellerAddress, deals, dealHistory, checkProjectWalletBalance]);

  // Отладка состояния кнопки
  useEffect(() => {
    if (currentDeal <= 7) {
      console.log('Состояние кнопки "Купить сейчас":', {
        isLoading,
        isClient,
        connected: tonConnectUI?.connected,
        sellerAddressRequired: currentDeal !== 1 && !sellerAddress,
        currentDeal,
        walletBalance,
      });
    }
  }, [isLoading, isClient, tonConnectUI, currentDeal, sellerAddress, walletBalance]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Цифровой Обмен</title>
        <meta name="description" content="Маркетплейс на базе TON" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" />
      </Head>

      <main className={styles.main}>
        <img src="/icon.svg" alt="Логотип Цифровой Обмен" className={styles.logo} />
        <h1 className={styles.title}>Цифровой Обмен</h1>

        {error && (
          <p className={styles.error}>{error}</p>
        )}

        <section className={styles.section} aria-labelledby="wallet-heading">
          <h2 id="wallet-heading" className={styles.sectionTitle}>Кошелёк</h2>
          {isClient && (
            <div className={styles.walletButtonContainer}>
              <TonConnectButton />
            </div>
          )}
          {isClient && tonConnectUI?.connected && (
            <div className={styles.walletInfo}>
              <p>
                <strong>Кошелёк:</strong>{' '}
                {tonConnectUI.account.address.slice(0, 6)}...{tonConnectUI.account.address.slice(-4)}
              </p>
              <p>
                <strong>Баланс:</strong>{' '}
                {walletBalance !== null ? walletBalance.toFixed(2) : 'Загрузка...'} TON
              </p>
              <button className={styles.button} onClick={handleSetSeller} disabled={isLoading}>
                {isLoading ? 'Обработка...' : 'Установить как продавца'}
              </button>
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="deal-heading">
          <h2 id="deal-heading" className={styles.sectionTitle}>Текущая сделка #{currentDeal}</h2>
          {currentDeal <= 7 && (
            <div className={styles.dealInfo}>
              <p>
                <strong>Цена (Pi):</strong> {deals[currentDeal - 1].P.toFixed(2)} TON
              </p>
              <p>
                <strong>Выплата продавцу (Si):</strong> {deals[currentDeal - 1].S.toFixed(2)} TON
              </p>
              <p>
                <strong>Роялти:</strong> {deals[currentDeal - 1].royalty.toFixed(2)} TON
              </p>
              <button
                className={styles.button}
                disabled={isLoading || !isClient || !tonConnectUI?.connected || (currentDeal !== 1 && !sellerAddress)}
                onClick={handleDeal}
              >
                {isLoading ? 'Обработка...' : 'Купить сейчас'}
              </button>
            </div>
          )}
          {currentDeal === 8 && (
            <p className={styles.info}>Сделка #8 будет автоматически выкуплена проектом.</p>
          )}
          {currentDeal > 8 && <p className={styles.info}>Больше сделок нет.</p>}
        </section>

        <section className={styles.section} aria-labelledby="history-heading">
          <h2 id="history-heading" className={styles.sectionTitle}>История сделок</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Сделка</th>
                  <th>Цена (Pi, TON)</th>
                  <th>Выплата (Si, TON)</th>
                  <th>Роялти (TON)</th>
                  <th>Покупатель</th>
                  <th>Продавец</th>
                </tr>
              </thead>
              <tbody>
                {dealHistory.map((deal) => (
                  <tr key={deal.i}>
                    <td>{deal.i}</td>
                    <td>{deal.P.toFixed(2)}</td>
                    <td>{deal.S.toFixed(2)}</td>
                    <td>{deal.royalty.toFixed(2)}</td>
                    <td>
                      {deal.buyer === 'Кошелёк проекта'
                        ? 'Проект'
                        : `${deal.buyer.slice(0, 6)}...${deal.buyer.slice(-4)}`}
                    </td>
                    <td>
                      {deal.seller === 'Платформа'
                        ? 'Платформа'
                        : `${deal.seller.slice(0, 6)}...${deal.seller.slice(-4)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
