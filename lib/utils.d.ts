export declare function getGitHubToken(): string;
export declare function getRequiredInput(name: string): string;
export declare function getOctokit(token?: string, baseUrl?: string): import("@octokit/core").Octokit & import("@octokit/plugin-rest-endpoint-methods/dist-types/types.js").Api & {
    paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
};
export declare function requireStringArgumentValue(name: string, value: any): string;
