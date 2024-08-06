import { GitHubOctokit } from '../github/github.js';
import { OrganizationVariable } from './OrganizationVariable.js';
export type OrgVisibility = 'all' | 'private' | 'selected';
export type EnvironmentVariableData = {
    name: string;
    created_at: string;
    updated_at: string;
    value: string;
    repository_id: number;
    environment_name: string;
};
export type Environment = {
    id: number;
    name: string;
    url?: string;
    created_at: string;
    updated_at: string;
    repository_id: number;
};
export type Repository = {
    id: number;
    node_id: string;
    name: string;
    owner: string;
    full_name: string;
};
export type RepositoryVariable = {
    variable: Variable;
    repo: Repository;
};
export type OrgVariableData = Variable & {
    visibility: OrgVisibility;
    selected_repositories_url?: string;
};
export type Variable = {
    name: string;
    value: string;
    created_at: string;
    updated_at: string;
};
export declare class VariablesManager {
    private octokit;
    private organization;
    constructor(octokit: GitHubOctokit, organization: string);
    getOrganizationVariable(name: string): Promise<OrganizationVariable | undefined>;
    getEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string): Promise<EnvironmentVariableData | undefined>;
    addVariableToRepository(name: string, repositoryName: string): Promise<boolean>;
    removeOrganizationVariableFromRepository(name: string, repositoryName: string): Promise<boolean>;
    addRepositoryToVariable(variable: OrganizationVariable, repo: Repository): Promise<boolean>;
    removeRepositoryFromVariable(variable: OrganizationVariable, repo: Repository): Promise<boolean>;
    getEnvironment(repositoryName: string, environmentName: string): Promise<Environment | undefined>;
    getRepository(name: string): Promise<Repository | undefined>;
    saveOrUpdateOrganizationVariable(variableName: string, value: string, visibility?: OrgVisibility, selectedRepoIds?: number[]): Promise<'created' | 'updated' | 'exists'>;
    getRepositoryVariable(repositoryName: string, variableName: string): Promise<Variable | undefined>;
    saveOrUpdateRepositoryVariable(repositoryName: string, variableName: string, value: string, overwrite?: boolean): Promise<'created' | 'updated' | 'exists'>;
    saveOrUpdateEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string, value: string, overwrite?: boolean): Promise<'created' | 'updated' | 'exists'>;
    deleteOrganizationVariable(name: string): Promise<boolean>;
    deleteRepositoryVariable(repositoryName: string, variableName: string): Promise<boolean>;
    deleteEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string): Promise<boolean>;
}
