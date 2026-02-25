const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 100,

  plugins: ['@ianvs/prettier-plugin-sort-imports'],

  importOrder: [
    '^react$',
    '^react/(.*)$',
    '^next$',
    '^next/(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@app/(.*)$',
    '^@views/(.*)$',
    '^@widgets/(.*)$',
    '^@features/(.*)$',
    '^@entities/(.*)$',
    '^@shared/(.*)$',
    '^[.]',
    '^.+\\.s?css$',
  ],
};

export default config;
