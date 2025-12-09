// システム設定
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminLayout from "../components/Layout/AdminLayout";
import { supabase } from "../supabaseClient";

export default function SystemSettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // 全体設定の作成
    const [replyDeadline, setReplyDeadline] = useState("7days"); // 7days, 1day, 2hours, custom
    const [customDeadline, setCustomDeadline] = useState("");
    const [deadlineActions, setDeadlineActions] = useState({
        changeStatus: false,
        lockReply: false,
        autoClose: false,
    });

    // 通知設定
    const [notificationTitle, setNotificationTitle] = useState("");
    const [notificationContent, setNotificationContent] = useState("");
    const [testEmail, setTestEmail] = useState("");
    const [notificationChannels, setNotificationChannels] = useState({
        email: false,
        inApp: false,
    });
    const [sendTiming, setSendTiming] = useState("7days"); // 7days, 1day, 2hours, custom
    const [customTiming, setCustomTiming] = useState("");

    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Xử lý thay đổi deadline action
    const handleDeadlineActionChange = (action) => {
        setDeadlineActions(prev => ({
            ...prev,
            [action]: !prev[action]
        }));
    };

    // Xử lý thay đổi notification channel
    const handleChannelChange = (channel) => {
        setNotificationChannels(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    // Xử lý lưu cài đặt
    const handleSave = async () => {
        setSaving(true);

        // Validate
        if (!notificationTitle.trim()) {
            alert(t('systemSettings.error_title_required'));
            setSaving(false);
            return;
        }

        // TODO: Lưu vào database
        const settings = {
            reply_deadline: replyDeadline === 'custom' ? customDeadline : replyDeadline,
            deadline_actions: deadlineActions,
            notification_title: notificationTitle,
            notification_content: notificationContent,
            notification_channels: notificationChannels,
            send_timing: sendTiming === 'custom' ? customTiming : sendTiming,
        };

        console.log("Saving settings:", settings);

        // Giả lập lưu thành công
        setTimeout(() => {
            setSaving(false);
            alert(t('systemSettings.save_success'));
        }, 500);
    };

    // Xử lý hủy
    const handleCancel = () => {
        navigate(-1);
    };

    // Xử lý preview
    const handlePreview = () => {
        setShowPreview(true);
    };

    return (
        <AdminLayout title={t('systemSettings.title')}>
            <div className="space-y-6">
                {/* 全体設定の作成 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('systemSettings.global_settings')}
                    </h2>

                    {/* 返信期限（デフォルト） */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            {t('systemSettings.reply_deadline')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['7days', '1day', '2hours', 'custom'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setReplyDeadline(option)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        replyDeadline === option
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {t(`systemSettings.deadline_${option}`)}
                                </button>
                            ))}
                        </div>
                        {replyDeadline === 'custom' && (
                            <input
                                type="text"
                                value={customDeadline}
                                onChange={(e) => setCustomDeadline(e.target.value)}
                                placeholder={t('systemSettings.custom_deadline_placeholder')}
                                className="mt-3 px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        )}
                    </div>

                    {/* 期限到達時の動作 */}
                    <div>
                        <label className="block text-sm font-medium text-red-600 mb-3">
                            {t('systemSettings.deadline_action')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleDeadlineActionChange('changeStatus')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    deadlineActions.changeStatus
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {t('systemSettings.action_change_status')}
                            </button>
                            <button
                                onClick={() => handleDeadlineActionChange('lockReply')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    deadlineActions.lockReply
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {t('systemSettings.action_lock_reply')}
                            </button>
                            <button
                                onClick={() => handleDeadlineActionChange('autoClose')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    deadlineActions.autoClose
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {t('systemSettings.action_auto_close')}
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('systemSettings.deadline_action_tooltip')}
                        </p>
                    </div>
                </div>

                {/* 通知設定 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {t('systemSettings.notification_settings')}
                    </h2>

                    {/* 通知タイトル */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('systemSettings.notification_title')}
                        </label>
                        <input
                            type="text"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            placeholder={t('systemSettings.notification_title_placeholder')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* 通知内容 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('systemSettings.notification_content')}
                        </label>
                        <textarea
                            value={notificationContent}
                            onChange={(e) => setNotificationContent(e.target.value)}
                            rows={3}
                            placeholder={t('systemSettings.notification_content_placeholder')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* テスト送信先 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('systemSettings.test_email')}
                        </label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* 通知チャンネル */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('systemSettings.notification_channel')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleChannelChange('email')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    notificationChannels.email
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {t('systemSettings.channel_email')}
                            </button>
                            <button
                                onClick={() => handleChannelChange('inApp')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    notificationChannels.inApp
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {t('systemSettings.channel_in_app')}
                            </button>
                        </div>
                    </div>

                    {/* 送信タイミング */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('systemSettings.send_timing')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['7days', '1day', '2hours', 'custom'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSendTiming(option)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        sendTiming === option
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {t(`systemSettings.timing_${option}`)}
                                </button>
                            ))}
                        </div>
                        {sendTiming === 'custom' && (
                            <input
                                type="text"
                                value={customTiming}
                                onChange={(e) => setCustomTiming(e.target.value)}
                                placeholder={t('systemSettings.custom_timing_placeholder')}
                                className="mt-3 px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                            {t('systemSettings.timing_note')}
                        </p>
                    </div>
                </div>

                {/* 操作ボタン */}
                <div className="flex justify-center gap-3 pt-4">
                    <button
                        onClick={handlePreview}
                        className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                        {t('systemSettings.preview')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                    >
                        {saving ? t('common.processing') : t('systemSettings.save')}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                    >
                        {t('common.cancel')}
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {t('systemSettings.preview_title')}
                        </h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                            <p className="font-semibold text-gray-800 mb-2">
                                {notificationTitle || t('systemSettings.no_title')}
                            </p>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">
                                {notificationContent || t('systemSettings.no_content')}
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                {t('systemSettings.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}