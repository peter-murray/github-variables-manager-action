import { GitHubOctokit } from './github/github.js';
export declare function getGitHubToken(): string;
export declare function getRequiredInput(name: string): string;
export declare function getOctokit(token?: string): GitHubOctokit;
export declare function requireStringArgumentValue(name: string, value: any): string;
