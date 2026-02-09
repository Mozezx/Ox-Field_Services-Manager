/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: '#0B242A',
                surface: '#132F35',
                primary: '#22D3EE',
                'primary-hover': '#06B6D4',
                secondary: '#94A3B8',
                danger: '#EF4444',
                success: '#22C55E',
                // Dispatch Console colors
                'primary-light': '#15333b',
                'accent': '#2dd4bf',
                'background-dark': '#131d1f',
                'surface-dark': '#1d2425',
                'border-dark': '#2b3436',
                'text-secondary': '#a1b1b5',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
