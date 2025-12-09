// Edge Function: process-reminders
// Tự động gửi tin nhắn nhắc nhở cho học sinh dựa trên bảng "reminders"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  // 🔐 Lấy biến môi trường (tên phải trùng với secrets bạn tạo trong Supabase)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!; // hoặc SUPABASE_SERVICE_ROLE_KEY nếu bạn dùng tên đó

  // Tạo client có quyền service-role
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date().toISOString();

  // 1️⃣ Lấy tất cả reminders chưa gửi & đã đến giờ gửi
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, message_id, student_id, teacher_id, memo")
    .eq("is_sent", false)
    .lte("reminder_datetime", now)
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

  for (const r of reminders) {
    // 2️⃣ Lấy tiêu đề message gốc
    const { data: originalMsg, error: msgError } = await supabase
      .from("messages")
      .select("title")
      .eq("id", r.message_id)
      .maybeSingle();

    if (msgError) {
      console.error("Error loading original message:", msgError);
      continue;
    }

    const baseTitle = originalMsg?.title || "Nhắc nhở học tập";
    const title = `【Nhắc nhở】${baseTitle}`;
    const content = r.memo || "Bạn có một nhắc nhở mới.";

    // 3️⃣ Tạo tin nhắn mới gửi cho học sinh
    const { error: insertError } = await supabase.from("messages").insert({
      title,
      content,           // 🔴 QUAN TRỌNG: phải là 'content', không phải 'body'
      status: "未読",     // chưa đọc
      sender_id: r.teacher_id,
      recipient_id: r.student_id,
      // is_complex & require_confirmation có default false nên có thể bỏ
    });

    if (insertError) {
      console.error("Error inserting reminder message:", insertError);
      continue;
    }

    // 4️⃣ Đánh dấu reminder đã gửi
    const { error: updateError } = await supabase
      .from("reminders")
      .update({
        is_sent: true,
        sent_at: new Date().toISOString(), // nhớ tạo cột sent_at nếu chưa có
      })
      .eq("id", r.id);

    if (updateError) {
      console.error("Error updating reminder:", updateError);
      continue;
    }

    processed++;
  }

  // 5️⃣ Trả kết quả
  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
