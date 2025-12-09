import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AdminLayout from "../components/Layout/AdminLayout";


export default function AdminMainPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");

  // ================= FETCH DATA ==================
  useEffect(() => {
    let active = true;

    (async () => {
      // Fetch all students + teachers
      const { data: userList, error: userErr } = await supabase
        .from("users")
        .select("*")
        .neq("role", "admin");

      if (!userErr && active) {
        setUsers(userList);
      }

      // Fetch teachers only
      const { data: teacherList, error: teacherErr } = await supabase
        .from("users")
        .select("id, username, email")
        .eq("role", "teacher");

      if (!teacherErr && active) {
        setTeachers(teacherList);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Japanese roles
  const roleJP = (r) => (r === "student" ? "学生" : r === "teacher" ? "教師" : "—");

  // ================= FILTER SEARCH ==================
  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(s) ||
      u.class?.toLowerCase().includes(s)
    );
  });

  // ================= Teacher Map ==================
  const teacherMap = Object.fromEntries(
    teachers.map((t) => [t.email, t.username])
  );

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* 1. Search Area */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="名前またはクラスで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-4 py-2 rounded w-64"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            検索
          </button>
        </div>

        {/* 2. Add Account */}
        <button
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
          onClick={() => navigate("/admin/add-user")}
        >
          ＋ アカウントを追加
        </button>

        {/* 4. Count */}
        <div className="text-right font-semibold">
          登録済み：全 {filtered.length} 件
        </div>

        {/* 3. User List Table */}
        <div className="bg-white shadow rounded overflow-hidden">
          <table className="w-full border-collapse text-center">
            <thead className="bg-gray-100">
              <tr className="border-b">
                <th className="p-3">ユーザーID</th>
                <th className="p-3">氏名</th>
                <th className="p-3">種別</th>
                <th className="p-3">クラス</th>
                <th className="p-3">担当教師</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const teacherName =
                  u.role === "teacher" ? "—" : teacherMap[u.teacher] || "—";

                return (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">
                      {(u.first_name || "") + " " + (u.last_name || "")}
                    </td>
                    <td className="p-3">{roleJP(u.role)}</td>
                    <td className="p-3">
                      {u.role === "teacher" ? "—" : u.class || "—"}
                    </td>
                    <td className="p-3">{teacherName}</td>

                    <td className="p-3 flex justify-center gap-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() => navigate(`/admin/detail/${u.id}`)}
                      >
                        詳細
                      </button>

                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => navigate(`/admin/delete/${u.id}`)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 text-gray-500">
                    該当するユーザーが見つかりません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
}
