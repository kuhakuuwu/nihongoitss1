import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/Layout/AuthLayout';
import { supabase } from '../supabaseClient';
import { verifyPassword, isPasswordHashed } from '../utils/passwordHash';

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError(t('login.error'));
            setLoading(false);
            return;
        }

        try {
            // ⭐ Một query duy nhất để lấy user
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('id, username, email, role, password')
                .eq('email', email)
                .single();

            if (fetchError || !data) {
                setError("メールまたはパスワードが正しくありません。");
                setLoading(false);
                return;
            }

            // ⭐ Kiểm tra password (hỗ trợ cả hashed và plain text)
            let passwordMatch = false;
            if (isPasswordHashed(data.password)) {
                // Nếu mật khẩu đã được hash, sử dụng verifyPassword
                passwordMatch = await verifyPassword(password, data.password);
            } else {
                // Nếu mật khẩu chưa hash (backward compatibility)
                passwordMatch = (data.password === password);
            }

            if (!passwordMatch) {
                setError("メールまたはパスワードが正しくありません。");
                setLoading(false);
                return;
            }

            // ⭐ Lưu user vào localStorage
            localStorage.setItem("user", JSON.stringify(data));

            // ⭐ Điều hướng theo role
            if (data.role === "admin") {
                window.location.href = "/admin";
            } else if (data.role === "teacher") {
                window.location.href = "/teacher";
            } else {
                window.location.href = "/student";
            }

        } catch (err) {
            console.error(err);
            setError(t('login.error'));
        } finally {
            setLoading(false);
        }
    };

    // Enter key login
    const handleEnter = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <AuthLayout title={t('login.title')} hideUserInfo={true}>
            <div className="space-y-6">

                {/* EMAIL */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('login.email')}
                    </label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('login.email_placeholder')}
                    />
                </div>

                {/* PASSWORD */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('login.password')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('login.password_placeholder')}
                    />
                </div>

                {/* FORGOT PASSWORD LINK */}
                <div className="text-right">
                    <a
                        href="/forgot-password"
                        className="text-green-600 hover:text-green-700 text-sm"
                    >
                        {t('login.forgot_password')}
                    </a>
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
                    {loading ? t('common.loading') : t('login.login')}
                </button>

                {/* REGISTER LINK */}
                <div className="text-center">
                    <a
                        href="/register"
                        className="text-green-600 hover:text-green-700 text-sm"
                    >
                        {t('login.register_link')}
                    </a>
                </div>
            </div>
        </AuthLayout>
    );
}
