const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary brand color: Gold
                "primary": {
                    ...colors.amber, // Using amber as base for gold-ish tones
                    DEFAULT: "#D4AF37", // Metallic Gold
                    600: "#D4AF37",
                    700: "#B5952F", // Darker gold for hover
                    100: "#F9F1D8", // Light gold tint
                    50: "#FCF8EC",
                },
                // Secondary brand color: Orange (as requested)
                "secondary": {
                    ...colors.orange,
                    DEFAULT: "#F97316", // Vibrant Orange
                    500: "#F97316",
                    600: "#EA580C",
                },
                // Additional tokens mapped to specific colors or palettes
                "background-light": "#FFFFFF", // White (secondary)
                "background-dark": "#000000", // Black (primary background)
                "surface-light": "#F8F8F8",
                "surface-dark": "#121212", // Slightly lighter black for cards
                "text-primary-light": "#000000", // Black text
                "text-primary-dark": "#D4AF37", // Gold text for headings in dark mode
                "text-secondary-light": "#525252",
                "text-secondary-dark": "#A3A3A3", // Light gray
                "border-light": "#E5E5E5",
                "border-dark": "#262626", // Dark gray border

                "success": {
                    ...colors.green, // Green (secondary)
                    DEFAULT: "#22C55E",
                },
                "danger": {
                    ...colors.red,
                    DEFAULT: "#EF4444",
                    500: "#EF4444",
                    600: "#DC2626",
                },
                "error": {
                    ...colors.red,
                    DEFAULT: "#EF4444",
                },
                "warning": {
                    ...colors.orange,
                    DEFAULT: "#F59E0B",
                },

                // Keeping existing 'dark' palette but tweaking for true black feel
                'dark': {
                    50: '#fafafa',
                    100: '#f5f5f5',
                    200: '#e5e5e5',
                    300: '#d4d4d4',
                    400: '#a3a3a3',
                    500: '#737373',
                    600: '#525252',
                    700: '#404040',
                    800: '#262626',
                    900: '#171717',
                    950: '#000000',
                }
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"],
                "sans": ["Inter", "system-ui", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'glow': '0 0 20px rgba(51, 115, 255, 0.3)',
                'glow-lg': '0 0 40px rgba(51, 115, 255, 0.4)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
