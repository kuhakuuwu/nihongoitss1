"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";

const ITEMS_PER_PAGE = 10;

export default function HistoryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(""); // chỉ filter recipient_id
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ================================================
  // LOAD MESSAGES (FILTER TRONG SUPABASE)
  // ================================================
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const possibleSenderIds = [
        currentUser?.id,
        currentUser?.email,
        currentUser?.username,
      ].filter(Boolean);

      if (possibleSenderIds.length === 0) {
        if (active) {
          setMessages([]);
          setTotalCount(0);
          setLoading(false);
        }
        return;
      }

      // ----------- COUNT BEFORE PAGINATION -----------
      const { count } = await supabase
        .from("messages")
        .select("id", { head: true, count: "exact" })
        .in("sender_id", possibleSenderIds)
        .ilike("recipient_id", `%${keyword}%`);

      if (active) setTotalCount(count || 0);

      // ----------- PAGINATED QUERY -----------
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .in("sender_id", possibleSenderIds)
        .ilike("recipient_id", `%${keyword}%`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!error && active) {
        setMessages(data || []);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [currentPage, keyword]);

  // ================================================
  // PAGINATION HELPERS
  // ================================================
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ================================================
  // ACTIONS
  // ================================================
  const handleViewDetail = (id) => navigate(`/teacher/message/${id}`);
  const handleSetReminder = (id) => navigate(`/teacher/reminder/${id}`);

  // ================================================
  // UI
  // ================================================
  return (
    <TeacherLayout title={t("history.title")}>
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-100 to-gray-200">

        {/* MAIN WRAPPER */}
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-8 border border-gray-100 space-y-6">

          {/* SEARCH + ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            {/* Search input */}
            <div className="flex items-center gap-2">
              <input
                value={keyword}
                onChange={(e) => {
                  setCurrentPage(1); // reset về trang 1
                  setKeyword(e.target.value);
                }}
                placeholder="受信者IDで検索 (例: 031)"
                className="w-72 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-600"
              />

              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow text-sm">
                {t("common.search")}
              </button>
            </div>

            {/* Navigation actions */}
            <div className="flex items-center gap-5 text-green-700 font-medium">
              <button onClick={() => navigate("/teacher")} className="hover:underline">
                🏠 {t("history.back_home")}
              </button>

              <button onClick={() => navigate("/teacher/create-message")} className="hover:underline">
                📝 {t("history.new_message")}
              </button>

              <button onClick={() => setCurrentPage(currentPage)} className="hover:underline">
                🔄 {t("history.refresh")}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-3 px-6 text-left text-sm font-semibold">{t("history.subject")}</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">{t("history.recipient")}</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">{t("history.send_date")}</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">{t("history.status")}</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold">{t("history.action")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">

                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-500">{t("common.loading")}</td></tr>
                ) : messages.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-500">{t("common.no_messages")}</td></tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 transition">

                      {/* SUBJECT */}
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {msg.title}
                      </td>

                      {/* RECIPIENT */}
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full shadow">
                          {msg.recipient_id}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(msg.created_at).toLocaleString("ja-JP")}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            msg.status === "既読" || msg.read_at
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {msg.status === "既読" || msg.read_at
                            ? t("history.read")
                            : t("history.unread")}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(msg.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                          >
                            {t("common.detail")}
                          </button>
                          <button
                            onClick={() => handleSetReminder(msg.id)}
                            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200"
                          >
                            {t("history.reminder")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white border rounded-lg shadow">

              <div className="text-sm text-gray-700">
                {t("pagination.showing")}{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}{" "}
                {t("pagination.of")} {totalCount}
              </div>

              <div className="flex items-center gap-1">

                {/* Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ←
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1 rounded text-sm ${
                      p === currentPage
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  →
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </TeacherLayout>
  );
}
