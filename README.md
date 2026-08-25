# كارتات — إرسال رسائل واتساب عبر Cartat API

تطبيق بسيط لإرسال رسائل واتساب التسويقية عبر [Cartat WhatsApp API](https://docs.cartat.net/cartat-api)،
بواجهة ويب عربية سهلة + أداة سطر أوامر.

> ⚠️ **مهم:** أرسل فقط لأشخاص وافقوا على استقبال رسائلك (opt-in). الإرسال الجماعي
> العشوائي يعرّض رقمك للحظر ويخالف سياسة واتساب.

---

## المميزات

- ✅ واجهة ويب عربية (RTL) لإدخال الأرقام والرسالة والإرسال بضغطة زر
- ✅ إرسال جماعي مع **تأخير بين الرسائل** لحماية الرقم من الحظر
- ✅ توحيد صيغة الأرقام تلقائياً (إضافة كود الدولة، تنظيف المسافات والرموز)
- ✅ وضع **تجربة (Dry run)** يعرض من سيصله دون إرسال فعلي
- ✅ أداة سطر أوامر للإرسال من ملف أو قائمة أرقام
- ✅ التوكن يُحفظ في `.env` ولا يُرفع على git إطلاقاً

---

## التشغيل

### 1) المتطلبات
- [Node.js](https://nodejs.org) نسخة 18 أو أحدث

### 2) التثبيت
```bash
npm install
```

### 3) الإعداد
انسخ ملف الإعداد وضع التوكن الخاص بك:
```bash
cp .env.example .env
```
ثم افتح `.env` وضع قيمة `CARTAT_TOKEN` — تحصل عليه من:
<https://app.cartat.net/store/api>

### 4) التشغيل (واجهة الويب)
```bash
npm start
```
افتح المتصفح على: <http://localhost:3000>

### 5) الإرسال من سطر الأوامر (اختياري)
```bash
# لأرقام محدّدة
node src/cli.js --message "عرض خاص لعملائنا 🎉" --to "01001234567,01112345678"

# من ملف (رقم في كل سطر)
node src/cli.js --message "..." --file numbers.txt

# تجربة بدون إرسال فعلي
node src/cli.js --message "..." --to "01001234567" --dry
```

---

## ضبط شكل طلب Cartat

الإعداد الافتراضي يرسل الطلب هكذا:

```
POST {CARTAT_BASE_URL}{CARTAT_SEND_PATH}
Authorization: Bearer {CARTAT_TOKEN}
{
  "phone":   "2010xxxxxxxx",
  "message": "نص الرسالة"
}
```

**إن اختلف التوثيق** ([docs.cartat.net](https://docs.cartat.net/cartat-api)) عن ذلك، عدّل
القيم في `.env` دون لمس الكود:

| المتغيّر | الوظيفة | الافتراضي |
|---|---|---|
| `CARTAT_BASE_URL` | الرابط الأساسي | `https://hub.cartat.net` |
| `CARTAT_SEND_PATH` | مسار الإرسال | `/api/send` |
| `CARTAT_AUTH_MODE` | طريقة التوكن: `bearer`/`header`/`query`/`body` | `bearer` |
| `CARTAT_TOKEN_HEADER` | اسم الترويسة عند `header` | `Authorization` |
| `CARTAT_PHONE_FIELD` | اسم حقل الرقم في الطلب | `phone` |
| `CARTAT_MESSAGE_FIELD` | اسم حقل الرسالة في الطلب | `message` |
| `CARTAT_TOKEN_FIELD` | اسم حقل التوكن عند `query`/`body` | `token` |
| `DEFAULT_COUNTRY_CODE` | كود الدولة الافتراضي | `20` |
| `SEND_DELAY_MS` | التأخير بين الرسائل (مللي ثانية) | `4000` |
| `PORT` | منفذ خادم الويب | `3000` |

---

## بنية المشروع

```
.
├── public/
│   └── index.html        # واجهة الويب العربية
├── src/
│   ├── config.js         # قراءة الإعدادات من .env
│   ├── phone.js          # توحيد صيغة الأرقام
│   ├── cartatClient.js   # عميل Cartat API (كل تفاصيل الطلب هنا)
│   ├── server.js         # خادم Express + API
│   └── cli.js            # الإرسال من سطر الأوامر
├── .env.example          # نموذج الإعدادات
└── package.json
```

---

## الأمان

- لا تضع التوكن داخل الكود أبداً — استخدم `.env` فقط (مُستثنى من git).
- إن انكشف التوكن، ألغِه وأنشئ واحداً جديداً من لوحة تحكم Cartat.
