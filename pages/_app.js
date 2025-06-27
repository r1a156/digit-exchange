// pages/api/autobuy.js
import { TonClient } from '@ton/ton';
import { Address, beginCell, toNano } from '@ton/core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { buyerAddress } = req.body;
  if (!buyerAddress) {
    return res.status(400).json({ success: false, error: 'Buyer address is required' });
  }

  try {
    const client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.NEXT_PUBLIC_TONCENTER_API_KEY,
    });

    // Example: Hardcoded seller address and deal parameters
    const sellerAddress = 'kQDbU54b9Yf2y6hZ1nDJa96J1BuW7n3zE9u_9iHrqFzW5n5O'; // Replace with actual seller address
    const amount = toNano('0.1'); // 0.1 TON for the deal

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
    console.error('Autobuy error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process purchase' });
  }
}
