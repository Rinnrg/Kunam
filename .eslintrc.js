module.exports = {
  extends: ['airbnb', 'airbnb/hooks', 'next/core-web-vitals', 'plugin:react/recommended', 'eslint-config-prettier', 'plugin:jsx-a11y/recommended', 'plugin:@react-three/recommended'],
  plugins: ['eslint-plugin-prettier', 'react', 'jsx-a11y', '@react-three'],
  rules: {
    'react/prop-types': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.tsx'] }],
    'no-console': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'react/no-array-index-key': 'off',
    'jsx-a11y/media-has-caption': 'off',
    'arrow-body-style': 'off',
    'no-unused-vars': 'warn',
    'prefer-destructuring': 'off',
    'react/no-unescaped-entities': 'off',
    'no-restricted-exports': 'off',
    'import/no-named-as-default': 'off',
    // 'import-helpers/order-imports': [
    //   'warn',
    //   {
    //     newlinesBetween: 'always',
    //     alphabetize: { order: 'asc', ignoreCase: true },
    //     groups: [
    //       // Packages `react` related packages come first.
    //       ['/^react/'],
    //       ['/^next/', '/^store/'],
    //       ['/^hooks/', '/^helpers/'],
    //       ['/^@mui/', '/^components/'],
    //       '/^pages/',
    //     ],
    //   },
    // ],
    'object-curly-newline': 'off',
    'react/no-unknown-property': 'off',
    'react/display-name': 'off',
    'prettier/prettier': 'off',
    'no-param-reassign': 'off',
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': ['error', { ignore: ['^@/', '\\.\\.\\./lib/'] }],
    'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' }],
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
  },

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@src', './src'],
          ['@', './catalog'],
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
