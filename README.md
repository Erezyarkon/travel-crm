# Travel CRM — erezyarkon.com

מערכת CRM לסוכנות נסיעות. בנויה עם React + TypeScript + Supabase.

## התקנה מקומית

```bash
git clone https://github.com/YOUR_USERNAME/travel-crm
cd travel-crm
npm install
cp .env.example .env.local
# מלא את פרטי Supabase ב-.env.local
npm start
```

## פריסה ל-Vercel

1. דחוף לגיטהאב
2. חבר ל-Vercel
3. הוסף משתני סביבה:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

## Supabase Schema

הרץ את `src/lib/supabaseSchema.sql` ב-SQL Editor של Supabase.

## מבנה הפרויקט

```
src/
  pages/
    Dashboard.tsx     — דשבורד ראשי
    Clients.tsx       — רשימת לקוחות
    ClientCard.tsx    — כרטיס לקוח + הזמנות
    NewClient.tsx     — פתיחת תיק חדש
    Bookings.tsx      — כל ההזמנות
    Suppliers.tsx     — ספקים
    Reports.tsx       — דוחות
    Settings.tsx      — הגדרות
  components/
    Layout.tsx        — תפריט + ניווט
  lib/
    supabase.ts       — חיבור Supabase
    supabaseSchema.sql — סכמת מסד נתונים
  types/
    index.ts          — טיפוסי TypeScript
```
