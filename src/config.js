'use strict';

require('dotenv').config();

/**
 * يجمع كل الإعدادات في مكان واحد ويوفّر قيم افتراضية معقولة.
 * كل ما يخص شكل طلب Cartat يمكن ضبطه من ملف .env دون تعديل الكود.
 */
const config = {
  token: process.env.CARTAT_TOKEN || '',
  baseUrl: (process.env.CARTAT_BASE_URL || 'https://hub.cartat.net').replace(/\/+$/, ''),
  sendPath: process.env.CARTAT_SEND_PATH || '/api/send',

  authMode: (process.env.CARTAT_AUTH_MODE || 'bearer').toLowerCase(),
  tokenHeader: process.env.CARTAT_TOKEN_HEADER || 'Authorization',

  phoneField: process.env.CARTAT_PHONE_FIELD || 'phone',
  messageField: process.env.CARTAT_MESSAGE_FIELD || 'message',
  tokenField: process.env.CARTAT_TOKEN_FIELD || 'token',

  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '20',
  sendDelayMs: parseInt(process.env.SEND_DELAY_MS || '4000', 10),

  port: parseInt(process.env.PORT || '3000', 10),
};

/** يتحقق من وجود التوكن ويرمي خطأً واضحاً إن كان ناقصاً. */
function assertConfigured() {
  if (!config.token) {
    throw new Error(
      'CARTAT_TOKEN غير مضبوط. انسخ .env.example إلى .env وضع التوكن من https://app.cartat.net/store/api'
    );
  }
}

module.exports = { config, assertConfigured };
