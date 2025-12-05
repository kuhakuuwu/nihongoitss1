import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";

export default function HistoryMessagePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("id", id)
                .single();

            if (!error) setMessage(data);
        };
        load();
    }, [id]);

    if (!message) return (
        <TeacherLayout title="メッセージ詳細">
            <p className="text-center py-10 text-gray-500">読み込み中...</p>
        </TeacherLayout>
    );

    return (
        <TeacherLayout title="メッセージ詳細">
            <div className="max-w-3xl mx-auto bg-white shadow border p-6 rounded-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:underline mb-4"
                >
                    ← 戻る
                </button>

                <h2 className="text-xl font-bold mb-3">{message.title}</h2>

                <p className="text-sm text-gray-600 mb-1">宛先: {message.recipient_id}</p>
                <p className="text-sm text-gray-600 mb-4">
                    送信日: {new Date(message.created_at).toLocaleString("ja-JP")}
                </p>

                <div className="bg-gray-50 border p-4 rounded leading-relaxed whitespace-pre-line">
                    {message.content}
                </div>
            </div>
        </TeacherLayout>
    );
}
