import { useEffect, useState } from 'react';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import Image from 'next/image';

export default function Home() {
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [balance, setBalance] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userAddress) {
      fetchBalance();
    } else {
      setBalance(null);
      setIsSeller(false);
      setError(null);
    }
  }, [userAddress]);

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/getBalance?address=${userAddress}`);
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance / 1e9); // Convert nanotons to TON
      } else {
        setError(data.error || 'Не удалось загрузить баланс');
      }
    } catch (err) {
      setError('Ошибка при загрузке баланса: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSeller = async () => {
    if (!userAddress) {
      setError('Подключите кошелёк');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/setSeller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress }),
      });
      const data = await response.json();
      if (data.success) {
        setIsSeller(true);
      } else {
        setError(data.error || 'Не удалось установить статус продавца');
      }
    } catch (err) {
      setError('Ошибка при установке продавца: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!userAddress) {
      setError('Подключите кошелёк');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/autobuy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerAddress: userAddress }),
      });
      const data = await response.json();
      if (data.success && data.transaction) {
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 60,
          messages: [
            {
              address: data.transaction.to,
              amount: data.transaction.amount,
              payload: data.transaction.payload,
            },
          ],
        });
        alert('Сделка успешно выполнена!');
        await fetchBalance(); // Update balance after purchase
      } else {
        setError(data.error || 'Не удалось инициировать покупку');
      }
    } catch (err) {
      setError('Ошибка при покупке: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <Image src="/icon.svg" alt="Логотип" width={64} height={64} />
      <h1>Цифровой Обмен</h1>
      <TonConnectButton />
      {userAddress ? (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Адрес:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
          <p><strong>Баланс:</strong> {balance !== null ? `${balance.toFixed(2)} TON` : 'Загрузка...'}</p>
          {!isSeller && (
            <button
              onClick={handleSetSeller}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                margin: '10px',
                backgroundColor: isLoading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Загрузка...' : 'Установить как продавца'}
            </button>
          )}
          <button
            onClick={handleBuyNow}
            disabled={isLoading || isSeller || balance === null || balance < 0.1}
            style={{
              padding: '10px 20px',
              margin: '10px',
              backgroundColor: isLoading || isSeller || balance === null || balance < 0.1 ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading || isSeller || balance === null || balance < 0.1 ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Загрузка...' : 'Купить сейчас'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>Ошибка: {error}</p>}
        </div>
      ) : (
        <p style={{ marginTop: '20px' }}>Подключите кошелёк, чтобы начать</p>
      )}
    </div>
  );
}
