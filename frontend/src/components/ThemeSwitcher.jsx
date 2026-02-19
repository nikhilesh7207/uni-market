import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';

const ThemeSwitcher = () => {
    const { theme, setTheme, themes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Theme Options Menu */}
            <div
                className={`absolute bottom-full right-0 mb-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[200px] transition-all duration-300 origin-bottom-right ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                    }`}
            >
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">
                    Select Theme
                </div>

                <div className="space-y-1">
                    {Object.entries(themes).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => handleThemeChange(key)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === key
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${key === 'sage' ? 'bg-[#7C9082]' :
                                        key === 'teal' ? 'bg-[#2D6E7E]' :
                                            'bg-[#E5D4B0]'
                                    }`}></span>
                                {label}
                            </span>
                            {theme === key && <Check size={14} className="text-gray-900" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleOpen}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen ? 'bg-gray-900 text-white rotate-90' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                title="Change Theme"
            >
                <Palette size={24} />
            </button>
        </div>
    );
};

export default ThemeSwitcher;
