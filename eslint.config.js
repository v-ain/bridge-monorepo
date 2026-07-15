import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1. Игнорируемые папки
  {
    ignores: [
      '**/webpack.config.js',
      '**/eslint.config.js',
      '**/dist/**',
      '**/node_modules/**',
      '**/.vite/**',
      '**/*.config.*',
    ],
  },

  // 2. Базовые правила для всего монорепозитория
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Общие кастомные правила (Бэк, Фронт, Shared)
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // 4. Специфика фронтенда (Применяется только к папке client)
  {
    files: ['apps/client/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      // Добавляем глобальные переменные браузера (window, document, fetch)
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Подключаем критически важные правила для хуков и Fiber
      ...reactHooksPlugin.configs.recommended.rules,
      'react/jsx-uses-react': 'off', // Отключаем для React 17+
      'react/react-in-jsx-scope': 'off', // Отключаем для React 17+
    },
  },

  // 5. Специфика бэкенда (Применяется только к папке server)
  {
    files: ['apps/server/**/*.{ts,js}'],
    languageOptions: {
      // Добавляем глобальные переменные Node.js (process, require, __dirname)
      globals: {
        ...globals.node,
      },
    },
  },

  eslintConfigPrettier,
];
