import { useTheme } from 'next-themes';

export function useThemeStyles() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    card: {
      light: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300',
      dark: 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 hover:border-slate-600'
    },
    cardTitle: {
      light: 'text-gray-900 group-hover:text-gray-700',
      dark: 'text-white group-hover:text-cyan-400'
    },
    cardText: {
      light: 'text-gray-600',
      dark: 'text-slate-400'
    },
    cardSubtle: {
      light: 'text-gray-600',
      dark: 'text-slate-300'
    },
    badge: {
      light: 'bg-gray-200 text-gray-700 border-gray-300',
      dark: 'bg-slate-700 text-slate-300'
    },
    urgentCard: {
      light: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300',
      dark: 'bg-gradient-to-r from-slate-800 to-slate-900 border-red-500/30 hover:border-red-500/60'
    },
    urgentText: {
      light: 'text-red-900 group-hover:text-red-700',
      dark: 'text-white group-hover:text-red-400'
    },
    urgentSubtle: {
      light: 'text-red-800/70',
      dark: 'text-slate-400'
    },
    border: {
      light: 'border-gray-200',
      dark: 'border-slate-700/30'
    }
  };
}
