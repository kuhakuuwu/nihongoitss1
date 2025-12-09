import Header from './Header';
import logoBg from '../../assets/logobg.svg';

export default function AuthLayout({ children, title, subtitle, hideUserInfo = false }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Header */}
            <Header hideUserInfo={hideUserInfo} />

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-6xl flex gap-12 items-center">

                    {/* FORM SECTION */}
                    <div className="w-full max-w-md">
                        {title && (
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-gray-600 mb-8">{subtitle}</p>
                        )}

                        {children}
                    </div>

                    {/* ILLUSTRATION */}
                    <div className="hidden lg:block flex-1">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            <img
                                src={logoBg}
                                alt="EduConnect Illustration"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
