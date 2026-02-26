import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // type-aware 解析器配置（no-deprecated 需要）
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      // 弃用 API 检测（捕获 IDE 里的 ts6385 Suggestion）
      '@typescript-eslint/no-deprecated': 'error',
      // 导入分组顺序：React → 三方库 → 内部模块 → 样式
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react'], // React
            ['^@?\\w'], // 三方库（antd、dayjs、recharts 等）
            ['^@/'], // 内部路径别名（@/components、@/types 等）
            ['^\\.\\./|^\\./'], // 相对路径（../、./）
            ['^.+\\.css$'], // 样式文件最后
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
