import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config(
 { ignores: ['.next/**', 'legacy/**', 'backend/**', 'node_modules/**', 'next-env.d.ts'] },
 { files: ['src/**/*.{ts,tsx}'], extends: [js.configs.recommended, ...tseslint.configs.recommended], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks }, rules: { ...hooks.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] } }
);
