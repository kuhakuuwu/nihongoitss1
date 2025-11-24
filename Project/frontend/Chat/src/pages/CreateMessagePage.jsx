// メッセージ作成
import TeacherLayout from '../components/Layout/TeacherLayout';
import { useState } from 'react';

export default function CreateMessagePage() {
    const [recipient, setRecipient] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isComplexMessage, setIsComplexMessage] = useState(false);
    const [requireConfirmation, setRequireConfirmation] = useState(false);

    // Sample recent messages
    const recentMessages = [
        {
            id: 1,
            title: '明日の会議について...',
            sender: 'プロジェクトXの総括部署',
            recipient: '布留さん',
            color: 'bg-yellow-200'
        },
        {
            id: 2,
            title: '商来先生',
            sender: 'プロジェクトYの総括部署',
            content: '繋がいいたいらないの履歴「やそ」いもちが',
            color: 'bg-orange-200'
        },
        {
            id: 3,
            title: '...',
            sender: '...',
            color: 'bg-red-200'
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log({ recipient, title, content, attachment, isComplexMessage, requireConfirmation });
    };

    return (
        <TeacherLayout title="メッセージ作成">
            <div className="flex gap-6">
                {/* Left side - Form */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">新しいメッセージ</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Recipient */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    受信者 <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">受信者を選択してください</option>
                                        <option value="student1">学生 1</option>
                                        <option value="student2">学生 2</option>
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    件名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="件名を入力してください"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    内容 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={8}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    placeholder="メッセージの内容を入力してください"
                                    required
                                />
                            </div>

                            {/* File Attachment */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    添付ファイル
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={(e) => setAttachment(e.target.files[0])}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        ファイルを選択
                                    </label>
                                    {attachment && (
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{attachment.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setAttachment(null)}
                                                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="complex-message"
                                            checked={isComplexMessage}
                                            onChange={(e) => setIsComplexMessage(e.target.checked)}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <label htmlFor="complex-message" className="ml-3 text-sm font-medium text-gray-700">
                                            複雑メッセージ
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="require-confirmation"
                                            checked={requireConfirmation}
                                            onChange={(e) => setRequireConfirmation(e.target.checked)}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <label htmlFor="require-confirmation" className="ml-3 text-sm font-medium text-gray-700">
                                            返信を要請
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm"
                                >
                                    送信
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right side - Recent Messages */}
                <div className="w-96">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg h-full flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
                            <h3 className="font-semibold text-gray-800">最近のメッセージ</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {recentMessages.map((message) => (
                                <div key={message.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full ${message.color} shrink-0 flex items-center justify-center`}>
                                            <span className="text-white font-semibold text-sm">
                                                {message.title.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{message.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{message.sender}</p>
                                            {message.recipient && (
                                                <p className="text-xs text-gray-600 mt-0.5">宛先: {message.recipient}</p>
                                            )}
                                            {message.content && (
                                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{message.content}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
}