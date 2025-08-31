const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const unusedImports = require("eslint-plugin-unused-imports");
const jest = require("eslint-plugin-jest");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {},
    },

    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "unused-imports": unusedImports,
    },
    ignores: ["jest.config.js"],

    rules: {
        "require-await": "error",
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/no-explicit-any": "off",

        "@typescript-eslint/no-unused-vars": ["warn", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: false,
            argsIgnorePattern: "^_",
        }],

        "unused-imports/no-unused-imports": "warn",

        quotes: ["warn", "single", {
            avoidEscape: true,
        }],

        "@typescript-eslint/naming-convention": ["error", {
            selector: "class",
            format: ["PascalCase"],
            leadingUnderscore: "allow",
        }, {
            selector: "method",
            format: ["camelCase"],
            leadingUnderscore: "allow",
        }],

        "no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],
    },
}, {
    files: ["__tests__/**", "**/*.test.{ts,js}", "**/*.spec.{ts,js}"],

    plugins: {
        jest,
    },

    extends: compat.extends("plugin:jest/recommended"),
    rules: {},
}, {
    files: ["**/*.gen.ts"],

    plugins: {
        jest,
    },

    extends: compat.extends("plugin:jest/recommended"),

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/ban-types": "off",
    },
}, {
    files: ["**/*.js"],

    rules: {
        "@typescript-eslint/no-var-requires": "off",
    },
}, {
    files: ["libs/**/*.ts", "!**/__generated__/**"],

    rules: {
        "no-console": 1,
    },
}, globalIgnores(["**/.eslintrc.js", "**/jest.config.js"])]);
