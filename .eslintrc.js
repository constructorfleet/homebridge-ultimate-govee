module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'unicorn', 'unused-imports'],
  rules: {
    'require-await': 'error',
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-empty-function': 0,
    'unused-imports/no-unused-imports-ts': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
    ],
    'unused-imports/no-unused-imports-ts': 'warn',
    quotes: ['warn', 'single', { avoidEscape: true }],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'class', format: ['PascalCase'], leadingUnderscore: 'allow' },
      { selector: 'method', format: ['camelCase'], leadingUnderscore: 'allow' },
    ],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['__tests__/**', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {},
    },
    {
      files: ['**/*.gen.ts'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/ban-types': 'off',
      },
    },
    {
      files: ['**/*.js'],
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
    {
      files: ['libs/**/*.ts', '!**/__generated__/**'],
      rules: {
        'no-console': 1,
      },
    },
  ],
};
