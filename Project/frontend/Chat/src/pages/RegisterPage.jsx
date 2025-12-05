import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/Layout/AuthLayout';
import { supabase } from '../supabaseClient';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        // Validate
        if (!username || !email || !password || !confirmPassword) {
            setError(t('register.error_empty'));
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(t('register.error_password_mismatch'));
            setLoading(false);
            return;
        }

        try {
            // Kiểm tra email đã tồn tại chưa
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                setError(t('register.error_email_exists'));
                setLoading(false);
                return;
            }

            // Tạo user mới
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        username: username,
                        email: email,
                        password: password,
                        role: role
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Register error:', error);
                setError(t('register.error_general'));
                return;
            }

            console.log('User created:', data);
            setSuccess(t('register.success'));

            // Chuyển đến trang login sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(t('register.error_general'));
        } finally {
            setLoading(false);
        }
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") handleRegister();
    };

    return (
        <AuthLayout title={t('register.title')} hideUserInfo={true}>
            <div className="space-y-4">

                {/* USERNAME */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('register.username')}
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('register.username_placeholder')}
                    />
                </div>

                {/* EMAIL */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('register.email')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('register.email_placeholder')}
                    />
                </div>

                {/* PASSWORD */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('register.password')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('register.password_placeholder')}
                    />
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('register.confirm_password')}
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleEnter}
                        className="w-full px-4 py-3 border rounded-md"
                        placeholder={t('register.confirm_password_placeholder')}
                    />
                </div>

                {/* ROLE */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('register.role')}
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3 border rounded-md bg-white"
                    >
                        <option value="student">{t('common.student')}</option>
                        <option value="teacher">{t('common.teacher')}</option>
                    </select>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                        {error}
                    </div>
                )}

                {/* SUCCESS */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                        {success}
                    </div>
                )}

                {/* REGISTER BUTTON */}
                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md disabled:opacity-50"
                >
                    {loading ? t('common.loading') : t('register.register')}
                </button>

                {/* LOGIN LINK */}
                <div className="text-center">
                    <a
                        href="/login"
                        className="text-green-600 hover:text-green-700 text-sm"
                    >
                        {t('register.login_link')}
                    </a>
                </div>
            </div>
        </AuthLayout>
    );
}
