// Supabase Edge Function: send-otp-email
// Deploy this to Supabase Edge Functions

// @ts-ignore - Deno imports work in Supabase Edge Functions runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno global is available in Supabase Edge Functions
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otpCode, language = 'vn' } = await req.json()

    // Validate input
    if (!email || !otpCode) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP code are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Email content in Vietnamese
    const styles = `
    <style>
        body { margin: 0; padding: 0; background-color: #f4f7f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f5; padding-bottom: 40px; }
        .container { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-top: 40px; }
        .header { padding: 40px 0; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f0fdf4; }
        .brand { font-size: 24px; font-weight: 800; color: #16a34a; text-decoration: none; letter-spacing: -0.5px; }
        .content { padding: 40px 50px; color: #374151; line-height: 1.6; }
        .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; text-align: center; }
        .otp-container { background-color: #f0fdf4; border-radius: 12px; padding: 32px; text-align: center; margin: 24px 0; border: 1px solid #dcfce7; }
        .otp-label { font-size: 13px; font-weight: 600; color: #15803d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .otp-code { font-size: 42px; font-weight: 800; color: #16a34a; letter-spacing: 10px; font-family: 'Monaco', monospace; margin: 10px 0; }
        .expiry { font-size: 13px; color: #6b7280; margin-top: 8px; }
        .security-note { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 32px; }
        .security-title { display: flex; align-items: center; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 10px; }
        .security-list { margin: 0; padding-left: 20px; font-size: 13px; color: #6b7280; }
        .security-list li { margin-bottom: 6px; }
        .footer { text-align: center; padding: 30px; color: #9ca3af; font-size: 12px; }
        .social-link { color: #16a34a; text-decoration: none; font-weight: 600; }
        @media screen and (max-width: 600px) { .content { padding: 30px 20px; } }
    </style>
    `;

    // Icon Shield từ Lucide (dạng inline SVG để hiển thị tốt trong email)
    const iconShield = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

    const emailContentVN = {
    subject: 'Mã xác thực đặt lại mật khẩu - EduConnect',
    html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head><meta charset="UTF-8">${styles}</head>
        <body>
        <div class="wrapper">
            <div class="container">
            <div class="header">
                <a href="#" class="brand">EduConnect</a>
            </div>
            <div class="content">
                <h1 class="title">Xác nhận thay đổi mật khẩu</h1>
                <p>Xin chào,</p>
                <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây để tiếp tục:</p>
                
                <div class="otp-container">
                <div class="otp-label">Mã OTP của bạn</div>
                <div class="otp-code">${otpCode}</div>
                <div class="expiry">Hiệu lực trong vòng <b>10 phút</b></div>
                </div>

                <div class="security-note">
                <div class="security-title">${iconShield} Bảo mật tài khoản</div>
                <ul class="security-list">
                    <li>Tuyệt đối không cung cấp mã này cho người khác.</li>
                    <li>Nhân viên EduConnect không bao giờ yêu cầu mã này qua điện thoại hoặc tin nhắn.</li>
                    <li>Nếu bạn không thực hiện yêu cầu này, hãy đổi mật khẩu ngay để bảo mật.</li>
                </ul>
                </div>

                <p style="margin-top: 32px; font-size: 14px;">
                Trân trọng,<br>
                <strong>Đội ngũ vận hành EduConnect</strong>
                </p>
            </div>
            <div class="footer">
                <p>© 2025 EduConnect Inc. All rights reserved.</p>
                <p>Email này được gửi tự động. Vui lòng không phản hồi email này.</p>
            </div>
            </div>
        </div>
        </body>
        </html>
    `
    };

    const emailContentJP = {
    subject: '【EduConnect】パスワード再設定の認証コード',
    html: `
        <!DOCTYPE html>
        <html lang="ja">
        <head><meta charset="UTF-8">${styles}</head>
        <body>
        <div class="wrapper">
            <div class="container">
            <div class="header">
                <a href="#" class="brand">EduConnect</a>
            </div>
            <div class="content">
                <h1 class="title">パスワード再設定の確認</h1>
                <p>EduConnectをご利用いただきありがとうございます。</p>
                <p>お客様のアカウントでパスワード再設定のリクエストがありました。以下の認証コードを入力して手続きを完了させてください：</p>
                
                <div class="otp-container">
                <div class="otp-label">認証コード (OTP)</div>
                <div class="otp-code">${otpCode}</div>
                <div class="expiry">有効期限：<b>10分間</b></div>
                </div>

                <div class="security-note">
                <div class="security-title">${iconShield} セキュリティに関する注意</div>
                <ul class="security-list">
                    <li>このコードは第三者に教えないでください。</li>
                    <li>EduConnectからお電話でこのコードを聞くことはありません。</li>
                    <li>心当たりがない場合は、このメールを破棄し、念のためパスワードの変更を推奨します。</li>
                </ul>
                </div>

                <p style="margin-top: 32px; font-size: 14px;">
                今後ともよろしくお願いいたします。<br>
                <strong>EduConnect運営チーム</strong>
                </p>
            </div>
            <div class="footer">
                <p>© 2025 EduConnect Inc. All rights reserved.</p>
                <p>本メールは自動送信専用です。返信は受け付けておりません。</p>
            </div>
            </div>
        </div>
        </body>
        </html>
    `
    };

    const emailContent = language === 'jp' ? emailContentJP : emailContentVN

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'EduConnect <onboarding@resend.dev>', // Change this to your domain
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(
        JSON.stringify({ success: true, messageId: data.id }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      const error = await res.text()
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${error}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: res.status 
        }
      )
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
