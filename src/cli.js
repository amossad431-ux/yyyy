'use strict';

/**
 * إرسال من سطر الأوامر.
 * الاستخدام:
 *   node src/cli.js --message "نص الرسالة" --to "0100...,0111..."
 *   node src/cli.js --message "..." --file numbers.txt
 *   أضف --dry للتجربة دون إرسال فعلي.
 */

const fs = require('fs');
const { config, assertConfigured } = require('./config');
const { parseRecipients } = require('./phone');
const { sendBulk } = require('./cartatClient');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry') args.dry = true;
    else if (a === '--message' || a === '-m') args.message = argv[++i];
    else if (a === '--to' || a === '-t') args.to = argv[++i];
    else if (a === '--file' || a === '-f') args.file = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.message) {
    console.error('خطأ: مطلوب --message "نص الرسالة"');
    process.exit(1);
  }

  let recipientsText = args.to || '';
  if (args.file) {
    recipientsText += '\n' + fs.readFileSync(args.file, 'utf8');
  }

  const { valid, invalid } = parseRecipients(recipientsText, config.defaultCountryCode);

  if (invalid.length) {
    console.log(`⚠️  أرقام غير صالحة (${invalid.length}): ${invalid.join(', ')}`);
  }
  if (valid.length === 0) {
    console.error('خطأ: لا توجد أرقام صالحة.');
    process.exit(1);
  }

  console.log(`عدد المستلمين: ${valid.length}`);

  if (args.dry) {
    console.log('— وضع التجربة (لن يُرسل شيء) —');
    valid.forEach((p) => console.log('  →', p));
    return;
  }

  assertConfigured();

  const summary = await sendBulk(valid, args.message, {
    onProgress: ({ index, total, phone, result }) => {
      const mark = result.ok ? '✅' : '❌';
      const extra = result.ok ? '' : ` (${result.error})`;
      console.log(`${mark} [${index + 1}/${total}] ${phone}${extra}`);
    },
  });

  console.log(`\nتم الإرسال: ${summary.sent} | فشل: ${summary.failed}`);
}

main().catch((err) => {
  console.error('خطأ:', err.message);
  process.exit(1);
});
