import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';

/** 세그먼트 index 파일만 진입점으로 허용 */
const FSD_ENTRY = '*/index.{ts,tsx}';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'views', pattern: 'src/views/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
      'boundaries/ignore': [],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'app' },
              allow: [
                { to: { type: 'views', internalPath: FSD_ENTRY } },
                { to: { type: 'widgets', internalPath: FSD_ENTRY } },
                { to: { type: 'features', internalPath: FSD_ENTRY } },
                { to: { type: 'entities', internalPath: FSD_ENTRY } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'views' },
              allow: [
                { to: { type: 'widgets', internalPath: FSD_ENTRY } },
                { to: { type: 'features', internalPath: FSD_ENTRY } },
                { to: { type: 'entities', internalPath: FSD_ENTRY } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'widgets' },
              allow: [
                { to: { type: 'features', internalPath: FSD_ENTRY } },
                { to: { type: 'entities', internalPath: FSD_ENTRY } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'features' },
              allow: [
                { to: { type: 'entities', internalPath: FSD_ENTRY } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'entities' },
              allow: [{ to: { type: 'shared' } }],
            },
            {
              from: { type: 'shared' },
              allow: [{ to: { type: 'shared' } }],
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
