import { TonClient } from '@ton/ton';
import { Address, beginCell, toNano } from '@ton/core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Метод не поддерживается' });
  }

  const { buyerAddress } = req.body;
  if (!buyerAddress) {
    return res.status(400).json({ success: false, error: 'Требуется адрес покупателя' });
  }

  try {
    const client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.NEXT_PUBLIC_TONCENTER_API_KEY,
    });

    // Replace with your actual mainnet seller address
    const sellerAddress = 'YOUR_MAINNET_SELLER_ADDRESS_HERE';
    const amount = toNano('0.1'); // 0.1 TON for the deal

    // Verify seller address
    await client.getBalance(Address.parse(sellerAddress));

    // Create transaction payload
    const payload = beginCell()
      .storeUint(0, 32) // Operation code (0 for simple transfer)
      .storeStringTail('Buy Now') // Comment
      .endCell()
      .toBoc()
      .toString('base64');

    const transaction = {
      to: sellerAddress,
      amount: amount.toString(),
      payload,
    };

    return res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Ошибка автоскупки:', error);
    return res.status(500).json({ success: false, error: 'Не удалось обработать покупку: ' + error.message });
  }
}
