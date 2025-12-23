import { supabase } from '../supabaseClient';

/**
 * Send OTP email via Supabase Edge Function
 * @param {string} email - Recipient email
 * @param {string} otpCode - 6-digit OTP code
 * @param {string} language - Language code ('vn' or 'jp')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendOtpEmail(email, otpCode, language = 'vn') {
    try {
        const { data, error } = await supabase.functions.invoke('send-otp-email', {
            body: {
                email,
                otpCode,
                language
            }
        });

        if (error) {
            console.error('Error sending OTP email:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }

        return {
            success: true,
            messageId: data?.messageId
        };

    } catch (error) {
        console.error('Exception sending OTP email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
}

/**
 * Send welcome email to new user
 * You can create another Edge Function for this
 */
export async function sendWelcomeEmail(email, username, tempPassword, language = 'vn') {
    // TODO: Implement welcome email function
    console.log('Send welcome email to:', email);
}
