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

import { startGroup, setFailed, endGroup, warning, debug, error, info } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { assertIsError } from '@noelware/utils';
import { getExecOutput } from '@actions/exec';
import { getInputs } from './inputs';
import * as osInfo from './os-info';
import { which } from '@actions/io';
import * as clippy from './clippy';
import axios, { isAxiosError } from 'axios';

async function validateSubscription(): Promise<void> {
    const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

    try {
        await axios.get(API_URL, { timeout: 3000 });
    } catch (err) {
        if (isAxiosError(err) && err.response?.status === 403) {
            error('Subscription is not valid. Reach out to support@stepsecurity.io');
            process.exit(1);
        } else {
            info('Timeout or API not reachable. Continuing to next step.');
        }
    }
}

async function main() {
    await validateSubscription();
    const inputs = getInputs();
    if (inputs === null) process.exit(1);

    startGroup('Check if `cargo` exists');
    let cargoPath: string;
    try {
        cargoPath = await which('cargo', true);
        info(`Found \`cargo\` binary in path [${cargoPath}]`);
    } catch (e) {
        assertIsError(e);
        error("Cargo tool doesn't exist. Please add a step to install a valid Rust toolchain.");

        process.exit(1);
    } finally {
        endGroup();
    }

    startGroup('Collecting rustc information...');
    let version: string;

    {
        const { stdout } = await getExecOutput('rustc', ['--version']);
        version = stdout.slice('rustc '.length);

        endGroup();
    }

    const patch = version.split('.').at(-1);
    if (patch === undefined) {
        process.exit(1);
    }

    const toolchain = patch.endsWith('-nightly') ? 'Nightly' : patch.endsWith('-beta') ? 'Beta' : 'Stable';
    const client = getOctokit(inputs['github-token']);
    const sha = context.sha;
    let canPerformCheckRun = false;
    let id: null | number = null;
    const startedAt = new Date();

    try {
        const { data: newRunData } = await client.request('POST /repos/{owner}/{repo}/check-runs', {
            owner: context.repo.owner,
            repo: context.repo.repo,
            name: `Clippy: Rust ${toolchain} ${version}${
                inputs['working-directory'] !== undefined ? ` in ${inputs['working-directory']}` : ''
            }`,
            head_sha: sha,
            status: 'in_progress',
            started_at: startedAt.toISOString()
        });

        id = newRunData.id;
        canPerformCheckRun = true;
        info(`Created check run with ID [${id}]`);
    } catch (e) {
        warning("clippy-action doesn't have permissions to create Check Runs, disabling!");
        warning(e instanceof Error ? e.message : JSON.stringify(e, null, 4));

        canPerformCheckRun = false;
    }

    const [exitCode, pieces] = await clippy.getClippyOutput(inputs, cargoPath);
    await clippy.renderMessages(pieces);

    const renderer = clippy.kDefaultRenderer;
    const os = osInfo.os();
    const arch = osInfo.arch();
    if (canPerformCheckRun && id !== null) {
        const completed = new Date();
        const { data } = await client.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
            check_run_id: id,
            owner: context.repo.owner,
            repo: context.repo.repo,
            status: 'completed',
            conclusion: exitCode === 0 ? 'success' : 'failure',
            started_at: startedAt.toISOString(),
            completed_at: completed.toISOString(),
            output:
                exitCode === 0
                    ? {
                          title: `Clippy (${toolchain} ~ ${os}/${arch})`,
                          summary: 'Clippy was successful!',
                          text: [
                              `Running \`cargo clippy\` took roughly ~${
                                  completed.getTime() - startedAt.getTime()
                              }ms to complete`,
                              '',
                              `* Working Directory: ${inputs['working-directory'] || 'repository directory'}`
                          ].join('\n'),
                          annotations: renderer.annotations
                              .filter((x) => !!x.file)
                              .map((annotation) => ({
                                  annotation_level:
                                      annotation.level === 'error'
                                          ? ('failure' as const)
                                          : annotation.level === 'warning'
                                            ? ('warning' as const)
                                            : ('notice' as const),
                                  path: annotation.file!,
                                  start_line: annotation.startLine || 0,
                                  end_line: annotation.endLine || 0,
                                  start_column: annotation.startColumn,
                                  end_column: annotation.endColumn,
                                  raw_details: annotation.rendered,
                                  message: annotation.title!
                              }))
                      }
                    : {
                          title: `Clippy (${toolchain} ~ ${os}/${arch})`,
                          summary: 'Clippy failed.',
                          text: [
                              `Running \`cargo clippy\` took roughly ~${
                                  completed.getTime() - startedAt.getTime()
                              }ms to complete`,
                              '',
                              `* Working Directory: ${inputs['working-directory'] || 'repository directory'}`
                          ].join('\n'),
                          annotations: renderer.annotations
                              .filter((x) => !!x.file)
                              .map((annotation) => ({
                                  annotation_level:
                                      annotation.level === 'error'
                                          ? ('failure' as const)
                                          : annotation.level === 'warning'
                                            ? ('warning' as const)
                                            : ('notice' as const),
                                  path: annotation.file!,
                                  start_line: annotation.startLine || 0,
                                  end_line: annotation.endLine || 0,
                                  start_column: annotation.startColumn,
                                  end_column: annotation.endColumn,
                                  raw_details: annotation.rendered,
                                  message: annotation.title!
                              }))
                      }
        });

        debug(JSON.stringify(data));
    }

    info(`Clippy exited with code ${exitCode}`);
    process.exitCode = exitCode;
}

main().catch((ex) => {
    const error = new Error('@augu/clippy-action failed to run', { cause: ex });

    setFailed(error);
    process.exit(1);
});
