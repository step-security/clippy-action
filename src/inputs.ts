/*
 * 🐻‍❄️📦 clippy-action: GitHub action to run Clippy, an up-to-date and modern version of actions-rs/clippy
 * Copyright 2023-2024 Noel Towa <cutie@floofy.dev>
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

import { type InputOptions, getInput, error, warning } from '@actions/core';

export interface Inputs {
    'working-directory'?: string;
    'all-features': boolean;
    'github-token': string;
    'check-args': string[];
    forbid: string[];
    allow: string[];
    deny: string[];
    args: string[];
    warn: string[];
}

const truthy = new Set(['true', 'True', 'TRUE']);
const falsy = new Set(['false', 'False', 'FALSE']);

const getBooleanInput = (name: string, options: InputOptions) => {
    const value = getInput(name, options);
    if (!value) return false;
    if (truthy.has(value)) return true;
    if (falsy.has(value)) return false;

    throw new Error(
        `Value of key [${name}] didn't meet the Yaml 1.2 "Core Schema" specification (received: [${value}])`
    );
};

function getArrayInput(input: string, opts: { sep: string }) {
    return getInput(input, { trimWhitespace: true })
        .split(opts.sep)
        .filter(Boolean)
        .map((s) => s.trim());
}

export function getInputs(): Inputs | null {
    const wd = getInput('working-directory', { trimWhitespace: true });
    const token = getInput('token', { trimWhitespace: true });
    if (token === '') {
        error('Missing required input: `token`');
        return null;
    }

    const allow = getArrayInput('allow', { sep: ',' });
    if (allow.length) {
        warning('The `allow` input is deprecated in v1.4 and can be used within the `check-args` input');
    }

    const deny = getArrayInput('deny', { sep: ',' });
    if (deny.length) {
        warning('The `deny` input is deprecated in v1.4 and can be used within the `check-args` input');
    }

    const forbid = getArrayInput('forbid', { sep: ',' });
    if (forbid.length) {
        warning('The `forbid` input is deprecated in v1.4 and can be used within the `check-args` input');
    }

    const warn = getArrayInput('warn', { sep: ',' });
    if (warn.length) {
        warning('The `warn` input is deprecated in v1.4 and can be used within the `check-args` input');
    }

    const args = getArrayInput('args', { sep: ' ' });
    const checkArgs = getArrayInput('check-args', { sep: ' ' });

    return {
        'working-directory': wd,
        'github-token': token,
        'all-features': getBooleanInput('all-features', { trimWhitespace: true }),
        'check-args': checkArgs,
        forbid,
        allow,
        warn,
        deny,
        args
    } satisfies Inputs;
}
