import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/Layout/AuthLayout';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const handleSignUp = async () => {
        setError('');
        setSuccess(false);

        // Validation
        if (!email || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Chưa cấu hình Supabase. Vui lòng kiểm tra file .env');
            }

            // Gọi API Supabase để đăng ký
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.msg || 'Đăng ký thất bại');
            }

            // Đăng ký thành công
            setSuccess(true);
            setEmail('');
            setPassword('');
            setConfirmPassword('');

            alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');

        } catch (error) {
            setError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSignUp();
        }
    };

    return (
        <AuthLayout title="新規登録" subtitle="アカウントを作成する">
            <div className="space-y-6">
                {/* Email Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="example@email.com"
                    />
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        パスワード
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="最低6文字"
                    />
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        パスワード確認
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="パスワードを再入力"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                        ✓ Đăng ký thành công! Email: {email}
                    </div>
                )}

                {/* Sign Up Button */}
                <button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? '処理中...' : '登録する'}
                </button>

                {/* Login Link */}
                <div className="text-center text-sm text-gray-600">
                    すでにアカウントをお持ちですか？{' '}
                    <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                        ログイン
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}