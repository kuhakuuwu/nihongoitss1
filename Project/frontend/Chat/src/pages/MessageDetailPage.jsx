// メッセージ詳細
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import StudentLayout from '../components/Layout/StudentLayout';

export default function MessageDetailPage() {
    const { id } = useParams();
    const [showAIPopover, setShowAIPopover] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    // Sample message data
    const message = {
        title: '明日の会議について...',
        sender: 'プロジェクトXの総括部署',
        recipient: '布留さん',
        date: '2025年10月11日 10:30',
        attachment: '会議資料.pdf',
        content: '布留さん、お世話になっております。\n変更させていただきますでしょうか。\nいたします。 何卒よろしくお願い申し。',
        aiSuggestion: {
            text: 'はい。承知しました。ご連絡ありがとうございます。\n\n了解しました。変更の件、問題ありません。\n\nありがとうございます。14時からの会議でよろしくお願いいたします。',
            suggestions: [
                'はい。承知しました。ご連絡ありがとうございます。',
                '了解しました。変更の件、問題ありません。',
                'ありがとうございます。14時からの会議でよろしくお願いいたします。'
            ],
            reactionOptions: [
                { text: '了解', count: 7, emoji: '👍' },
                { text: '確認', count: '', emoji: '✅' },
                { text: '承知しました', count: '', emoji: '🙏' }
            ]
        }
    };

    const [reactions, setReactions] = useState([
        { emoji: '👍', count: 2 },
        { emoji: '😭', count: 1 },
        { emoji: '✅', count: 1 },
        { emoji: '😊', count: 0 },
    ]);

    const handleEmojiClick = (emojiObject) => {
        const selectedEmoji = emojiObject.emoji;
        setReactions(prevReactions => {
            const existingReaction = prevReactions.find(r => r.emoji === selectedEmoji);
            if (existingReaction) {
                // Increment count if emoji already exists
                return prevReactions.map(r => 
                    r.emoji === selectedEmoji ? { ...r, count: r.count + 1 } : r
                );
            } else {
                // Add new emoji reaction
                return [...prevReactions, { emoji: selectedEmoji, count: 1 }];
            }
        });
        setShowEmojiPicker(false);
    };

    return (
        <StudentLayout title="メッセージ詳細">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
                    {/* Message Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{message.title}</h3>
                        <div className="space-y-1.5 text-sm text-gray-600">
                            <p><span className="font-medium">送信者:</span> {message.sender} {message.recipient}</p>
                            <p><span className="font-medium">受信者:</span> あなた</p>
                            <p><span className="font-medium">日時:</span> {message.date}</p>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-4 border-b border-gray-200">
                        {/* Attachment */}
                        {message.attachment && (
                            <div className="mb-4">
                                <button className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    {message.attachment}
                                </button>
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

                        {/* Reply Preview */}
                        {selectedSuggestion && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-2 mb-1.5">
                                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-semibold text-blue-700">返信プレビュー</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-line pl-6">{selectedSuggestion}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 flex flex-wrap items-center gap-2 relative">
                        <Link
                            to={`/student/reply/${id}`}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                        >
                            返信
                        </Link>
                        <button className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm">
                            削除
                        </button>
                        <button 
                            onClick={() => setShowAIPopover(!showAIPopover)}
                            className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 shadow-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0V9H4a1 1 0 110-2h3V4a1 1 0 011-1z"/>
                            </svg>
                            AI返信候補
                        </button>

                        {/* AI Popover */}
                        {showAIPopover && (
                            <div className="absolute left-6 bottom-full mb-2 w-[calc(100%-3rem)] md:w-[600px] bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-20">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <h3 className="text-lg font-bold text-gray-900">AI返信候補</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowAIPopover(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                <div className="mb-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700 mb-2">返信候補：</p>
                                    {message.aiSuggestion.suggestions.map((suggestion, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedSuggestion(suggestion)}
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
                                                        setSelectedSuggestion(suggestion);
                                                        setShowAIPopover(false);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                >
                                                    使用
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">リアクション候補：</p>
                                    <div className="flex flex-wrap gap-2">
                                        {message.aiSuggestion.reactionOptions.map((option, idx) => (
                                            <button
                                                key={idx}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:border-blue-400 transition-colors shadow-sm"
                                            >
                                                <span className="text-base">{option.emoji}</span>
                                                <span className="font-semibold">{option.text}</span>
                                                {option.count && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{option.count}件</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
                                    <button 
                                        onClick={() => setShowAIPopover(false)}
                                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                                        キャンセル
                                    </button>
                                    <button className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                        この返信を使用
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
                            メッセージ一覧へ戻る
                        </Link>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}