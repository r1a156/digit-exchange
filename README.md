Цифра Биржа (Digit Exchange)

Платформа для децентрализованного обмена цифровых активов на блокчейне TON.

Возможности

Подключение TON-кошельков (например, TonKeeper) через TonConnect.

Выполнение сделок с заданными ценами и распределением роялти.

Визуализация цен с помощью Chart.js.

Загрузка и отображение XLSX-файлов.

Экспорт истории транзакций в XLSX.

Отображение QR-кода для кошелька проекта.

Установка

Клонируй репозиторий:

git clone https://github.com/r1a156/digit-exchange.git cd digit-exchange

Запусти локально:

python -m http.server 8000

Открой http://localhost:8000 в браузере.

Настройка TON:

Замени YOUR_CONTRACT_ADDRESS и YOUR_CONTRACT_ABI в index.html на данные твоего TON-контракта.

Для продакшена обнови tonconnect-manifest.json с твоим доменом (например, https://your-domain.com).

Настрой прокси для TON API (см. ниже).

Прокси для бэкенда (опционально): Создай Node.js сервер для TON API:

const express = require('express'); const axios = require('axios'); const app = express(); app.get('/api/ton/transactions', async (req, res) => { try { const { address, limit } = req.query; const response = await axios.get(https://testnet.toncenter.com/api/v2/getTransactions?address=${address}&limit=${limit}, { headers: { 'X-API-Key': 'YOUR_TONCENTER_API_KEY' } }); res.json(response.data); } catch (err) { res.status(500).json({ error: err.message }); } }); app.listen(3000, () => console.log('Server on :3000'));

Обнови fetchHistory в index.html для использования /api/ton/transactions.

Зависимости

React 18.3.1

Tailwind CSS 2.2.19

Chart.js 4.4.4

XLSX 0.18.5

TonWeb 2.0.0

@tonconnect/sdk 3.0.3

QRCode.js 1.5.3

Примечания

Код использует мок-контракт TON и историю для тестирования.

Разверни на Vercel/Netlify с HTTPS для продакшена.

Убедись, что tonconnect-manifest.json доступен публично.

Лицензия

MIT License
