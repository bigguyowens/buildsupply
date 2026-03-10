$env:DATABASE_URL="postgresql://neondb_owner:npg_wIrQn0TP2ovB@ep-curly-brook-a8uttnx3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"
cd C:\NextJS_Ecomm

# 1. Run geo migration (safe to run again — uses IF NOT EXISTS)
node migrate_geo.js

# 2. Build & deploy
npm run build
git add .
git commit -m "feat: geo — location column on customers list, geo card on customer detail"
git push
