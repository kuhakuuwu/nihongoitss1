// 学生メイン
import { Link } from 'react-router-dom';
import StudentLayout from '../components/Layout/StudentLayout';

export default function StudentMainPage() {
    
    // Sample messages data
    const messages = [
        {
            id: 1,
            title: '明日の会議について...',
            sender: 'プロジェクトXの総括部署',
            recipient: '布留さん',
            date: '10/10',
            status: '未読',
            color: 'bg-yellow-200'
        },
        {
            id: 2,
            title: '授業時間変わる',
            sender: 'プロジェクトYの総括部署',
            recipient: 'Bさん',
            date: '9/28',
            status: '既読',
            color: 'bg-orange-200'
        },
        {
            id: 3,
            title: '...',
            sender: '...',
            recipient: '...',
            date: '',
            status: '',
            color: 'bg-red-200'
        },
        {
            id: 4,
            title: '...',
            sender: '...',
            recipient: '...',
            date: '',
            status: '',
            color: 'bg-blue-200'
        },
    ];

    return (
        <StudentLayout title="受信メッセージ一覧">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">件名</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">送信者</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">送信日時</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">状態</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {messages.map((message) => (
                            <tr key={message.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full ${message.color} flex items-center justify-center font-bold text-gray-700 shadow-sm`}>
                                            {message.title.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{message.title}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-600 text-sm">{message.sender}</td>
                                <td className="py-4 px-6 text-gray-500 text-sm">{message.date}</td>
                                <td className="py-4 px-6">
                                    {message.status && (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            message.status === '未読'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {message.status}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex gap-2">
                                        <Link to={`/student/message/${message.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">
                                            詳細
                                        </Link>
                                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm">
                                            返信
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </StudentLayout>
    );
}