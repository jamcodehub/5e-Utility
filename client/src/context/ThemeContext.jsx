import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export const THEMES = {
  light: {
    label: 'Light',
    vars: {
      '--bg': '#f5f4f1', '--surface': '#ffffff', '--surface2': '#f0ede8',
      '--border': '#e4e0d8', '--border-strong': '#ccc8bf',
      '--text': '#1a1917', '--text-2': '#6b6760', '--text-3': '#a8a49c',
      '--gold': '#9a7c3a', '--gold-bg': '#faf6ed', '--gold-border': '#e8d9a8',
      '--red': '#c0392b', '--green': '#2e7d52',
      '--sb-outer': '#ffffff', '--sb-bar': '#f5f4f1', '--sb-bar-border': '#faf6ed',
      '--sb-accent': '#c8a060', '--sb-spine': '#b39b74',
      '--sb-page-start': '#f7efde', '--sb-page-end': '#ede1c8',
      '--sb-page-title': '#3f2b1f', '--sb-page-body': '#5b4431', '--sb-page-meta': '#9a8060',
      '--logo-filter': 'none',
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
      '--sb-outer': '#080a0c', '--sb-bar': '#0e1014', '--sb-bar-border': '#1e2428',
      '--sb-accent': '#c8a060', '--sb-spine': '#3e4860',
      '--sb-page-start': '#1a1c22', '--sb-page-end': '#141618',
      '--sb-page-title': '#d8e0f0', '--sb-page-body': '#a0a8b8', '--sb-page-meta': '#505870',
      '--logo-filter': 'invert(1)',
    }
  },
  barbarian: {
    label: 'Barbarian', premium: true,
    vars: {
      '--bg': '#1a0e0e', '--surface': '#241212', '--surface2': '#2e1616',
      '--border': '#3e2020', '--border-strong': '#5a2e2e',
      '--text': '#f0e0d8', '--text-2': '#b08070', '--text-3': '#704848',
      '--gold': '#e05030', '--gold-bg': '#1e1008', '--gold-border': '#5a2010',
      '--red': '#ff4040', '--green': '#60b060',
      '--sb-outer': '#0a0808', '--sb-bar': '#140a0a', '--sb-bar-border': '#2a1010',
      '--sb-accent': '#e05030', '--sb-spine': '#6a2010',
      '--sb-page-start': '#1e1010', '--sb-page-end': '#180c0c',
      '--sb-page-title': '#f0d8d0', '--sb-page-body': '#c09080', '--sb-page-meta': '#806050',
      '--logo-filter': 'invert(1)',
    }
  },
  wizard: {
    label: 'Wizard', premium: true,
    vars: {
      '--bg': '#080e1a', '--surface': '#0c1228', '--surface2': '#101832',
      '--border': '#141e50', '--border-strong': '#1c2a70',
      '--text': '#c8d8f8', '--text-2': '#5070c0', '--text-3': '#303870',
      '--gold': '#3060d0', '--gold-bg': '#080e1c', '--gold-border': '#0e1c50',
      '--red': '#e04060', '--green': '#40a090',
      '--sb-outer': '#040810', '--sb-bar': '#080c18', '--sb-bar-border': '#101828',
      '--sb-accent': '#3060d0', '--sb-spine': '#102470',
      '--sb-page-start': '#0c1020', '--sb-page-end': '#080c18',
      '--sb-page-title': '#b8d0f8', '--sb-page-body': '#6080c0', '--sb-page-meta': '#404878',
      '--logo-filter': 'invert(1)',
    }
  },
  druid: {
    label: 'Druid', premium: true,
    vars: {
      '--bg': '#0e140e', '--surface': '#121a12', '--surface2': '#162016',
      '--border': '#203020', '--border-strong': '#2e4a2e',
      '--text': '#d8ecd8', '--text-2': '#6a906a', '--text-3': '#405040',
      '--gold': '#60a040', '--gold-bg': '#0e180a', '--gold-border': '#2a4010',
      '--red': '#c05040', '--green': '#60c060',
      '--sb-outer': '#080c08', '--sb-bar': '#0c120c', '--sb-bar-border': '#182018',
      '--sb-accent': '#60a040', '--sb-spine': '#204810',
      '--sb-page-start': '#101a10', '--sb-page-end': '#0c140c',
      '--sb-page-title': '#d0f0d0', '--sb-page-body': '#80b080', '--sb-page-meta': '#405840',
      '--logo-filter': 'invert(1)',
    }
  },
  paladin: {
    label: 'Paladin', premium: true,
    vars: {
      '--bg': '#14120e', '--surface': '#1c1a12', '--surface2': '#242016',
      '--border': '#3a3420', '--border-strong': '#5a5030',
      '--text': '#f0ecd8', '--text-2': '#9a9060', '--text-3': '#605840',
      '--gold': '#d4a820', '--gold-bg': '#1a1608', '--gold-border': '#4a3a08',
      '--red': '#d04030', '--green': '#60a040',
      '--sb-outer': '#0a0800', '--sb-bar': '#141000', '--sb-bar-border': '#2a2410',
      '--sb-accent': '#d4a820', '--sb-spine': '#6a5010',
      '--sb-page-start': '#1c1808', '--sb-page-end': '#141208',
      '--sb-page-title': '#f0ecc8', '--sb-page-body': '#c0b080', '--sb-page-meta': '#806830',
      '--logo-filter': 'invert(1)',
    }
  },
  rogue: {
    label: 'Rogue', premium: true,
    vars: {
      '--bg': '#0e0e0e', '--surface': '#141414', '--surface2': '#1a1a1a',
      '--border': '#282828', '--border-strong': '#383838',
      '--text': '#d0d0c8', '--text-2': '#707068', '--text-3': '#404038',
      '--gold': '#a09060', '--gold-bg': '#161410', '--gold-border': '#302c20',
      '--red': '#c04040', '--green': '#507840',
      '--sb-outer': '#060606', '--sb-bar': '#0c0c0c', '--sb-bar-border': '#1a1a1a',
      '--sb-accent': '#a09060', '--sb-spine': '#303030',
      '--sb-page-start': '#161616', '--sb-page-end': '#101010',
      '--sb-page-title': '#d0d0c0', '--sb-page-body': '#909080', '--sb-page-meta': '#505048',
      '--logo-filter': 'invert(1)',
    }
  },
  bard: {
    label: 'Bard', premium: true,
    vars: {
      '--bg': '#160e14', '--surface': '#1e1220', '--surface2': '#261628',
      '--border': '#3a1e38', '--border-strong': '#542a52',
      '--text': '#f0d8ee', '--text-2': '#b078a8', '--text-3': '#704868',
      '--gold': '#e060a0', '--gold-bg': '#1a0e18', '--gold-border': '#5a1e48',
      '--red': '#e05050', '--green': '#60b060',
      '--sb-outer': '#0c060c', '--sb-bar': '#140e14', '--sb-bar-border': '#2a1428',
      '--sb-accent': '#e060a0', '--sb-spine': '#7a2868',
      '--sb-page-start': '#1c1018', '--sb-page-end': '#160c14',
      '--sb-page-title': '#f0c0e8', '--sb-page-body': '#b080a0', '--sb-page-meta': '#704060',
      '--logo-filter': 'invert(1)',
    }
  },
  cleric: {
    label: 'Cleric', premium: true,
    vars: {
      '--bg': '#141210', '--surface': '#1e1c18', '--surface2': '#282620',
      '--border': '#403808', '--border-strong': '#60560c',
      '--text': '#f8f0d8', '--text-2': '#b0a070', '--text-3': '#706040',
      '--gold': '#e8c840', '--gold-bg': '#1a1808', '--gold-border': '#504000',
      '--red': '#e06040', '--green': '#70b850',
      '--sb-outer': '#0c0c08', '--sb-bar': '#161408', '--sb-bar-border': '#302808',
      '--sb-accent': '#e8c840', '--sb-spine': '#8a7020',
      '--sb-page-start': '#1e1c10', '--sb-page-end': '#181608',
      '--sb-page-title': '#f8f0c0', '--sb-page-body': '#c0a870', '--sb-page-meta': '#807040',
      '--logo-filter': 'invert(1)',
    }
  },
  fighter: {
    label: 'Fighter', premium: true,
    vars: {
      '--bg': '#100a00', '--surface': '#1a1000', '--surface2': '#241400',
      '--border': '#3c2000', '--border-strong': '#582e00',
      '--text': '#f0e0c8', '--text-2': '#a07040', '--text-3': '#604020',
      '--gold': '#e07020', '--gold-bg': '#180c00', '--gold-border': '#581e00',
      '--red': '#e04020', '--green': '#60a040',
      '--sb-outer': '#080400', '--sb-bar': '#120800', '--sb-bar-border': '#281400',
      '--sb-accent': '#e07020', '--sb-spine': '#6a2c00',
      '--sb-page-start': '#1c1008', '--sb-page-end': '#160c00',
      '--sb-page-title': '#f0d8a0', '--sb-page-body': '#b07840', '--sb-page-meta': '#705020',
      '--logo-filter': 'invert(1)',
    }
  },
  monk: {
    label: 'Monk', premium: true,
    vars: {
      '--bg': '#081418', '--surface': '#0c1a20', '--surface2': '#101e28',
      '--border': '#0e2838', '--border-strong': '#163858',
      '--text': '#c8e8f0', '--text-2': '#5090a8', '--text-3': '#2c5868',
      '--gold': '#20b0c0', '--gold-bg': '#081018', '--gold-border': '#0e2c38',
      '--red': '#e05050', '--green': '#40b880',
      '--sb-outer': '#040a10', '--sb-bar': '#080e18', '--sb-bar-border': '#0c1e2c',
      '--sb-accent': '#20b0c0', '--sb-spine': '#0c4860',
      '--sb-page-start': '#0c1218', '--sb-page-end': '#080e14',
      '--sb-page-title': '#b0e8f8', '--sb-page-body': '#5090a8', '--sb-page-meta': '#2c5868',
      '--logo-filter': 'invert(1)',
    }
  },
  ranger: {
    label: 'Ranger', premium: true,
    vars: {
      '--bg': '#0e1210', '--surface': '#141a14', '--surface2': '#1a2018',
      '--border': '#243020', '--border-strong': '#384830',
      '--text': '#d0e0c8', '--text-2': '#6a8860', '--text-3': '#405038',
      '--gold': '#70a060', '--gold-bg': '#0e1408', '--gold-border': '#243818',
      '--red': '#c05040', '--green': '#60c050',
      '--sb-outer': '#080e08', '--sb-bar': '#0c1208', '--sb-bar-border': '#182014',
      '--sb-accent': '#70a060', '--sb-spine': '#304828',
      '--sb-page-start': '#101810', '--sb-page-end': '#0c1408',
      '--sb-page-title': '#c8e0c0', '--sb-page-body': '#6a9860', '--sb-page-meta': '#405838',
      '--logo-filter': 'invert(1)',
    }
  },
  sorcerer: {
    label: 'Sorcerer', premium: true,
    vars: {
      '--bg': '#120818', '--surface': '#1a0c22', '--surface2': '#22102e',
      '--border': '#3a1248', '--border-strong': '#561868',
      '--text': '#f0d0f8', '--text-2': '#b060c8', '--text-3': '#703080',
      '--gold': '#c03080', '--gold-bg': '#160814', '--gold-border': '#581840',
      '--red': '#e03030', '--green': '#50b060',
      '--sb-outer': '#0a0610', '--sb-bar': '#100a18', '--sb-bar-border': '#281038',
      '--sb-accent': '#c03080', '--sb-spine': '#6a1050',
      '--sb-page-start': '#160c1e', '--sb-page-end': '#100818',
      '--sb-page-title': '#f0b8f0', '--sb-page-body': '#a858b8', '--sb-page-meta': '#702880',
      '--logo-filter': 'invert(1)',
    }
  },
  warlock: {
    label: 'Warlock', premium: true,
    vars: {
      '--bg': '#0c0814', '--surface': '#120c1e', '--surface2': '#181028',
      '--border': '#28145c', '--border-strong': '#3c1c80',
      '--text': '#e0d0f8', '--text-2': '#8060c0', '--text-3': '#483880',
      '--gold': '#9040e0', '--gold-bg': '#100a18', '--gold-border': '#2a1060',
      '--red': '#e04080', '--green': '#50a080',
      '--sb-outer': '#080610', '--sb-bar': '#0c0a18', '--sb-bar-border': '#1c1238',
      '--sb-accent': '#9040e0', '--sb-spine': '#401880',
      '--sb-page-start': '#101020', '--sb-page-end': '#0c0c18',
      '--sb-page-title': '#d8c0f8', '--sb-page-body': '#8060c0', '--sb-page-meta': '#483880',
      '--logo-filter': 'invert(1)',
    }
  },
  gunslinger: {
    label: 'Gunslinger', premium: true,
    vars: {
      '--bg': '#1a1208', '--surface': '#241808', '--surface2': '#2e1e0c',
      '--border': '#4a3018', '--border-strong': '#6a4420',
      '--text': '#f0e4c8', '--text-2': '#a08050', '--text-3': '#705830',
      '--gold': '#c8a060', '--gold-bg': '#1e1408', '--gold-border': '#6a4410',
      '--red': '#c83020', '--green': '#507030',
      '--sb-outer': '#0e0c06', '--sb-bar': '#181008', '--sb-bar-border': '#342008',
      '--sb-accent': '#c8a060', '--sb-spine': '#7a5020',
      '--sb-page-start': '#221808', '--sb-page-end': '#1c140a',
      '--sb-page-title': '#f0dca0', '--sb-page-body': '#c09060', '--sb-page-meta': '#806040',
      '--logo-filter': 'invert(1)',
    }
  },
  artificer: {
    label: 'Artificer', premium: true,
    vars: {
      '--bg': '#0e0c08', '--surface': '#181410', '--surface2': '#221c14',
      '--border': '#3a2c10', '--border-strong': '#584010',
      '--text': '#f0e8c0', '--text-2': '#a09030', '--text-3': '#605820',
      '--gold': '#d4a030', '--gold-bg': '#181200', '--gold-border': '#584800',
      '--red': '#e04020', '--green': '#688020',
      '--sb-outer': '#080800', '--sb-bar': '#101000', '--sb-bar-border': '#282000',
      '--sb-accent': '#d4a030', '--sb-spine': '#806000',
      '--sb-page-start': '#1a1600', '--sb-page-end': '#141200',
      '--sb-page-title': '#f0e090', '--sb-page-body': '#b09040', '--sb-page-meta': '#706020',
      '--logo-filter': 'invert(1)',
    }
  },
  bloodhunter: {
    label: 'Bloodhunter', premium: true,
    vars: {
      '--bg': '#0e0606', '--surface': '#160808', '--surface2': '#1e0c0c',
      '--border': '#3a1010', '--border-strong': '#581818',
      '--text': '#f0d8d8', '--text-2': '#a06060', '--text-3': '#704040',
      '--gold': '#c02020', '--gold-bg': '#180606', '--gold-border': '#601010',
      '--red': '#ff3030', '--green': '#508050',
      '--sb-outer': '#060404', '--sb-bar': '#0e0606', '--sb-bar-border': '#280a0a',
      '--sb-accent': '#c02020', '--sb-spine': '#6a0c0c',
      '--sb-page-start': '#180808', '--sb-page-end': '#120606',
      '--sb-page-title': '#f0c0c0', '--sb-page-body': '#a05050', '--sb-page-meta': '#703030',
      '--logo-filter': 'invert(1)',
    }
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('ll_theme') || 'light')
  // "Light mode" — applies a class theme's accent colours on top of light
  // backgrounds instead of that theme's (often very dark) native palette.
  // Lets premium users get a lighter variant of any class theme.
  const [lightMode, setLightMode] = useState(() => localStorage.getItem('ll_light_mode') === '1')

  useEffect(() => {
    const base = THEMES[theme]?.vars || THEMES.light.vars
    const isNeutral = theme === 'light' || theme === 'dark'
    const vars = (lightMode && !isNeutral)
      ? {
          ...THEMES.light.vars,
          '--gold': base['--gold'],
          '--sb-accent': base['--gold'],
          '--sb-spine': base['--gold'],
          '--red': base['--red'],
          '--green': base['--green'],
        }
      : base
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('ll_theme', theme)
    localStorage.setItem('ll_light_mode', lightMode ? '1' : '0')
  }, [theme, lightMode])

  return <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, lightMode, setLightMode }}>{children}</ThemeContext.Provider>
}
