export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 100,

  plugins: ['@ianvs/prettier-plugin-sort-imports'],

  importOrder: [
    // 1. React / Next.js
    '^react$',
    '^react/(.*)$',
    '^next$',
    '^next/(.*)$',
    '',
    // 2. 외부 라이브러리
    '<THIRD_PARTY_MODULES>',
    '',
    // 3. FSD 레이어 순서 (상위 → 하위)
    '^@app/(.*)$',
    '^@views/(.*)$',
    '^@widgets/(.*)$',
    '^@features/(.*)$',
    '^@entities/(.*)$',
    '^@shared/(.*)$',
    '',
    // 4. 상대 경로
    '^[.]',
    '',
    // 5. 스타일 (SCSS, CSS)
    '^.+\\.s?css$',
  ],
};
