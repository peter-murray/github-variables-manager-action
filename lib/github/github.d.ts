import { Octokit } from '@octokit/core';
import { OctokitOptions, OctokitPlugin } from '@octokit/core/dist-types/types.js';
export type GitHubOctokit = InstanceType<typeof GitHub>;
export declare function getOctokit(token: string, options?: OctokitOptions, ...additionalPlugins: OctokitPlugin[]): GitHubOctokit;
export declare const defaults: OctokitOptions;
export declare const GitHub: typeof Octokit & import("@octokit/core/dist-types/types.js").Constructor<import("@octokit/plugin-rest-endpoint-methods/dist-types/types.js").Api & {
    paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
}>;
export declare function getOctokitOptions(token: string, options?: OctokitOptions): OctokitOptions;
