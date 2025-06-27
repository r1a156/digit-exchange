export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { dealNumber, sellerAddress, amount, sellerPayout } = req.body;

  if (!dealNumber || !sellerAddress || !amount || !sellerPayout) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  // TODO: Реализовать логику автоскупки с реальным смарт-контрактом
  console.log('Автовыкуп:', { dealNumber, sellerAddress, amount, sellerPayout });

  res.status(200).json({ success: true });
}
