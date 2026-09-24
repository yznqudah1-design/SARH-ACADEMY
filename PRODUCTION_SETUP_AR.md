# تشغيل أكاديمية صرح إنتاجياً — Supabase + Cloudflare Pages

هذه البنية تحافظ على اسم المستخدم وكلمة المرور للمتدرب، لكن كلمة المرور تُحفظ داخل Supabase Auth بعد تشفيرها ولا تُخزّن في جداول المنصة كنص واضح.

## 1) إنشاء مشروع Supabase مجاناً

1. افتح `https://supabase.com` وأنشئ حساباً.
2. اختر **New project** واكتب اسماً مثل `sarh-academy`.
3. اختر منطقة قريبة من المستخدمين واحفظ كلمة مرور قاعدة البيانات في مكان آمن.
4. من **SQL Editor** أنشئ استعلاماً جديداً والصق محتوى `supabase/schema.sql` ثم اضغط **Run**.

## 2) إنشاء حساب مدير المنصة الأول

1. من Supabase افتح **Authentication → Users → Add user**.
2. استخدم البريد الوهمي المخصص للدخول: `admin@sarh-login.app`.
3. اختر كلمة مرور قوية وفعّل **Auto Confirm User**.
4. ارجع إلى **SQL Editor** وشغّل التالي بعد استبدال البريد إذا غيّرته:

```sql
update public.profiles p
set role='admin', full_name='مدير أكاديمية صرح'
from auth.users u
where p.id=u.id and u.email='admin@sarh-login.app';
```

بعدها يكون اسم الدخول في الواجهة `admin` وكلمة المرور هي التي اخترتها.

## 3) ربط الواجهة بالمشروع

1. افتح **Project Settings → API** في Supabase.
2. انسخ **Project URL** و **anon public key** فقط.
3. ضع القيم في `public/config.js` واجعل:

```js
PRODUCTION_MODE: true
```

> لا تضع `service_role` في `config.js` أو أي ملف يصل إلى المتصفح.

## 4) إنشاء Cloudflare Pages والنطاق المجاني

1. أنشئ حساباً مجانياً في `https://dash.cloudflare.com`.
2. افتح **Workers & Pages → Create → Pages** واربط مستودع GitHub للمشروع (الطريقة الأسهل لدعم وظائف الإدارة)، أو انشر باستخدام Wrangler.
3. استخدم اسم المشروع `sarh-academy` للحصول على نطاق قريب من:
   `https://sarh-academy.pages.dev` (بحسب توفر الاسم).
4. لا يحتاج المشروع أمر Build؛ اجعل مجلد النشر `public`. مجلد `functions` يُكتشف تلقائياً عند الربط من GitHub.

بديل النشر عبر Wrangler من جهازك:

```bash
npx wrangler pages deploy public --project-name sarh-academy
```

> لا تستخدم رفع الملفات بالسحب فقط إذا أردت تشغيل وظائف قبول ورفض المستخدمين؛ استخدم GitHub أو Wrangler لضمان نشر مجلد `functions`.

## 5) إضافة أسرار الخادم إلى Cloudflare

من إعدادات مشروع Pages افتح **Settings → Variables and Secrets** وأضف:

- `SUPABASE_URL` = رابط مشروع Supabase.
- `SUPABASE_SECRET_KEY` = المفتاح السري الذي يبدأ بـ `sb_secret_` من Supabase.
- `LOGIN_DOMAIN` = `sarh-login.app`.

اجعل `SUPABASE_SECRET_KEY` من نوع **Secret/Encrypted**. لا تضعه في ملفات المشروع ولا ترسله لأي شخص. أعد النشر بعد الإضافة.

## 6) إعدادات الأمان الموصى بها

- من Supabase → Authentication عطّل **Allow new users to sign up** لأن الحسابات يصدرها الأدمن فقط.
- فعّل حماية CAPTCHA لطلب الانضمام عند بدء استقبال زيارات عامة.
- غيّر كلمة مرور الأدمن دورياً ولا تشارك مفتاح service_role.
- أنشئ نسخاً احتياطية دورية للطلبات والمتدربين.

## 7) سير العمل بعد النشر

1. الزائر يرسل طلب انضمام؛ يُحفظ عبر دالة آمنة في قاعدة البيانات.
2. الأدمن يدخل باسم `admin` ويرى الطلبات فقط بسبب سياسات RLS.
3. عند القبول يُنشئ الأدمن اسم مستخدم وكلمة مرور.
4. وظيفة Cloudflare الآمنة تنشئ حساب Supabase Auth وتربطه بالدورة.
5. المتدرب يدخل باسمه وكلمة مروره، ولا يمكنه قراءة بيانات أي متدرب آخر.

## حدود الخطة المجانية

الخدمات المجانية مناسبة للإطلاق الأولي والتجربة، لكنها تملك حدوداً شهرية للسعة والنقل وعدد الطلبات. يمكن الترقية لاحقاً دون تغيير بنية المنصة.
