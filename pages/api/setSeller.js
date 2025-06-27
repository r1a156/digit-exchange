export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ success: false, error: 'Требуется адрес кошелька' });
  }

  try {
    // In a real app, save seller status to a database
    // For simplicity, return success (client handles isSeller state)
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка установки продавца:', error);
    return res.status(500).json({ success: false, error: 'Не удалось установить продавца: ' + error.message });
  }
}
