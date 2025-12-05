// アカウント管理（管理者メイン）
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AuthLayout from "../components/Layout/AuthLayout";
import { useNavigate } from "react-router-dom";

export default function AdminMainPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setError("");
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")   // lấy toàn bộ cột, tránh lỗi nếu chưa đặt đúng tên

      if (error) {
        setError("ユーザー一覧の取得に失敗しました。");
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    const text =
      `${u.id || ""}${u.user_id || ""}${u.full_name || ""}${u.class_name || ""}`
        .toLowerCase();

    return text.includes(keyword);
  });

  const handleDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除に失敗しました。");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-xl shadow-md p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-purple-600">
            アカウント管理
          </h1>
          {/* chỗ icon setting ở góc phải trên (nếu cần sau này) */}
        </div>

        {/* Search + Add button */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="名前またはクラスで検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white font-semibold"
              // hiện tại lọc realtime theo input, nút này chỉ để giống UI
              onClick={() => {}}
            >
              検索
            </button>
          </div>

          <button
            className="px-4 py-2 rounded bg-green-500 text-white font-semibold"
            onClick={() => navigate("/add-user")} // hoặc /teacher/add-user tuỳ route
          >
            ＋ アカウントを追加
          </button>
        </div>

        {/* Count */}
        <div className="text-right text-sm text-gray-500 mb-2">
          登録済み：全{filteredUsers.length}件
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 text-red-600 text-sm">{error}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ユーザーID</th>
                <th className="px-4 py-2 text-left">氏名</th>
                <th className="px-4 py-2 text-left">種別</th>
                <th className="px-4 py-2 text-left">クラス</th>
                <th className="px-4 py-2 text-left">担当教師</th>
                <th className="px-4 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                    読み込み中...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                    該当するアカウントがありません。
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.user_id || u.id}</td>
                    <td className="px-4 py-2">{u.full_name}</td>
                    <td className="px-4 py-2">{u.role || "学生"}</td>
                    <td className="px-4 py-2">{u.class_name || "xk1"}</td>
                    <td className="px-4 py-2">{u.homeroom_teacher || "-"}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="px-3 py-1 rounded bg-blue-500 text-white text-xs mr-2"
                        // TODO: điều hướng sang màn edit
                        onClick={() => alert("編集ページへ遷移（未実装）")}
                      >
                        編集
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-500 text-white text-xs"
                        onClick={() => handleDelete(u.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthLayout>
  );
}
