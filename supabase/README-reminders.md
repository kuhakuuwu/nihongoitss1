# Supabase Reminders (Scheduled)

Mục tiêu: khi đến `reminders.reminder_datetime` hệ thống tự động gửi email nhắc nhở (Resend) và đánh dấu `reminders.is_sent=true`.

## 1) Chuẩn bị secrets (bắt buộc)

Edge Function `process-reminders` cần các biến môi trường sau:

- `SUPABASE_URL` (Supabase cung cấp sẵn trong môi trường Edge Function)
- `SUPABASE_SERVICE_ROLE_KEY` (bạn tự set, hoặc dùng tên cũ `SERVICE_ROLE_KEY`)
- `RESEND_API_KEY` (API key của Resend)
- `CRON_SECRET` (chuỗi bí mật do bạn tự đặt để scheduler gọi function)

Thiết lập bằng Supabase CLI (chạy trong thư mục `supabase/`):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" \
  RESEND_API_KEY="<resend_api_key>" \
  CRON_SECRET="<random_long_secret>"
```

Gợi ý: `CRON_SECRET` nên là chuỗi dài ngẫu nhiên (>= 32 ký tự).

## 2) Deploy Edge Function

```bash
supabase functions deploy process-reminders
```

Lưu ý: trong `config.toml` đã đặt `verify_jwt=false` để scheduler có thể gọi được.

## 3) Cấu hình lịch chạy (Scheduled Trigger)

### Cách khuyến nghị (Supabase Dashboard)

1. Vào Supabase Dashboard → **Edge Functions** → chọn function **process-reminders**
2. Mở **Scheduled Triggers** → **Create**
3. Cron expression (chạy mỗi phút):

   - `* * * * *`

4. Thêm HTTP header:

   - `x-cron-secret: <CRON_SECRET>`

5. Lưu lại.

Vì function sẽ lọc theo `reminder_datetime <= now` và `is_sent=false`, chạy mỗi phút là đủ.

### Test nhanh thủ công (local)

Nếu bạn đang serve function local:

```bash
supabase functions serve process-reminders
```

Gọi thử bằng PowerShell:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:54321/functions/v1/process-reminders" `
  -Headers @{ "x-cron-secret" = "<CRON_SECRET>" }
```

## 4) Logic gửi reminder

- Chỉ lấy reminders: `is_sent=false` và `reminder_datetime <= now`.
- Nếu `remind_on_no_reply=true`: function kiểm tra đã có reply của học sinh chưa (bảng `messages` với `parent_id=message_id` và `sender_id=student_id`). Nếu đã reply thì **không gửi email** và đánh dấu reminder là đã xử lý.

## 5) Troubleshooting

- Nếu scheduler báo 401: kiểm tra header `x-cron-secret` có đúng `CRON_SECRET` không.
- Nếu báo thiếu env: kiểm tra đã `supabase secrets set ...` và deploy lại.
- Nếu không gửi được email: kiểm tra `RESEND_API_KEY` và `from:` trong code (`onboarding@resend.dev` chỉ dùng thử nghiệm).
