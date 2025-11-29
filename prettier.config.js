/** @type {import("prettier").Config} */
export default {
  // Use double quotes for consistency
  singleQuote: false,

  // Use semicolons
  semi: true,

  // 2 space indentation
  tabWidth: 2,
  useTabs: false,

  // Trailing commas in multi-line (ES5 compatible)
  trailingComma: "es5",

  // Print width
  printWidth: 100,

  // Bracket spacing in objects: { foo: bar }
  bracketSpacing: true,

  // JSX quotes use double quotes
  jsxSingleQuote: false,

  // Put > on the same line in JSX
  bracketSameLine: false,

  // Arrow function parens: always
  arrowParens: "always",

  // End of line: LF (Unix)
  endOfLine: "lf",

  // Prose wrap for markdown
  proseWrap: "preserve",

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: "css",

  // Embedded language formatting
  embeddedLanguageFormatting: "auto",
};
