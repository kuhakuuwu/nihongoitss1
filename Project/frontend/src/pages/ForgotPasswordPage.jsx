import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../components/Layout/AuthLayout';
import { supabase } from '../supabaseClient';
import { hashPassword } from '../utils/passwordHash';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Step tracking: 1 = email, 2 = OTP, 3 = new password
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Store generated OTP and user data
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [userId, setUserId] = useState(null);

    // Step 1: Send OTP to email
    const handleSendOtp = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!email) {
            setError(t('forgotPassword.error_email_required'));
            setLoading(false);
            return;
        }

        try {
            // Check if email exists
            const { data: user, error: fetchError } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', email)
                .single();

            if (fetchError || !user) {
                setError(t('forgotPassword.error_email_not_found'));
                setLoading(false);
                return;
            }

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otpCode);
            setUserId(user.id);

            // In a real application, send OTP via email service
            // For now, we'll just log it and show success message
            console.log('OTP Code:', otpCode, 'for email:', email);
            
            // TODO: Integrate with email service (Supabase Edge Functions, SendGrid, etc.)
            // await sendEmailWithOtp(email, otpCode);

            setSuccess(t('forgotPassword.success_otp_sent') + ` (Dev: ${otpCode})`);
            setStep(2);
        } catch (err) {
            console.error('Error sending OTP:', err);
            setError(t('common.send_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (!otp) {
            setError(t('forgotPassword.error_otp_required'));
            setLoading(false);
            return;
        }

        try {
            // Verify OTP
            if (otp !== generatedOtp) {
                setError(t('forgotPassword.error_otp_invalid'));
                setLoading(false);
                return;
            }

            setSuccess(t('common.confirm'));
            setStep(3);
        } catch (err) {
            console.error('Error verifying OTP:', err);
            setError(t('forgotPassword.error_otp_invalid'));
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        // Validation
        if (!newPassword) {
            setError(t('forgotPassword.error_password_required'));
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError(t('forgotPassword.error_password_min_length'));
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('forgotPassword.error_password_mismatch'));
            setLoading(false);
            return;
        }

        try {
            // Hash the new password before storing
            const hashedPassword = await hashPassword(newPassword);

            // Update password in database
            const { error: updateError } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', userId);

            if (updateError) {
                console.error('Update password error:', updateError);
                setError(t('common.send_failed'));
                setLoading(false);
                return;
            }

            setSuccess(t('forgotPassword.success_password_reset'));
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Error resetting password:', err);
            setError(t('common.send_failed'));
        } finally {
            setLoading(false);
        }
    };

    // Handle enter key
    const handleEnter = (e, action) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    return (
        <AuthLayout 
            title={t('forgotPassword.title')} 
            subtitle={
                step === 1 ? t('forgotPassword.step1_desc') :
                step === 2 ? t('forgotPassword.step2_desc') :
                t('forgotPassword.step3_desc')
            }
            hideUserInfo={true}
        >
            <div className="space-y-6">
                {/* Step 1: Email Input */}
                {step === 1 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('forgotPassword.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => handleEnter(e, handleSendOtp)}
                                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder={t('forgotPassword.email_placeholder')}
                            />
                        </div>

                        <button
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('forgotPassword.send_otp')}
                        </button>
                    </>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('forgotPassword.otp_code')}
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onKeyDown={(e) => handleEnter(e, handleVerifyOtp)}
                                className="w-full px-4 py-3 border rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="000000"
                                maxLength={6}
                            />
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('forgotPassword.verify_otp')}
                        </button>

                        <button
                            onClick={handleSendOtp}
                            className="w-full text-green-600 hover:text-green-700 text-sm"
                        >
                            {t('forgotPassword.resend_otp')}
                        </button>
                    </>
                )}

                {/* Step 3: New Password Input */}
                {step === 3 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('forgotPassword.new_password')}
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder={t('forgotPassword.new_password_placeholder')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('forgotPassword.confirm_password')}
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyDown={(e) => handleEnter(e, handleResetPassword)}
                                className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder={t('forgotPassword.confirm_password_placeholder')}
                            />
                        </div>

                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('forgotPassword.reset_password')}
                        </button>
                    </>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                        {success}
                    </div>
                )}

                {/* Back to Login Link */}
                <div className="text-center">
                    <a
                        href="/login"
                        className="text-green-600 hover:text-green-700 text-sm"
                    >
                        {t('forgotPassword.back_to_login')}
                    </a>
                </div>
            </div>
        </AuthLayout>
    );
}
