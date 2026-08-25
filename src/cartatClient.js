'use strict';

const axios = require('axios');
const { config } = require('./config');

/**
 * =========================================================================
 *  عميل Cartat WhatsApp API
 * =========================================================================
 *  كل تفاصيل شكل الطلب مجمّعة هنا وقابلة للضبط من .env، حتى لو اختلف
 *  التوثيق (docs.cartat.net) عن الإعداد الافتراضي، تعدّل .env فقط.
 *
 *  الافتراضي:
 *    POST {baseUrl}{sendPath}
 *    Authorization: Bearer {token}
 *    body: { phone: "2010...", message: "..." }
 *
 *  إن كان التوثيق يستخدم أسماء حقول أو مساراً مختلفاً، غيّر المتغيرات:
 *    CARTAT_SEND_PATH, CARTAT_PHONE_FIELD, CARTAT_MESSAGE_FIELD,
 *    CARTAT_AUTH_MODE, CARTAT_TOKEN_HEADER, CARTAT_TOKEN_FIELD
 * =========================================================================
 */

/** يبني ترويسات الطلب حسب طريقة المصادقة المختارة. */
function buildHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };

  if (config.authMode === 'bearer') {
    headers.Authorization = `Bearer ${config.token}`;
  } else if (config.authMode === 'header') {
    headers[config.tokenHeader] = config.token;
  }

  return headers;
}

/** يبني رابط الطلب، ويضيف التوكن كـ query إن لزم. */
function buildUrl() {
  let url = `${config.baseUrl}${config.sendPath}`;
  if (config.authMode === 'query') {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}${encodeURIComponent(config.tokenField)}=${encodeURIComponent(config.token)}`;
  }
  return url;
}

/** يبني جسم الطلب، ويضيف التوكن داخله إن كانت الطريقة body. */
function buildBody(phone, message) {
  const body = {
    [config.phoneField]: phone,
    [config.messageField]: message,
  };
  if (config.authMode === 'body') {
    body[config.tokenField] = config.token;
  }
  return body;
}

/**
 * يرسل رسالة نصية واحدة عبر Cartat.
 * @param {string} phone رقم موحّد (أرقام فقط مع كود الدولة)
 * @param {string} message نص الرسالة
 * @returns {Promise<{ok: boolean, status?: number, data?: any, error?: string}>}
 */
async function sendMessage(phone, message) {
  try {
    const response = await axios.post(buildUrl(), buildBody(phone, message), {
      headers: buildHeaders(),
      timeout: 30000,
      // نتحقق من الحالة بأنفسنا حتى نُرجع رسالة خطأ واضحة
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, status: response.status, data: response.data };
    }

    return {
      ok: false,
      status: response.status,
      error: extractError(response.data) || `HTTP ${response.status}`,
    };
  } catch (err) {
    return { ok: false, error: err.message || 'خطأ غير معروف في الشبكة' };
  }
}

/** يحاول استخراج رسالة خطأ مقروءة من رد الخادم. */
function extractError(data) {
  if (!data) return null;
  if (typeof data === 'string') return data.slice(0, 300);
  return data.message || data.error || data.msg || JSON.stringify(data).slice(0, 300);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * يرسل رسالة لعدة أرقام بالتتابع مع تأخير بينها (لحماية الرقم من الحظر).
 * @param {string[]} phones أرقام موحّدة
 * @param {string} message نص الرسالة
 * @param {object} [opts]
 * @param {number} [opts.delayMs] التأخير بين الرسائل
 * @param {(p:{index:number,total:number,phone:string,result:object})=>void} [opts.onProgress]
 * @returns {Promise<{sent:number, failed:number, results:Array}>}
 */
async function sendBulk(phones, message, opts = {}) {
  const delayMs = opts.delayMs != null ? opts.delayMs : config.sendDelayMs;
  const results = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    const result = await sendMessage(phone, message);
    if (result.ok) sent++;
    else failed++;

    const entry = { phone, ...result };
    results.push(entry);

    if (typeof opts.onProgress === 'function') {
      opts.onProgress({ index: i, total: phones.length, phone, result: entry });
    }

    // لا تنتظر بعد آخر رسالة
    if (i < phones.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return { sent, failed, results };
}

module.exports = { sendMessage, sendBulk };
