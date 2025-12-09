"use client";
import React, { useState, useEffect, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

export default function ReplyMessagePage() {
  const { id } = useParams(); // message gốc
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [original, setOriginal] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // ==================================================
  // LOAD ORIGINAL MESSAGE
  // ==================================================
  useEffect(() => {
    let active = true;

    const loadMessage = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && active) setOriginal(data);
    };

    loadMessage();
    return () => (active = false);
  }, [id]);

  // ==================================================
  // AI SUGGESTIONS — FIX REACT 19 USING startTransition
  // ==================================================
  useEffect(() => {
    if (!original) return;

    startTransition(() => {
      setAiSuggestions([
        { type: "text", content: "了解しました。ご連絡ありがとうございます。" },
        { type: "text", content: "確認しました。後ほど返信いたします。" },
        { type: "reaction", content: "👍" },
      ]);
    });
  }, [original]);

  // ==================================================
  // SEND REPLY
  // ==================================================
  const sendReply = async () => {
    if (!replyText.trim()) {
      alert("返信内容を入力してください。");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const { error } = await supabase.from("messages").insert({
      title: original.title,
      content: replyText,
      sender_id: currentUser.id,
      recipient_id: original.sender_id,
      parent_id: original.id,
      status: "未読",
      is_complex: false,
    });

    if (error) {
      alert("送信に失敗しました。");
      return;
    }

    navigate(-1);
  };

  // ==================================================
  // SEND REACTION
  // ==================================================
  const sendReaction = async (reaction) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    await supabase.from("messages").insert({
      title: "Reaction",
      content: reaction,
      sender_id: currentUser.id,
      recipient_id: original.sender_id,
      parent_id: original.id,
      status: "未読",
      is_complex: false,
    });

    alert("リアクションを送信しました！");
  };

  // ==================================================
  // UI
  // ==================================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div className="text-xl font-bold">EduConnect</div>

        <div className="flex items-center gap-4">
          {/* Language Switch */}
          <button onClick={() => i18n.changeLanguage("vi")} className="text-2xl">🇻🇳</button>
          <button onClick={() => i18n.changeLanguage("ja")} className="text-2xl">🇯🇵</button>

          {/* Account Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="border px-3 py-1 rounded"
            >
              D さん ▼
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow rounded p-2 text-sm">
                <button className="w-full text-left px-2 py-1 hover:bg-gray-100">プロフィール確認</button>
                <button className="w-full text-left px-2 py-1 hover:bg-gray-100">パスワード変更</button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full text-left px-2 py-1 hover:bg-gray-100"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CARD WRAPPER */}
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-4">返信作成</h2>

        {/* ORIGINAL MESSAGE */}
        <div>
          <label className="font-bold text-blue-700">元のメッセージ：</label>
          <div className="border rounded p-3 bg-gray-100 mt-1">
            {original ? original.content : "読み込み中..."}
          </div>
        </div>

        {/* REPLY TEXT */}
        <div>
          <label className="font-bold text-red-600">本文：</label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="ここに返信を入力してください…"
            className="w-full border rounded p-3 mt-1 h-40"
          />
        </div>

        {/* AI SUGGESTIONS */}
        <div>
          <div className="font-semibold mb-2">✨AI返信候補</div>

          <div className="space-y-2">
            {aiSuggestions.map((s, index) =>
              s.type === "text" ? (
                <button
                  key={index}
                  onClick={() => setReplyText(s.content)}
                  className="block w-full text-left bg-green-50 border p-3 rounded hover:bg-green-100"
                >
                  {s.content}
                </button>
              ) : (
                <button
                  key={index}
                  onClick={() => sendReaction(s.content)}
                  className="px-3 py-1 bg-yellow-100 rounded text-xl hover:bg-yellow-200"
                >
                  {s.content}
                </button>
              )
            )}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4">
          <button
            onClick={sendReply}
            className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
          >
            返信を送信
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-yellow-500 text-white px-5 py-2 rounded hover:bg-yellow-600"
          >
            戻る
          </button>
        </div>

      </div>
    </div>
  );
}
