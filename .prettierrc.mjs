/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  tabWidth: 2,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
};
