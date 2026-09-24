# أكاديمية صرح

منصة عربية للدورات الهندسية مع طلبات انضمام، موافقة إدارية، حسابات متدربين، ووضع مظلم.

## معاينة محلية

```bash
python3 -m http.server 4173 --bind 0.0.0.0 --directory public
```

الوضع الحالي يبقى تجريبياً عندما تكون `PRODUCTION_MODE: false` في `public/config.js`.

## تشغيل إنتاجي

- الواجهة والاستضافة: Cloudflare Pages
- قاعدة البيانات والمصادقة: Supabase PostgreSQL + Auth
- وظائف الإدارة السرية: Cloudflare Pages Functions
- المخطط: `supabase/schema.sql`
- دليل الإعداد العربي: `PRODUCTION_SETUP_AR.md`

لا تضع مفتاح Supabase السري `sb_secret_...` في ملفات الواجهة. يضاف كسرّ مشفر داخل Cloudflare فقط.
