// 送信メッセージ詳細
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";

export default function MessageDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchMessage = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("id", Number(id))   // ép về số cho chắc
                .single();

            if (!isMounted) return;

            if (error) {
                console.error("Error fetching message:", error);
                setLoading(false);
                return;
            }

            setMessage(data);
            setLoading(false);
        };

        fetchMessage();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (loading) {
        return (
            <TeacherLayout title="送信メッセージ詳細">
                <div className="text-center text-gray-500 py-10 text-lg">
                    読み込み中...
                </div>
            </TeacherLayout>
        );
    }

    if (!message) {
        return (
            <TeacherLayout title="送信メッセージ詳細">
                <div className="text-center text-red-500 py-10 text-lg">
                    メッセージが見つかりません。
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout title="送信メッセージ詳細">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow border px-6 py-6">

                {/* 🔙 Chỉ quay về màn tạo tin nhắn */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate("/teacher/create-message")}
                        className="text-blue-600 text-sm hover:underline"
                    >
                        ← メッセージ作成画面に戻る
                    </button>
                </div>

                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {message.title}
                </h2>

                {/* Info */}
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                    <p>
                        <span className="font-semibold">送信者:</span>{" "}
                        {message.sender_id}
                    </p>
                    <p>
                        <span className="font-semibold">宛先:</span>{" "}
                        {message.recipient_id}
                    </p>
                    <p>
                        <span className="font-semibold">送信日時:</span>{" "}
                        {message.created_at
                            ? new Date(message.created_at).toLocaleString("ja-JP")
                            : ""}
                    </p>
                    <p>
                        <span className="font-semibold">状態:</span>{" "}
                        <span
                            className={
                                message.status === "未読"
                                    ? "text-yellow-700"
                                    : "text-green-700"
                            }
                        >
                            {message.status}
                        </span>
                    </p>
                </div>

                {/* Nội dung */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-line leading-relaxed text-gray-800">
                    {message.content}
                </div>
            </div>
        </TeacherLayout>
    );
}
