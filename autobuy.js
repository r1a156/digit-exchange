import { TonClient, WalletContractV4, internal, fromNano, toNano } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { dealNumber, sellerAddress, amount, sellerPayout } = req.body;

  if (dealNumber !== 9) {
    return res.status(400).json({ success: false, message: 'Invalid deal number' });
  }

  try {
    // Инициализация клиента TON (Mainnet)
    const client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TONCENTER_API_KEY,
    });

    // Получение ключей из seed-фразы
    const mnemonic = process.env.PROJECT_WALLET_SEED.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    // Создание кошелька проекта
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const walletContract = client.open(wallet);

    // Проверка баланса кошелька проекта
    const balance = await walletContract.getBalance();
    const requiredAmount = toNano(amount + 0.05); // P_9 + комиссия

    if (balance < requiredAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance on project wallet' });
    }

    // Формирование транзакции
    const seqno = await walletContract.getSeqno();
    const transfer = walletContract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: sellerAddress,
          value: toNano(sellerPayout),
          bounce: true,
        }),
      ],
    });

    // Отправка транзакции
    await walletContract.send(transfer);

    return res.status(200).json({ success: true, message: 'Auto-buy completed' });
  } catch (error) {
    console.error('Auto-buy error:', error);
    return res.status(500).json({ success: false, message: 'Auto-buy failed' });
  }
}
