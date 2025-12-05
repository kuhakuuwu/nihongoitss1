import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/Layout/AuthLayout';
import { supabase } from '../supabaseClient';

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
            // Debug: Kiểm tra user có tồn tại không
            const { data: checkUser } = await supabase
                .from('users')
                .select('id, username, email, role, password')
                .eq('email', email);
            console.log('Users with this email:', checkUser);

            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, role, password')
                .eq('email', email)
                .eq('password', password)
                .single();

            console.log('Login response:', { data, error });

            if (error || !data) {
                console.error('Login failed:', error);
                setError(t('login.error'));
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
            setError(t('login.error'));
        } finally {
            setLoading(false);
        }
    };

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
