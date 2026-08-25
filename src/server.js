'use strict';

const path = require('path');
const express = require('express');
const { config, assertConfigured } = require('./config');
const { parseRecipients } = require('./phone');
const { sendBulk } = require('./cartatClient');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

/** حالة سريعة للتأكد أن الخادم يعمل والتوكن مضبوط. */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    configured: Boolean(config.token),
    baseUrl: config.baseUrl,
    sendPath: config.sendPath,
    defaultCountryCode: config.defaultCountryCode,
    sendDelayMs: config.sendDelayMs,
  });
});

/**
 * يستقبل الأرقام والرسالة ويرسلها عبر Cartat.
 * body: { recipients: string, message: string, dryRun?: boolean, delayMs?: number }
 */
app.post('/api/send', async (req, res) => {
  try {
    assertConfigured();

    const { recipients, message, dryRun, delayMs } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ ok: false, error: 'الرسالة فارغة.' });
    }

    const { valid, invalid } = parseRecipients(recipients, config.defaultCountryCode);

    if (valid.length === 0) {
      return res.status(400).json({ ok: false, error: 'لا توجد أرقام صالحة.', invalid });
    }

    // وضع التجربة: يعرض ما سيُرسل دون إرسال فعلي
    if (dryRun) {
      return res.json({
        ok: true,
        dryRun: true,
        wouldSend: valid.length,
        recipients: valid,
        invalid,
      });
    }

    const summary = await sendBulk(valid, String(message), {
      delayMs: delayMs != null ? Number(delayMs) : undefined,
    });

    return res.json({
      ok: true,
      total: valid.length,
      sent: summary.sent,
      failed: summary.failed,
      invalid,
      results: summary.results,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`\n✅ تطبيق كارتات يعمل على: http://localhost:${config.port}`);
  if (!config.token) {
    console.log('⚠️  تحذير: CARTAT_TOKEN غير مضبوط. انسخ .env.example إلى .env وضع التوكن.');
  }
});
