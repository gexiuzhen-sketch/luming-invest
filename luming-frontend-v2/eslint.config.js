import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // API 服务大量使用 any 处理 JSON 响应，降级为警告
      '@typescript-eslint/no-explicit-any': 'warn',
      // Context 文件混合导出 hook 和 provider 是正常模式，降级为警告
      'react-refresh/only-export-components': 'warn',
      // useEffect 中同步 setState 在初始化场景是常见模式，降级为警告
      'react-hooks/set-state-in-effect': 'warn',
      // 允许 _ 前缀的未使用变量，catch 块中的 error 变量无需强制使用
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
    },
  },
])
