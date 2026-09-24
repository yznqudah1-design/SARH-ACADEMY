# نشر أكاديمية صرح على Cloudflare — دون سطر أوامر

## أولاً: إنشاء GitHub مجاناً

1. افتح `https://github.com/signup` وأنشئ حساباً.
2. بعد تسجيل الدخول اختر **New repository**.
3. اكتب الاسم: `sarh-academy`.
4. اختر **Private** ثم اضغط **Create repository**.
5. فك ضغط ملف `sarh-academy-production.zip` على جهازك.
6. داخل مستودع GitHub اضغط **uploading an existing file**.
7. اسحب **محتويات** المجلد بعد فك الضغط، بحيث تظهر المجلدات `public` و`functions` و`supabase` في جذر المستودع.
8. اضغط **Commit changes**.

## ثانياً: ربط المستودع مع Cloudflare Pages

1. افتح `https://dash.cloudflare.com`.
2. انتقل إلى **Workers & Pages → Create application → Pages → Connect to Git**.
3. اربط حساب GitHub واختر مستودع `sarh-academy`.
4. استخدم الإعدادات التالية:
   - Project name: `sarh-academy`
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: اتركه فارغاً
   - Build output directory: `public`
   - Root directory: `/`
5. اضغط **Save and Deploy**.

## ثالثاً: إضافة أسرار الخادم

من Supabase افتح **Project Settings → API Keys** وانسخ المفتاح السري الذي يبدأ بـ `sb_secret_`.

> لا تضع المفتاح السري في GitHub ولا ترسله في المحادثة.

في Cloudflare افتح مشروع Pages ثم **Settings → Variables and Secrets** وأضف القيم التالية لبيئتي Production وPreview:

| الاسم | القيمة | النوع |
|---|---|---|
| `SUPABASE_URL` | `https://bnjjbxrgifzbfawhhgja.supabase.co` | Text |
| `SUPABASE_SECRET_KEY` | المفتاح الذي يبدأ بـ `sb_secret_` | Secret / Encrypt |
| `LOGIN_DOMAIN` | `sarh-login.app` | Text |

بعد الحفظ افتح **Deployments** ثم اختر **Retry deployment** أو أنشئ نشرًا جديداً.

## رابعاً: ضبط عنوان الموقع في Supabase

بعد ظهور رابط Cloudflare الفعلي، افتح Supabase:

**Authentication → URL Configuration**

- Site URL: `https://sarh-academy.pages.dev` أو الرابط الذي خصصه Cloudflare.
- Redirect URLs: أضف الرابط نفسه متبوعاً بـ `/**`.

## خامساً: الاختبار النهائي

1. افتح رابط `pages.dev`.
2. ادخل إلى لوحة الإدارة باسم `admin` وكلمة المرور التي أنشأتها.
3. أرسل طلب انضمام تجريبياً من متصفح آخر.
4. اقبل الطلب من لوحة الإدارة وأنشئ بيانات دخول للمتدرب.
5. سجّل الدخول بحساب المتدرب الجديد.

إذا ظهر خطأ في قبول المستخدم، تحقق أولاً من وجود `SUPABASE_SECRET_KEY` في Cloudflare ومن إعادة النشر بعد إضافته.
