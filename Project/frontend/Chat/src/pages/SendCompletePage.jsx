// 送信完了
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeacherLayout from "../components/Layout/TeacherLayout";

export default function SendCompletePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy message id từ state nếu có (để quay về chi tiết tin nhắn)
    const messageId = location.state?.messageId;

    // Quay về trang chính giáo viên
    const handleBackToHome = () => {
        navigate("/teacher");
    };

    // Quay về chi tiết tin nhắn
    const handleBackToMessageDetail = () => {
        if (messageId) {
            navigate(`/teacher/message/${messageId}`);
        } else {
            navigate("/teacher/create-message");
        }
    };

    return (
        <TeacherLayout title={t('sendComplete.title')}>
            <div className="max-w-2xl mx-auto py-6">
                {/* Success Card */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                    <div className="flex items-center gap-4">
                        {/* Checkmark Icon */}
                        <div className="shrink-0">
                            <div className="w-14 h-14 bg-white border-2 border-green-500 rounded-full flex items-center justify-center">
                                <svg 
                                    className="w-8 h-8 text-green-500" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={3} 
                                        d="M5 13l4 4L19 7" 
                                    />
                                </svg>
                            </div>
                        </div>
                        
                        {/* Messages */}
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-800 mb-1">
                                {t('sendComplete.success_title')}
                            </h2>
                            <p className="text-gray-600 text-sm">
                                {t('sendComplete.success_message')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info message */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-gray-600 text-sm">
                        {t('sendComplete.check_history')}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToHome}
                        className="px-5 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                    >
                        {t('sendComplete.back_to_home')}
                    </button>
                    <button
                        onClick={handleBackToMessageDetail}
                        className="px-5 py-2 bg-white text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        {t('sendComplete.back_to_message_detail')}
                    </button>
                </div>
            </div>
        </TeacherLayout>
    );
}