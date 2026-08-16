module.exports = {
  root: true,
  extends: ["universe/native", "prettier"],
  plugins: ["jest"],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".expo/",
    "coverage/",
    "supabase/functions/",
  ],
  overrides: [
    {
      files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
      env: { "jest/globals": true },
      extends: ["plugin:jest/recommended"],
    },
  ],
  rules: {
    "import/order": [
      "warn",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "never",
      },
    ],
  },
};
