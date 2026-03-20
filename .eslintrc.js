module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  rules: {
    'no-bitwise': 'off',
    'no-void': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: ['../*../*'],
      },
    ],
  },
};
