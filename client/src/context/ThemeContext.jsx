import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export const THEMES = {
  light: {
    label: 'Default Light',
    vars: {
      '--bg': '#f5f4f1', '--surface': '#ffffff', '--surface2': '#f0ede8',
      '--border': '#e4e0d8', '--border-strong': '#ccc8bf',
      '--text': '#1a1917', '--text-2': '#6b6760', '--text-3': '#a8a49c',
      '--gold': '#9a7c3a', '--gold-bg': '#faf6ed', '--gold-border': '#e8d9a8',
      '--red': '#c0392b', '--green': '#2e7d52',
    }
  },
  dark: {
    label: 'Dark',
    vars: {
      '--bg': '#111214', '--surface': '#1a1c1e', '--surface2': '#222528',
      '--border': '#2e3135', '--border-strong': '#3e4248',
      '--text': '#e8e4dc', '--text-2': '#9a9690', '--text-3': '#5a5650',
      '--gold': '#c8a060', '--gold-bg': '#1e1a10', '--gold-border': '#3a3020',
      '--red': '#e05050', '--green': '#50b080',
    }
  },
  barbarian: {
    label: 'Barbarian',
    vars: {
      '--bg': '#1a0e0e', '--surface': '#241212', '--surface2': '#2e1616',
      '--border': '#3e2020', '--border-strong': '#5a2e2e',
      '--text': '#f0e0d8', '--text-2': '#b08070', '--text-3': '#704848',
      '--gold': '#e05030', '--gold-bg': '#1e1008', '--gold-border': '#5a2010',
      '--red': '#ff4040', '--green': '#60b060',
    }
  },
  wizard: {
    label: 'Wizard',
    vars: {
      '--bg': '#0e0e1a', '--surface': '#121224', '--surface2': '#16162e',
      '--border': '#20203e', '--border-strong': '#2e2e5a',
      '--text': '#d8d8f0', '--text-2': '#7070b0', '--text-3': '#404870',
      '--gold': '#8060e0', '--gold-bg': '#100e1e', '--gold-border': '#2010503',
      '--red': '#e05070', '--green': '#50b0a0',
    }
  },
  druid: {
    label: 'Druid',
    vars: {
      '--bg': '#0e140e', '--surface': '#121a12', '--surface2': '#162016',
      '--border': '#203020', '--border-strong': '#2e4a2e',
      '--text': '#d8ecd8', '--text-2': '#6a906a', '--text-3': '#405040',
      '--gold': '#60a040', '--gold-bg': '#0e180a', '--gold-border': '#2a4010',
      '--red': '#c05040', '--green': '#60c060',
    }
  },
  paladin: {
    label: 'Paladin',
    vars: {
      '--bg': '#14120e', '--surface': '#1c1a12', '--surface2': '#242016',
      '--border': '#3a3420', '--border-strong': '#5a5030',
      '--text': '#f0ecd8', '--text-2': '#9a9060', '--text-3': '#605840',
      '--gold': '#d4a820', '--gold-bg': '#1a1608', '--gold-border': '#4a3a08',
      '--red': '#d04030', '--green': '#60a040',
    }
  },
  rogue: {
    label: 'Rogue',
    vars: {
      '--bg': '#0e0e0e', '--surface': '#141414', '--surface2': '#1a1a1a',
      '--border': '#282828', '--border-strong': '#383838',
      '--text': '#d0d0c8', '--text-2': '#707068', '--text-3': '#404038',
      '--gold': '#a09060', '--gold-bg': '#161410', '--gold-border': '#302c20',
      '--red': '#c04040', '--green': '#507840',
    }
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ll_theme') || 'light')

  useEffect(() => {
    const vars = THEMES[theme]?.vars || THEMES.light.vars
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('ll_theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>{children}</ThemeContext.Provider>
}
