import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Default to 'sage' theme
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'sage';
    });

    useEffect(() => {
        // Remove old theme classes
        const root = document.documentElement;
        root.classList.remove('theme-sage', 'theme-teal', 'theme-beige');

        // Add new theme class
        root.classList.add(`theme-${theme}`);

        // Save to local storage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const value = {
        theme,
        setTheme,
        themes: {
            sage: 'Sage Green',
            teal: 'Teal & Blue',
            beige: 'Beige & Yellow'
        }
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
