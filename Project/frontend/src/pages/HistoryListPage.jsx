"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "../components/Layout/TeacherLayout";
import { supabase } from "../supabaseClient";
import { 
  Search, 
  Home, 
  PenSquare, 
  RefreshCw, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  MailOpen,
  User,
  Calendar,
  FileText
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function HistoryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(""); // tìm kiếm theo title hoặc recipient
  const [statusFilter, setStatusFilter] = useState("all"); // all, read, unread
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("all"); // all, has_deadline, no_deadline
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

      // ----------- BUILD QUERY -----------
      let countQuery = supabase
        .from("messages")
        .select("id", { head: true, count: "exact" })
        .in("sender_id", possibleSenderIds);
      
      let dataQuery = supabase
        .from("messages")
        .select("*")
        .in("sender_id", possibleSenderIds);
      
      // Tìm kiếm theo title hoặc recipient
      if (keyword) {
        countQuery = countQuery.or(`title.ilike.%${keyword}%,recipient_id.ilike.%${keyword}%`);
        dataQuery = dataQuery.or(`title.ilike.%${keyword}%,recipient_id.ilike.%${keyword}%`);
      }
      
      // Filter theo trạng thái đọc
      if (statusFilter === "read") {
        countQuery = countQuery.not("read_at", "is", null);
        dataQuery = dataQuery.not("read_at", "is", null);
      } else if (statusFilter === "unread") {
        countQuery = countQuery.is("read_at", null);
        dataQuery = dataQuery.is("read_at", null);
      }
      
      // Filter theo ngày
      if (dateFrom) {
        countQuery = countQuery.gte("created_at", new Date(dateFrom).toISOString());
        dataQuery = dataQuery.gte("created_at", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        countQuery = countQuery.lte("created_at", endDate.toISOString());
        dataQuery = dataQuery.lte("created_at", endDate.toISOString());
      }
      
      // Filter theo deadline
      if (deadlineFilter === "has_deadline") {
        countQuery = countQuery.not("deadline", "is", null);
        dataQuery = dataQuery.not("deadline", "is", null);
      } else if (deadlineFilter === "no_deadline") {
        countQuery = countQuery.is("deadline", null);
        dataQuery = dataQuery.is("deadline", null);
      }

      // ----------- COUNT BEFORE PAGINATION -----------
      const { count } = await countQuery;
      if (active) setTotalCount(count || 0);

      // ----------- PAGINATED QUERY -----------
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await dataQuery
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
  }, [currentPage, keyword, statusFilter, dateFrom, dateTo, deadlineFilter]);

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

  // ================================================
  // UI
  // ================================================
  return (
    <TeacherLayout title={t("history.title")}>
      <div className="min-h-screen p-6 bg-gray-50">

        {/* MAIN WRAPPER */}
        <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-100 space-y-6">

          {/* SEARCH + ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            {/* Search input */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={keyword}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setKeyword(e.target.value);
                  }}
                  placeholder={t("history.search_title")}
                  className="w-72 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <button className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm text-sm font-medium flex items-center gap-2 transition-colors">
                <Search className="w-4 h-4" />
                {t("common.search")}
              </button>
            </div>

            {/* Navigation actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/teacher")} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                {t("history.back_home")}
              </button>

              <button 
                onClick={() => navigate("/teacher/create-message")} 
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                {t("history.new_message")}
              </button>

              <button 
                onClick={() => setCurrentPage(currentPage)} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t("history.refresh")}
              </button>
            </div>
          </div>
          
          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("history.filter_status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="all">{t("history.filter_all")}</option>
                <option value="read">{t("history.filter_read")}</option>
                <option value="unread">{t("history.filter_unread")}</option>
              </select>
            </div>
            
            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("history.from_date")}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("history.to_date")}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            
            {/* Deadline Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("history.filter_deadline")}
              </label>
              <select
                value={deadlineFilter}
                onChange={(e) => {
                  setDeadlineFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="all">{t("history.filter_all")}</option>
                <option value="has_deadline">{t("history.has_deadline")}</option>
                <option value="no_deadline">{t("history.no_deadline")}</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t("history.subject")}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t("history.recipient")}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("history.send_date")}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("history.deadline")}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("history.status")}
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t("history.action")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                        <span className="text-gray-500">{t("common.loading")}</span>
                      </div>
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Mail className="w-12 h-12 text-gray-300" />
                        <span className="text-gray-500">{t("common.no_messages")}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 transition-colors">

                      {/* SUBJECT */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {msg.status === "既読" || msg.read_at ? (
                            <MailOpen className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Mail className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          )}
                          <span className="font-medium text-gray-900">{msg.title}</span>
                        </div>
                      </td>

                      {/* RECIPIENT */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{msg.recipient_id}</span>
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(msg.created_at).toLocaleString("ja-JP")}
                      </td>
                      
                      {/* DEADLINE */}
                      <td className="py-4 px-6 text-sm">
                        {msg.deadline ? (
                          <span className="text-orange-600 font-medium">
                            {new Date(msg.deadline).toLocaleString("ja-JP")}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            msg.status === "既読" || msg.read_at
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {msg.status === "既読" || msg.read_at ? (
                            <MailOpen className="w-3.5 h-3.5" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          {msg.status === "既読" || msg.read_at
                            ? t("history.read")
                            : t("history.unread")}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleViewDetail(msg.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1.5 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          {t("common.detail")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">

              <div className="text-sm text-gray-600">
                {t("pagination.showing")}{" "}
                <span className="font-semibold text-gray-900">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                </span>{" "}
                {t("pagination.of")}{" "}
                <span className="font-semibold text-gray-900">{totalCount}</span>
              </div>

              <div className="flex items-center gap-1">

                {/* Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </TeacherLayout>
  );
}
