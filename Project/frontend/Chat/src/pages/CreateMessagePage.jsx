// メッセージ作成
import TeacherLayout from "../components/Layout/TeacherLayout";
import { useState, useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";          // ⭐ THÊM
import { supabase } from "../supabaseClient";

export default function CreateMessagePage() {
    const [recipient, setRecipient] = useState("");
    const [students, setStudents] = useState([]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [attachment, setAttachment] = useState(null);

    const [isComplexMessage, setIsComplexMessage] = useState(false);
    const [requireConfirmation, setRequireConfirmation] = useState(false);

    // ⭐ Ban đầu không load gì, chỉ thêm khi gửi
    const [recentMessages, setRecentMessages] = useState([]);

    const navigate = useNavigate();                      // ⭐ THÊM

    // ============================================================
    // 1. Load danh sách học sinh — dùng useEffectEvent để tránh warning
    // ============================================================
    const fetchStudentsEvent = useEffectEvent(async () => {
        const { data, error } = await supabase
            .from("users")
            .select("username")
            .eq("role", "student")
            .order("username", { ascending: true });

        if (!error && data) setStudents(data);
    });

    useEffect(() => {
        fetchStudentsEvent(); // ✅ React 19.2+ khuyến nghị cách này
    }, []);

    // ============================================================
    // 3. Gửi tin nhắn
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const teacher = JSON.parse(localStorage.getItem("user"));
        if (!teacher) {
            alert("ログインが必要です");
            return;
        }

        const payload = {
            sender_id: teacher.username,
            recipient_id: recipient,
            title,
            content,
            status: "未読",
        };

        // ⭐ Lấy luôn bản ghi vừa insert
        const { data, error } = await supabase
            .from("messages")
            .insert(payload)
            .select("*");

        if (error) {
            console.error(error);
            alert("送信に失敗しました");
            return;
        }

        alert("メッセージを送信しました");

        // Reset form
        setRecipient("");
        setTitle("");
        setContent("");
        setAttachment(null);
        setIsComplexMessage(false);
        setRequireConfirmation(false);

        // ⭐ Chỉ thêm tin mới vừa insert vào recentMessages
        if (data && data.length > 0) {
            setRecentMessages((prev) => [data[0], ...prev]);
        }
    };

    // ============================================================
    // 4. UI
    // ============================================================
    return (
        <TeacherLayout title="メッセージ作成">
            <div className="flex gap-6">

                {/* LEFT SIDE */}
                <div className="flex-1 bg-white border rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-6">新しいメッセージ</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* RECIPIENT */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                受信者 <span className="text-red-500">*</span>
                            </label>

                            <select
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">受信者を選択してください</option>

                                {students.map((s) => (
                                    <option key={s.username} value={s.username}>
                                        {s.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* TITLE */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">件名 *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">内容 *</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                                required
                            />
                        </div>

                        {/* ATTACHMENT (UI thôi) */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">添付ファイル</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => setAttachment(e.target.files[0])}
                                />

                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border"
                                >
                                    📎 ファイルを選択
                                </label>

                                {attachment && (
                                    <div className="border rounded-lg px-3 py-2 flex items-center gap-2 bg-gray-50">
                                        <span>{attachment.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachment(null)}
                                            className="text-red-500"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OPTIONS (UI, chưa lưu DB) */}
                        <div className="bg-gray-50 p-4 border rounded-lg space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isComplexMessage}
                                    onChange={(e) => setIsComplexMessage(e.target.checked)}
                                />
                                複雑メッセージ
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={requireConfirmation}
                                    onChange={(e) => setRequireConfirmation(e.target.checked)}
                                />
                                返信を要請
                            </label>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg">
                                送信
                            </button>

                            <button type="button" className="flex-1 bg-gray-200 py-3 rounded-lg">
                                キャンセル
                            </button>
                        </div>

                    </form>
                </div>

                {/* RIGHT SIDE — Recent Messages */}
                <div className="w-96">
                    <div className="bg-gray-50 border rounded-lg h-full flex flex-col">

                        <div className="px-4 py-3 border-b bg-white">
                            <h3 className="font-semibold">最近のメッセージ</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">

                            {/* Khi chưa có tin nhắn */}
                            {recentMessages.length === 0 && (
                                <p className="text-gray-400 text-sm">
                                    まだメッセージがありません。
                                </p>
                            )}

                            {/* Khi có tin nhắn */}
                            {recentMessages.map((m) => (
                                <div
                                    key={m.id}
                                    className="bg-white border shadow-sm rounded-lg p-3 hover:shadow-md transition cursor-pointer"
                                    onClick={() => navigate(`/teacher/history/${m.id}`)}  // ⭐ THÊM
                                >
                                    <div className="flex items-start gap-3">

                                        <div className="w-10 h-10 rounded-full bg-blue-200 flex justify-center items-center">
                                            {m.title.charAt(0)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{m.title}</p>
                                            <p className="text-xs text-gray-600">宛先: {m.recipient_id}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {m.created_at
                                                    ? new Date(m.created_at).toLocaleString("ja-JP")
                                                    : ""}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>

                    </div>
                </div>

            </div>
        </TeacherLayout>
    );
}
