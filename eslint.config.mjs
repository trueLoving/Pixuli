/** REF-410：业务源码默认 TypeScript；本文件为登记的 ESLint flat-config 例外。 */
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

/** REF-209：core / provider 包不得依赖 UI 层 */
const noUiDependencyRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@pixuli/ui', '@pixuli/ui/*'],
          message:
            '不得依赖 @pixuli/ui：业务内核与 provider 包应保持无 UI 依赖（REF-209）',
        },
      ],
    },
  ],
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        {
          target: './packages/core',
          from: './packages/ui',
          message:
            '不得从 packages/ui 引用：@pixuli/core 与 @pixuli/ui 分层（REF-209）',
        },
        {
          target: './packages/core',
          from: './packages/ui/**',
          message:
            '不得从 packages/ui 引用：@pixuli/core 与 @pixuli/ui 分层（REF-209）',
        },
      ],
    },
  ],
};

const providerNoUiRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@pixuli/ui', '@pixuli/ui/*'],
          message:
            '不得依赖 @pixuli/ui：provider 包应保持无 UI 依赖（REF-209）',
        },
      ],
    },
  ],
  'import/no-restricted-paths': [
    'error',
    {
      zones: [
        {
          target: './packages/plugin-provider-github',
          from: './packages/ui',
          message:
            '不得从 packages/ui 引用：provider 与 ui 分层（REF-209）',
        },
        {
          target: './packages/plugin-provider-github',
          from: './packages/ui/**',
          message:
            '不得从 packages/ui 引用：provider 与 ui 分层（REF-209）',
        },
        {
          target: './packages/plugin-provider-gitee',
          from: './packages/ui',
          message:
            '不得从 packages/ui 引用：provider 与 ui 分层（REF-209）',
        },
        {
          target: './packages/plugin-provider-gitee',
          from: './packages/ui/**',
          message:
            '不得从 packages/ui 引用：provider 与 ui 分层（REF-209）',
        },
      ],
    },
  ],
};

const tsLanguageOptions = {
  parser: tseslint.parser,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/build/**',
      '**/.expo/**',
      'archive/**',
      '**/coverage/**',
    ],
  },
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    languageOptions: tsLanguageOptions,
    plugins: { import: importPlugin },
    rules: noUiDependencyRules,
  },
  {
    files: ['packages/plugin-provider-*/**/*.{ts,tsx}'],
    languageOptions: tsLanguageOptions,
    plugins: { import: importPlugin },
    rules: providerNoUiRules,
  },
);
