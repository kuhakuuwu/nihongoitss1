// Edge Function: process-reminders
// Tự động gửi email nhắc nhở cho học sinh dựa trên bảng "reminders"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 🔐 Bảo vệ endpoint: chỉ scheduler/cron mới được gọi
  // (Vì `verify_jwt=false` trong config.toml)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: "Missing CRON_SECRET env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providedSecret = req.headers.get("x-cron-secret") ?? "";
  if (providedSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 🔐 Lấy biến môi trường
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY") ??
    "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""; // API key từ Resend

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing required env",
        missing: {
          SUPABASE_URL: !supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY_or_SERVICE_ROLE_KEY: !serviceRoleKey,
          RESEND_API_KEY: !resendApiKey,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Tạo client có quyền service-role
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const nowIso = new Date().toISOString();

  // 1️⃣ Lấy tất cả reminders chưa gửi & đã đến giờ gửi
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select(
      "id, message_id, student_id, teacher_id, memo, remind_on_no_reply, reminder_datetime",
    )
    .eq("is_sent", false)
    .lte("reminder_datetime", nowIso)
    .limit(100);

  if (error) {
    console.error("Error loading reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!reminders || reminders.length === 0) {
    // Không có reminder nào đến hạn
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let skippedBecauseReplied = 0;

  for (const r of reminders) {
    // Nếu chỉ nhắc khi chưa phản hồi: kiểm tra học sinh đã reply chưa
    if (r.remind_on_no_reply) {
      const { data: existingReply, error: replyErr } = await supabase
        .from("messages")
        .select("id")
        .eq("parent_id", r.message_id)
        .eq("sender_id", r.student_id)
        .limit(1);

      if (replyErr) {
        console.error("Error checking replies:", replyErr);
        // Không chắc chắn trạng thái reply => bỏ qua vòng này để tránh gửi nhầm
        continue;
      }

      if (existingReply && existingReply.length > 0) {
        // Đã phản hồi => không gửi email nữa; đánh dấu reminder như đã xử lý
        await supabase
          .from("reminders")
          .update({
            is_sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq("id", r.id);
        skippedBecauseReplied++;
        continue;
      }
    }

    // 2️⃣ Lấy thông tin message gốc và user
    const { data: originalMsg } = await supabase
      .from("messages")
      .select("title")
      .eq("id", r.message_id)
      .maybeSingle();

    const { data: student } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("username", r.student_id)
      .maybeSingle();

    const { data: teacher } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("username", r.teacher_id)
      .maybeSingle();

    if (!student?.email) {
      console.error(`Student ${r.student_id} has no email`);
      continue;
    }

    const baseTitle = originalMsg?.title || "Nhắc nhở học tập";
    const title = `【Nhắc nhở】${baseTitle}`;
    const content = r.memo || "Bạn có một nhắc nhở mới.";
    const teacherName = teacher ? `${teacher.last_name} ${teacher.first_name}` : r.teacher_id;
    const studentName = student ? `${student.last_name} ${student.first_name}` : r.student_id;

    // 3️⃣ Gửi email qua Resend
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EduConnect <onboarding@resend.dev>", // Thay bằng domain của bạn
          to: [student.email],
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">📧 Nhắc nhở từ giáo viên</h2>
              <p>Xin chào <strong>${studentName}</strong>,</p>
              <p>Giáo viên <strong>${teacherName}</strong> gửi nhắc nhở về tin nhắn:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">${baseTitle}</h3>
                <p style="margin: 0; color: #4b5563;">${content}</p>
              </div>
              <p>Vui lòng truy cập hệ thống để xem chi tiết và phản hồi.</p>
              <a href="${supabaseUrl.replace('/rest/v1', '')}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Xem tin nhắn
              </a>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Email tự động từ hệ thống EduConnect
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Resend API error:", errorText);
        continue;
      }

      console.log(`Email sent to ${student.email}`);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      continue;
    }

    // 4️⃣ Tạo tin nhắn trong hệ thống
    await supabase.from("messages").insert({
      title,
      content,
      status: "未読",
      sender_id: r.teacher_id,
      recipient_id: r.student_id,
    });

    // 5️⃣ Đánh dấu reminder đã gửi
    await supabase
      .from("reminders")
      .update({
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", r.id);

    processed++;
  }

  // 6️⃣ Trả kết quả
  return new Response(
    JSON.stringify({
      ok: true,
      processed,
      skippedBecauseReplied,
      message: `Đã gửi ${processed} email nhắc nhở`,
    }),
    {
    headers: { "Content-Type": "application/json" },
    },
  );
});
 
 