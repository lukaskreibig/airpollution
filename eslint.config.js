import { fileURLToPath } from 'url';
import { dirname } from 'path';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  // Configuration for TypeScript files
  {
    files: ['**/*.{ts,tsx}'], // Target TypeScript files
    ignores: ['src/setupTests.ts'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        tsconfigRootDir: __dirname, // Use the directory of the eslint.config.js
        project: ['./tsconfig.json'], // Path to your tsconfig.json
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...eslintPluginPrettier.configs.recommended.rules,
      'prettier/prettier': ['error'],
    },
  },
  // Configuration for JavaScript files
  {
    files: ['**/*.{js,jsx}'], // Target JavaScript files
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintPluginPrettier.configs.recommended.rules,
      'prettier/prettier': ['error'],
    },
  },
];
