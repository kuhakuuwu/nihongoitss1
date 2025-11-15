import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/Layout/AuthLayout';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loginData, setLoginData] = useState(null);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const handleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            // Kiểm tra env variables
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Chưa cấu hình Supabase. Vui lòng kiểm tra file .env');
            }

            // Gọi API Supabase để đăng nhập
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: username,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.msg || 'Đăng nhập thất bại');
            }

            // Đăng nhập thành công
            setLoginData(data);
            alert('Đăng nhập thành công! Chuyển đến trang chính...');
            console.log('User logged in:', data);

            // Lưu token trong memory nếu chọn "Ghi nhớ"
            if (rememberMe && data.access_token) {
                console.log('Token saved in memory:', data.access_token);
            }

            // Ở đây bạn có thể chuyển hướng đến trang khác
            // window.location.href = '/dashboard';

        } catch (error) {
            setError(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <AuthLayout title="ログイン">
            <div className="space-y-6">
                {/* Username Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ユーザーネーム
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="メールアドレスまたはユーザー名"
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
                        placeholder="パスワードを入力"
                    />
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                        アカウントを記憶する
                    </label>
                </div>

                {/* Forgot Password Link */}
                <div>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                        パスワードを忘れた方はこちら
                    </a>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {loginData && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                        ✓ Đăng nhập thành công! User: {loginData.user?.email}
                    </div>
                )}

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? '処理中...' : 'ログイン'}
                </button>

                {/* Sign Up Link */}
                <div className="text-center text-sm text-gray-600">
                    アカウントをお持ちでないですか？{' '}
                    <Link to="/signup" className="text-green-600 hover:text-green-700 font-medium">
                        新規登録
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}