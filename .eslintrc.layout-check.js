// 專門檢查 layout 組件的 ESLint 配置
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXElement[openingElement.name.name="html"]',
        message: 'Only the root layout.tsx should define <html> tags. Route group layouts should not redefine html/body elements.',
      },
      {
        selector: 'JSXElement[openingElement.name.name="body"]',
        message: 'Only the root layout.tsx should define <body> tags. Route group layouts should not redefine html/body elements.',
      },
    ],
  },
  overrides: [
    {
      // 允許根 layout.tsx 使用 html/body
      files: ['app/layout.tsx'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};