// メッセージ詳細
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EmojiPicker from 'emoji-picker-react';
import StudentLayout from '../components/Layout/StudentLayout';
import { supabase } from '../supabaseClient';

export default function CreateReplyPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [showAIPopover, setShowAIPopover] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [reactions, setReactions] = useState([]);

    // AI suggestion data
    const aiSuggestion = {
        suggestions: [
            'はい。承知しました。ご連絡ありがとうございます。',
            '了解しました。変更の件、問題ありません。',
            'ありがとうございます。何卒よろしくお願いいたします。'
        ],
        reactionOptions: [
            { text: '了解', emoji: '👍' },
            { text: '確認', emoji: '✅' },
            { text: '承知しました', emoji: '🙏' }
        ]
    };

    useEffect(() => {
        const fetchMessage = async () => {
            if (!id) return;
            
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setMessage({
                    id: data.id,
                    title: data.title,
                    sender: data.sender_id,
                    recipient: data.recipient_id,
                    date: new Date(data.created_at).toLocaleString('ja-JP'),
                    content: data.content,
                    attachment: data.attachment_url || null
                });
            }
            setLoading(false);
        };

        fetchMessage();
    }, [id]);

    // Gửi phản hồi tin nhắn
    const handleSendReply = async () => {
        const content = replyContent || selectedSuggestion;
        if (!content || !content.trim()) {
            alert(t('reply.input_required'));
            return;
        }

        setSending(true);
        
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                alert(t('common.login_required'));
                navigate('/login');
                return;
            }

            // Tạo tin nhắn phản hồi với parent_id là id tin nhắn gốc
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: userData.username,
                    recipient_id: message.sender, // Gửi lại cho người gửi tin nhắn gốc
                    title: `Re: ${message.title}`,
                    content: content.trim(),
                    parent_id: parseInt(id), // Liên kết với tin nhắn gốc
                    status: '未読'
                });

            if (error) {
                console.error('Error sending reply:', error);
                alert(t('reply.send_failed'));
            } else {
                alert(t('reply.send_success'));
                navigate('/student');
            }
        } catch (err) {
            console.error('Error:', err);
            alert(t('reply.error_occurred'));
        } finally {
            setSending(false);
        }
    };

    // Gửi reaction (emoji) cho tin nhắn
    const handleSendReaction = async (emoji) => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) return;

            // Tạo tin nhắn reaction với title đặc biệt để nhận diện
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: userData.username,
                    recipient_id: message.sender,
                    title: `[REACTION]`,
                    content: emoji,
                    parent_id: parseInt(id),
                    status: '既読',
                    priority: 'normal' // Sử dụng giá trị hợp lệ
                });

            if (error) {
                console.error('Error sending reaction:', error);
            } else {
                // Cập nhật UI
                setReactions(prev => {
                    const existing = prev.find(r => r.emoji === emoji);
                    if (existing) {
                        return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r);
                    }
                    return [...prev, { emoji, count: 1 }];
                });
            }
        } catch (err) {
            console.error('Error:', err);
        }
        setShowEmojiPicker(false);
    };

    // Fetch reactions cho tin nhắn này
    useEffect(() => {
        const fetchReactions = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('messages')
                .select('content')
                .eq('parent_id', id)
                .eq('title', '[REACTION]');

            if (!error && data) {
                // Đếm số lượng mỗi emoji
                const reactionCounts = {};
                data.forEach(r => {
                    reactionCounts[r.content] = (reactionCounts[r.content] || 0) + 1;
                });
                
                const reactionsArray = Object.entries(reactionCounts).map(([emoji, count]) => ({
                    emoji,
                    count
                }));
                setReactions(reactionsArray);
            }
        };

        fetchReactions();
    }, [id]);

    const handleEmojiClick = (emojiObject) => {
        handleSendReaction(emojiObject.emoji);
    };

    if (loading) {
        return (
            <StudentLayout title={t('reply.title')}>
                <div className="flex justify-center items-center py-20">
                    <div className="text-gray-500">{t('reply.loading')}</div>
                </div>
            </StudentLayout>
        );
    }

    if (!message) {
        return (
            <StudentLayout title={t('reply.title')}>
                <div className="flex flex-col justify-center items-center py-20">
                    <div className="text-gray-500 mb-4">{t('reply.not_found')}</div>
                    <Link to="/student" className="text-blue-600 hover:text-blue-800">
                        {t('reply.back_to_list')}
                    </Link>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title={t('reply.title')}>
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
                    {/* Message Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{message.title}</h3>
                        <div className="space-y-1.5 text-sm text-gray-600">
                            <p><span className="font-medium">{t('reply.sender')}:</span> {message.sender}</p>
                            <p><span className="font-medium">{t('reply.recipient')}:</span> {t('reply.you')} ({message.recipient})</p>
                            <p><span className="font-medium">{t('reply.datetime')}:</span> {message.date}</p>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-4 border-b border-gray-200">
                        {/* Attachment */}
                        {message.attachment && (
                            <div className="mb-4">
                                <a 
                                    href={message.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    {message.attachment.split('/').pop().split('?')[0] || 'Tệp đính kèm'}
                                </a>
                            </div>
                        )}

                        {/* Content */}
                        <div className="mb-3">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-gray-800 whitespace-pre-line leading-relaxed mb-3">{message.content}</p>
                                
                                {/* Reactions */}
                                <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-gray-200 relative">
                                    {reactions.filter(r => r.count > 0).map((reaction, idx) => (
                                        <button
                                            key={idx}
                                            className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-blue-50 rounded-full transition-colors border border-gray-300 hover:border-blue-400 text-xs"
                                        >
                                            <span className="text-sm">{reaction.emoji}</span>
                                            <span className="font-semibold text-gray-700">{reaction.count}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="flex items-center justify-center w-6 h-6 bg-white hover:bg-blue-50 rounded-full transition-colors border border-dashed border-gray-400 hover:border-blue-400"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>

                                    {/* Emoji Picker Popover */}
                                    {showEmojiPicker && (
                                        <div className="absolute left-0 top-full mt-2 z-30">
                                            <EmojiPicker
                                                onEmojiClick={handleEmojiClick}
                                                width={350}
                                                height={400}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reply Input Section */}
                    <div className="p-4 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">{t('reply.create_reply')}</h4>
                        
                        {/* Selected AI Suggestion Preview */}
                        {selectedSuggestion && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-2 mb-1.5">
                                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-semibold text-blue-700">{t('reply.ai_selected')}</span>
                                    <button 
                                        onClick={() => setSelectedSuggestion(null)}
                                        className="ml-auto text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        {t('reply.clear')}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-line pl-6">{selectedSuggestion}</p>
                            </div>
                        )}

                        {/* Reply Textarea */}
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows="4"
                            placeholder={t('reply.placeholder')}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        
                        {/* Send Reply Button */}
                        <div className="flex justify-end mt-3">
                            <button 
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSendReply}
                                disabled={sending || (!replyContent.trim() && !selectedSuggestion)}
                            >
                                {sending ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('reply.sending')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        {t('reply.send_reply')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>


                    {/* Action Buttons */}
                    <div className="p-4 flex flex-wrap items-center gap-2 relative">
                        <button 
                            onClick={() => navigate('/student')}
                            className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm"
                        >
                            {t('reply.back')}
                        </button>
                        <button 
                            onClick={() => setShowAIPopover(!showAIPopover)}
                            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 shadow-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0V9H4a1 1 0 110-2h3V4a1 1 0 011-1z"/>
                            </svg>
                            {t('reply.ai_suggestions')}
                        </button>

                        {/* AI Popover */}
                        {showAIPopover && (
                            <div className="absolute left-6 bottom-full mb-2 w-[calc(100%-3rem)] md:w-[600px] bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-20">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <h3 className="text-lg font-bold text-gray-900">{t('reply.ai_suggestions')}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowAIPopover(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                <div className="mb-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700 mb-2">{t('reply.reply_suggestions')}</p>
                                    {aiSuggestion.suggestions.map((suggestion, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setReplyContent(suggestion);
                                                setSelectedSuggestion(suggestion);
                                            }}
                                            className={`p-3 rounded-lg border transition-colors cursor-pointer group ${
                                                selectedSuggestion === suggestion 
                                                    ? 'bg-green-100 border-green-400' 
                                                    : 'bg-green-50 border-green-200 hover:border-green-400'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm text-gray-800 leading-relaxed flex-1">
                                                    {suggestion}
                                                </p>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReplyContent(suggestion);
                                                        setSelectedSuggestion(suggestion);
                                                        setShowAIPopover(false);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                >
                                                    {t('reply.use')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">{t('reply.reaction_suggestions')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {aiSuggestion.reactionOptions.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    handleSendReaction(option.emoji);
                                                    setShowAIPopover(false);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:border-blue-400 transition-colors shadow-sm"
                                            >
                                                <span className="text-base">{option.emoji}</span>
                                                <span className="font-semibold">{option.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
                                    <button 
                                        onClick={() => setShowAIPopover(false)}
                                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                                        {t('reply.cancel')}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (selectedSuggestion) {
                                                setReplyContent(selectedSuggestion);
                                            }
                                            setShowAIPopover(false);
                                        }}
                                        disabled={!selectedSuggestion}
                                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('reply.use_this_reply')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Back Link */}
                    <div className="px-4 pb-4">
                        <Link to="/student" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 12L3 7l5-5 1.5 1.5L6.5 6.5H13v2H6.5l3 3L8 12z"/>
                            </svg>
                            {t('reply.back_to_list')}
                        </Link>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}