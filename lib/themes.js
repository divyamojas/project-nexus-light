export const themes = {
  light: {
    bg: 'bg-stone-50',
    surface: 'bg-white',
    border: 'border-stone-200',
    text: 'text-slate-800',
    muted: 'text-stone-500',
    primary: 'text-emerald-600',
    primaryBg: 'bg-emerald-600',
    danger: 'text-red-600',
    dangerBg: 'bg-red-600',
    warning: 'text-amber-500',

    colors: {
      bg: '#fafaf9',
      surface: '#ffffff',
      border: '#e7e5e4',
      text: '#1e293b',
      muted: '#78716c',
      primary: '#059669',
      danger: '#dc2626',
      warning: '#f59e0b',
    },
  },
  dark: {
    bg: 'bg-slate-900',
    surface: 'bg-slate-800',
    border: 'border-slate-700',
    text: 'text-slate-200',
    muted: 'text-slate-400',
    primary: 'text-emerald-500',
    primaryBg: 'bg-emerald-500',
    danger: 'text-red-500',
    dangerBg: 'bg-red-500',
    warning: 'text-amber-400',

    colors: {
      bg: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
      text: '#e2e8f0',
      muted: '#94a3b8',
      primary: '#10b981',
      danger: '#ef4444',
      warning: '#fbbf24',
    },
  },
}

export function getTheme(mode) {
  return themes[mode] || themes.light
}
