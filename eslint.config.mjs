/** REF-410：业务源码默认 TypeScript；本文件为登记的 ESLint flat-config 例外。 */
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

const tsLanguageOptions = {
  parser: tseslint.parser,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};

const noUiFromCoreOrProvider = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@pixuli/ui', '@pixuli/ui/*', '@/ui', '@/ui/*'],
          message:
            '不得依赖 UI 层：core / provider 禁止引用 app/src/ui（REF-209）',
        },
      ],
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
    ],
  },
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    languageOptions: tsLanguageOptions,
    plugins: { import: importPlugin },
    rules: noUiFromCoreOrProvider,
  },
  {
    files: ['packages/plugin-provider-*/**/*.{ts,tsx}'],
    languageOptions: tsLanguageOptions,
    plugins: { import: importPlugin },
    rules: noUiFromCoreOrProvider,
  },
  {
    files: ['app/src/ui/**/*.{ts,tsx}'],
    languageOptions: tsLanguageOptions,
    plugins: { import: importPlugin },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@pixuli/provider-*',
                '@pixuli/provider-*/*',
                '@/storage/providers',
                '@/storage/providers/*',
              ],
              message:
                'src/ui 禁止依赖具体云 provider（目录边界，原 @pixuli/ui 契约）',
            },
          ],
        },
      ],
    },
  },
);
