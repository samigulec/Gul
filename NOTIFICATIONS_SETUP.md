# 🔔 SpinON Bildirim Sistemi Kurulumu

Bu rehber, Farcaster MiniApp bildirimleri için gerekli adımları açıklar.

## 📋 Gereksinimler

- Supabase hesabı
- Supabase CLI (`npm install -g supabase`)

## 🚀 Kurulum Adımları

### 1. Supabase'de Tabloları Oluştur

Supabase Dashboard > SQL Editor'e gidin ve şu SQL'i çalıştırın:

```sql
-- Notification tokens tablosu
CREATE TABLE IF NOT EXISTS notification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    fid BIGINT,
    notification_url TEXT NOT NULL,
    notification_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_tokens_active 
    ON notification_tokens(is_active) WHERE is_active = true;

-- Notification history tablosu
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    message TEXT,
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all notification_tokens" ON notification_tokens FOR ALL USING (true);
CREATE POLICY "Allow all notification_history" ON notification_history FOR ALL USING (true);
```

### 2. Edge Function'ı Deploy Et

Terminal'de proje klasöründe:

```bash
# Supabase CLI'ya giriş yap
supabase login

# Projeyi bağla
supabase link --project-ref oyopelevtazyntkxfieg

# Edge Function'ı deploy et
supabase functions deploy send-notifications
```

### 3. Cron Job Oluştur (Günlük Bildirim)

Supabase Dashboard > Database > Extensions'a git ve `pg_cron` extension'ını etkinleştir.

Sonra SQL Editor'de:

```sql
-- Her gün saat 12:00 UTC'de bildirim gönder
SELECT cron.schedule(
    'daily-spin-reminder',
    '0 12 * * *',  -- Her gün 12:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://oyopelevtazyntkxfieg.supabase.co/functions/v1/send-notifications',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
);
```

### 4. Manuel Test

Edge Function'ı manuel olarak test etmek için:

```bash
curl -X POST https://oyopelevtazyntkxfieg.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 📱 Bildirim Mesajları

Edge function rastgele şu mesajlardan birini seçer:

| Başlık | İçerik |
|--------|--------|
| 🎰 Çark Çevirme Zamanı! | Bugün şansını denedin mi? Hemen spin yap ve kazan! |
| 🎯 Şansını Dene! | SpinON çarkı seni bekliyor. Hemen gir ve kazan! |
| 💰 Günlük Şans! | Bugünkü şans çarkını çevirmeyi unutma! |
| 🔥 Spin Zamanı! | Base üzerinde çark çevir, USDC kazan! |
| 🎲 Hazır mısın? | SpinON seni bekliyor! Çarkı çevir, kazanmaya başla! |

## 🔧 Özelleştirme

### Farklı Saatlerde Bildirim

```sql
-- Sabah 9:00 UTC
SELECT cron.schedule('morning-reminder', '0 9 * * *', ...);

-- Akşam 18:00 UTC  
SELECT cron.schedule('evening-reminder', '0 18 * * *', ...);

-- Sadece Pazartesi günleri
SELECT cron.schedule('monday-reminder', '0 12 * 1 *', ...);
```

### Yeni Mesaj Ekleme

`supabase/functions/send-notifications/index.ts` dosyasındaki `NOTIFICATION_MESSAGES` dizisine yeni mesajlar ekleyin.

## 📊 İzleme

Gönderilen bildirimleri izlemek için:

```sql
SELECT * FROM notification_history ORDER BY created_at DESC LIMIT 10;
```

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Token Geçerliliği**: Kullanıcı uygulamayı kaldırırsa token geçersiz olur
2. **Rate Limiting**: Farcaster'ın bildirim limitlerine dikkat edin
3. **Spam Engelleme**: Günde maksimum 1-2 bildirim gönderin

---

Sorularınız için: @samigulec

