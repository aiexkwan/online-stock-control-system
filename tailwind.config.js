/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    // 更激進的 CSS 清理配置
    '!./node_modules/**/*',
    '!./dist/**/*',
    '!./.next/**/*',
  ],
  // 優化 CSS 使用率配置
  safelist: [
    // 保留關鍵的動態類名
    'text-green-500',
    'text-red-500', 
    'text-yellow-500',
    'bg-green-100',
    'bg-red-100',
    'bg-yellow-100',
    // 保留圖表相關類名 - 使用 pattern 物件格式
    {
      pattern: /^text-(chart-[1-5]|primary|secondary|muted)/,
      variants: ['hover', 'focus']
    },
    {
      pattern: /^bg-(chart-[1-5]|primary|secondary|muted)/,
      variants: ['hover', 'focus']
    },
    // 保留響應式類名 - 明確列出需要的 classes
    'sm:block',
    'sm:hidden',
    'md:block',
    'md:hidden',
    'lg:block',
    'lg:hidden',
    'xl:block',
    'xl:hidden',
    '2xl:block',
    '2xl:hidden',
    // 額外添加常用的圖表顏色類
    'text-chart-1',
    'text-chart-2',
    'text-chart-3',
    'text-chart-4',
    'text-chart-5',
    'bg-chart-1',
    'bg-chart-2',
    'bg-chart-3',
    'bg-chart-4',
    'bg-chart-5',
  ],
  theme: {
    extend: {
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontSize: {
        xxxs: '0.6rem', // 8px
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
