/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vscode: {
          dark: {
            bg: '#1e1e1e',
            sidebar: '#252526',
            activity: '#333333',
            border: '#3c3c3c',
            tab: '#2d2d2d',
            tabActive: '#1e1e1e',
            tabHover: '#2a2d2e',
            status: '#007acc',
            text: '#cccccc',
            textLight: '#ffffff',
            input: '#3c3c3c',
            hover: '#2a2d2e',
            selected: '#094771',
          },
          light: {
            bg: '#ffffff',
            sidebar: '#f3f3f3',
            activity: '#2c2c2c',
            border: '#e5e5e5',
            tab: '#ececec',
            tabActive: '#ffffff',
            tabHover: '#e0e0e0',
            status: '#007acc',
            text: '#333333',
            textLight: '#000000',
            input: '#ffffff',
            hover: '#e8e8e8',
            selected: '#0060c0',
          },
        },
      },
    },
  },
  plugins: [],
};
