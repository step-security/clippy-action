/*
 * 🐻‍❄️📦 clippy-action: GitHub action to run Clippy, an up-to-date and modern version of actions-rs/clippy
 * Copyright 2023-2026 Noel <cutie@floofy.dev>, et al.
 * Copyright (c) 2025 StepSecurity
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fileURLToPath } from 'node:url';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('eslint').Linter.Config} */
const javascript = {
    name: 'local/js',
    files: ['**/*.js'],
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
            console: true,
            BigInt: true
        }
    },
    rules: {
        'no-misleading-character-class': 'error',
        'no-unexpected-multiline': 'error',
        'no-constant-condition': 'error',
        'no-useless-constructor': 'error',
        'no-extra-boolean-cast': 'error',
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always', { objectsInObjects: false }],
        'no-duplicate-imports': 'error',
        'no-unsafe-negation': 'error',
        'default-param-last': 'error',
        'no-duplicate-case': 'error',
        'no-unsafe-finally': 'error',
        'default-case-last': 'warn',
        'no-sparse-arrays': 'error',
        'no-cond-assign': 'error',
        'dot-notation': ['error', { allowKeywords: true }],
        'no-func-assign': 'error',
        'accessor-pairs': ['error', { setWithoutGet: true }],
        'no-unreachable': 'error',
        'getter-return': 'error',
        'for-direction': 'error',
        'no-obj-calls': 'error',
        'no-dupe-keys': 'error',
        'no-debugger': 'error',
        'no-new-func': 'error',
        'no-eq-null': 'error',
        'use-isnan': 'warn',
        'no-caller': 'error',
        'no-empty': 'error',
        'no-with': 'error',
        eqeqeq: 'error',
        semi: ['error', 'always'],
        yoda: 'error'
    }
};

/** @type {import('eslint').Linter.Config} */
const typescript = {
    name: 'local/ts',
    files: ['**/*.ts'],
    languageOptions: {
        parser: tsParser,
        sourceType: 'module',
        parserOptions: {
            project: [fileURLToPath(new URL('./tsconfig.json', import.meta.url))],
            tsconfigRootDir
        }
    },
    plugins: {
        '@typescript-eslint': tsPlugin,
        ts: tsPlugin
    },
    rules: {
        'ts/adjacent-overload-signatures': 'warn',
        'ts/consistent-type-definitions': ['error', 'interface'],
        'ts/prefer-literal-enum-member': ['warn', { allowBitwiseExpressions: true }],
        'ts/no-extra-non-null-assertion': 'error',
        'ts/no-useless-constructor': 'error',
        'ts/no-array-constructor': 'error',
        'ts/no-empty-object-type': [
            'warn',
            { allowInterfaces: 'with-single-extends', allowObjectTypes: 'never' }
        ],
        'ts/no-empty-function': 'error',
        'ts/prefer-as-const': 'error',
        'ts/no-this-alias': ['error', { allowDestructuring: true }],
        'ts/no-namespace': ['error', { allowDeclarations: true }],
        'ts/array-type': ['error', { default: 'array-simple' }],

        // type-aware rules
        'ts/dot-notation': [
            'error',
            {
                allowPrivateClassPropertyAccess: true,
                allowProtectedClassPropertyAccess: false,
                allowKeywords: true
            }
        ],
        'ts/no-implied-eval': 'error',
        'ts/await-thenable': 'error',

        // superseded by the TypeScript variants above
        'no-useless-constructor': 'off',
        'dot-notation': 'off',
        'brace-style': 'off'
    }
};

/** @type {import('eslint').Linter.Config} */
const stylisticConfig = {
    name: 'local/stylistic',
    files: ['**/*.js'],
    plugins: { stylistic },
    rules: {
        'stylistic/no-floating-decimal': 'error',
        'stylistic/no-trailing-spaces': ['error', { ignoreComments: true }],
        'stylistic/space-in-parens': ['error', 'never'],
        'stylistic/no-extra-semi': 'error',
        'stylistic/brace-style': ['error', 'stroustrup'],
        'stylistic/eol-last': ['error', 'always']
    }
};

export default [
    javascript,
    typescript,
    stylisticConfig,
    prettier,
    {
        ignores: ['build/**', 'dist/**', 'node_modules/**']
    }
];
