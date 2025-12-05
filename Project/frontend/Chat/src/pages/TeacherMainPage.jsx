// 教師メイン - 学生一覧
import TeacherLayout from '../components/Layout/TeacherLayout';


export default function TeacherMainPage() {
    // Sample student data
    const students = [
        { id: 1, name: 'Aさん', class: '日本語1', lastMessage: '未読', status: '未読', color: 'bg-yellow-200' },
        { id: 2, name: 'Bさん', class: '日本語2', lastMessage: '既読', status: '既読', color: 'bg-orange-200' },
        { id: 3, name: '...', class: '...', lastMessage: '', status: '', color: 'bg-red-200' },
        { id: 4, name: '...', class: '...', lastMessage: '', status: '', color: 'bg-blue-200' },
    ];

    return (
        <TeacherLayout title="学生一覧">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">学生名</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">クラス</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">最終メッセージ</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">状態</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full ${student.color} flex items-center justify-center font-bold text-gray-700 shadow-sm`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-900">{student.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {student.class}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-600 text-sm">{student.lastMessage}</td>
                                <td className="py-4 px-6">
                                    {student.status && (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            student.status === '未読' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {student.status}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <button className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm">
                                        送信
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </TeacherLayout>
    );
}