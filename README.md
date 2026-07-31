# ABC IPTV Activation (Vercel)

`yukle.php` işlevinin Next.js sürümü. Vercel'e doğrudan deploy edilebilir.

## Kurulum

```bash
npm install
npm run dev
```

## Vercel ortam değişkenleri

Project Settings → Environment Variables:

| Key | Açıklama |
|-----|----------|
| `API_URL` | `https://hemengmailal.com/apps/sbox_api.php` |
| `API_TOKEN` | API token |
| `RECAPTCHA_SECRET` | Google reCAPTCHA secret key |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key |

`.env.example` dosyasına bak. Yerelde `.env.local` kullan.

## Deploy

1. Bu klasörü GitHub'a push et
2. [vercel.com](https://vercel.com) → Import Project
3. Ortam değişkenlerini ekle
4. Deploy
