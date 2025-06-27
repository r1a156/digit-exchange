// pages/api/getBalance.js
import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';

export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ success: false, error: 'Address is required' });
  }

  try {
    const client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.NEXT_PUBLIC_TONCENTER_API_KEY,
    });

    const balance = await client.getBalance(Address.parse(address));
    return res.status(200).json({ success: true, balance: balance.toString() });
  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch balance' });
  }
}
