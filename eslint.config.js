import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      "@typescript-eslint/array-type": "off",
    },
  },
]
