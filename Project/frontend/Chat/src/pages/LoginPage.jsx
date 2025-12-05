import { useState } from 'react';
import AuthLayout from '../components/Layout/AuthLayout';
import { supabase } from '../supabaseClient';
import { getLanguage } from "../utils/language";

export default function LoginPage() {
    const [lang] = useState(() => getLanguage());  
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const TEXT = {
        jp: {
            title: "ログイン",
            email: "メールアドレス",
            email_placeholder: "メールアドレスを入力",
            password: "パスワード",
            password_placeholder: "パスワードを入力",
            login: "ログイン",
            loading: "処理中...",
            error: "メールまたはパスワードが正しくありません。"
        },
        vn: {
            title: "Đăng nhập",
            email: "Email",
            email_placeholder: "Nhập email",
            password: "Mật khẩu",
            password_placeholder: "Nhập mật khẩu",
            login: "Đăng nhập",
            loading: "Đang xử lý...",
            error: "Email hoặc mật khẩu không đúng."
        }
    }[lang];

    const handleLogin = async () => {
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError(TEXT.error);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, role, password')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error || !data) {
                setError(TEXT.error);
                return;
            }

            // ⭐ Luôn lưu thông tin người dùng khi đăng nhập thành công
            localStorage.setItem("user", JSON.stringify(data));

            // ⭐ Điều hướng theo vai trò
            if (data.role === "teacher") {
                window.location.href = "/teacher";
            } else {
                window.location.href = "/student";
            }

        } catch (err) {
            console.error(err);
            setError(TEXT.error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <AuthLayout title={TEXT.title} hideUserInfo={true}>
            <div className="space-y-6">

                {/* EMAIL */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {TEXT.email}
                    </label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={TEXT.email_placeholder}
                    />
                </div>

                {/* PASSWORD */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {TEXT.password}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={TEXT.password_placeholder}
                    />
                </div>

                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                        {error}
                    </div>
                )}

                {/* LOGIN BUTTON */}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md disabled:opacity-50"
                >
                    {loading ? TEXT.loading : TEXT.login}
                </button>
            </div>
        </AuthLayout>
    );
}
