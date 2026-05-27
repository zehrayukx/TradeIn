import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('tradein_theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('tradein_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const getThemeClasses = (theme) => {
  const isDark = theme === 'dark';
  return {
    pageBg:        isDark ? 'bg-[#0a0f1d]'  : 'bg-slate-100',
    navBg:         isDark ? 'bg-[#0f1117]'  : 'bg-white',
    sidebarBg:     isDark ? 'bg-[#0f1117]'  : 'bg-white',
    cardBg:        isDark ? 'bg-[#0f1117]'  : 'bg-white',
    cardBg2:       isDark ? 'bg-[#161b22]'  : 'bg-slate-100',
    deepCardBg:    isDark ? 'bg-[#1a1d26]'  : 'bg-slate-50',
    modalBg:       isDark ? 'bg-[#1a1d26]'  : 'bg-white',
    inputBg:       isDark ? 'bg-[#0a0f1d]'  : 'bg-white',
    dropdownBg:    isDark ? 'bg-[#1a1d26]'  : 'bg-white',
    tagBg:         isDark ? 'bg-[#161b22]'  : 'bg-slate-200',
    activeBg:      isDark ? 'bg-blue-600/10': 'bg-blue-50',
    border:        isDark ? 'border-gray-800'     : 'border-gray-200',
    cardBorder:    isDark ? 'border-gray-800'     : 'border-gray-200',
    deepCardBorder:isDark ? 'border-gray-700/50'  : 'border-gray-200',
    inputBorder:   isDark ? 'border-gray-700'     : 'border-gray-300',
    navBorder:     isDark ? 'border-gray-800'     : 'border-gray-200',
    textPrimary:   isDark ? 'text-white'     : 'text-gray-900',
    textSecond:    isDark ? 'text-gray-400'  : 'text-gray-600',
    textMuted:     isDark ? 'text-gray-500'  : 'text-gray-400',
    textActive:    isDark ? 'text-blue-400'  : 'text-blue-600',
    placeholder:   isDark ? 'placeholder-gray-600': 'placeholder-gray-400',
    hoverBg:       isDark ? 'hover:bg-gray-800'  : 'hover:bg-gray-100',
    hoverText:     isDark ? 'hover:text-white'   : 'hover:text-gray-900',
    linkHover:     isDark ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-blue-50 hover:text-blue-700',
    linkActive:    isDark ? 'bg-blue-600/10 text-blue-500'      : 'bg-blue-50 text-blue-700',
    linkInactive:  isDark ? 'text-gray-400' : 'text-gray-600',
    searchBg:      isDark ? 'bg-[#1a1d26]'  : 'bg-slate-100',
    searchBorder:  isDark ? 'border-gray-800'    : 'border-gray-300',
    tabBg:         isDark ? 'bg-[#161b22]'  : 'bg-white',
    tabText:       isDark ? 'text-gray-400' : 'text-gray-600',
    tabHover:      isDark ? 'hover:bg-[#1f2937] hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900',
    logoutText:    isDark ? 'text-red-400'  : 'text-red-500',
    logoutHover:   isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50',
    toggleOff:     isDark ? 'bg-gray-700'   : 'bg-gray-300',
    divider:       isDark ? 'border-gray-800'    : 'border-gray-200',
  };
};
