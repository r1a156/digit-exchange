import TonWeb from 'tonweb';

export default async function handler(req, res) {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Адрес кошелька обязателен' });
  }

  try {
    const ton = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {
      apiKey: process.env.NEXT_PUBLIC_TONCENTER_API_KEY,
    }));
    const balance = await ton.getBalance(address);
    res.status(200).json({ result: { balance: Number(balance) } });
  } catch (error) {
    console.error('Ошибка API getBalance:', error.message);
    res.status(500).json({ error: `Не удалось получить баланс: ${error.message}` });
  }
}
