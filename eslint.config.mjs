import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // นำเข้า config ที่แนะนำจาก next.js และ typescript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // เพิ่มกฎที่ต้องการปรับแต่ง
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // ปิดกฎการตรวจจับตัวแปรที่ไม่ได้ใช้
    },
  },
];

export default eslintConfig;
