/** Convention : type(scope): sujet — ex. feat(auth): add role-based redirect */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "ui",
        "layout",
        "students",
        "scanner",
        "calendar",
        "reports",
        "settings",
        "db",
        "config",
        "deps",
        "ci",
      ],
    ],
  },
};

export default config;
