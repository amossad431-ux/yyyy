'use strict';

/**
 * يوحّد صيغة رقم الهاتف إلى أرقام فقط مع كود الدولة، بدون + أو مسافات.
 * أمثلة (كود الدولة الافتراضي 20 — مصر):
 *   "0100 123 4567"  -> "201001234567"
 *   "+20 100 1234567"-> "201001234567"
 *   "00201001234567" -> "201001234567"
 *   "1001234567"     -> "201001234567"
 *
 * @param {string} raw رقم الهاتف كما أدخله المستخدم
 * @param {string} defaultCountryCode كود الدولة الافتراضي بدون +
 * @returns {string|null} الرقم الموحّد أو null إن كان غير صالح
 */
function normalizePhone(raw, defaultCountryCode) {
  if (raw == null) return null;

  let digits = String(raw).trim();
  if (!digits) return null;

  // تحويل 00 البادئة (صيغة دولية) إلى لا شيء
  digits = digits.replace(/^00/, '');
  // إزالة كل ما ليس رقماً (مسافات، +، شرطات، أقواس...)
  digits = digits.replace(/\D/g, '');

  if (!digits) return null;

  const cc = String(defaultCountryCode).replace(/\D/g, '');

  // إن كان الرقم يبدأ بصفر محلي، أزل الصفر وأضف كود الدولة
  if (digits.startsWith('0')) {
    digits = cc + digits.replace(/^0+/, '');
  } else if (cc && !digits.startsWith(cc)) {
    // رقم قصير لا يحمل كود دولة -> أضف الافتراضي
    // (لا نضيف إن كان يبدو أنه يحمل كود دولة بالفعل)
    if (digits.length <= 10) {
      digits = cc + digits;
    }
  }

  // فحص طول منطقي بسيط
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

/**
 * يحوّل نصاً يحوي أرقاماً (سطر لكل رقم أو مفصولة بفواصل) إلى قائمة موحّدة
 * بدون تكرار، مع إبراز الأرقام غير الصالحة.
 */
function parseRecipients(text, defaultCountryCode) {
  const valid = [];
  const invalid = [];
  const seen = new Set();

  const parts = String(text || '')
    .split(/[\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const norm = normalizePhone(part, defaultCountryCode);
    if (!norm) {
      invalid.push(part);
      continue;
    }
    if (seen.has(norm)) continue;
    seen.add(norm);
    valid.push(norm);
  }

  return { valid, invalid };
}

module.exports = { normalizePhone, parseRecipients };
