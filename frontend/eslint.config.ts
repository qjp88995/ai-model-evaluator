import js from "@eslint/js";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // 导入分组顺序：React → 三方库 → 内部模块 → 样式
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react"],                  // React
            ["^@?\\w"],                  // 三方库（antd、dayjs、recharts 等）
            ["^\\.\\.?/"],              // 内部模块（../、./）
            ["^.+\\.css$"],             // 样式文件最后
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      // 关闭对 any 的严格限制（antd table render 等场景常用）
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
