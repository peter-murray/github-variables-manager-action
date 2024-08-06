import { OrganizationVariable } from './OrganizationVariable.js';
export class VariablesManager {
    octokit;
    organization;
    constructor(octokit, organization) {
        this.octokit = octokit;
        this.organization = organization;
    }
    async getOrganizationVariable(name) {
        try {
            const existingVariable = await this.octokit.rest.actions.getOrgVariable({
                org: this.organization,
                name: name
            });
            const data = existingVariable.data;
            if (data.selected_repositories_url) {
                //TODO this is paginated endpoint, need to handle that in the future, but not for initial use case
                const resp = await this.octokit.rest.actions.listSelectedReposForOrgVariable({
                    org: this.organization,
                    name: name,
                    per_page: 100
                });
                const selectedRepos = resp.data;
                let shared;
                if (selectedRepos.total_count > 0) {
                    shared = selectedRepos.repositories.map(repo => {
                        return {
                            id: repo.id,
                            node_id: repo.node_id,
                            name: repo.name,
                            full_name: repo.full_name,
                            owner: repo.owner.login
                        };
                    });
                }
                return new OrganizationVariable(this.organization, data, shared);
            }
            return new OrganizationVariable(this.organization, existingVariable.data);
        }
        catch (err) {
            if (err.status === 404) {
                return undefined;
            }
            throw err;
        }
    }
    async getEnvironmentVariable(repositoryName, environmentName, variableName) {
        return this.getEnvironment(repositoryName, environmentName)
            .then(environment => {
            if (environment) {
                return this.octokit.rest.actions.getEnvironmentVariable({
                    repository_id: environment.repository_id,
                    environment_name: environment.name,
                    name: variableName,
                })
                    .then(variable => {
                    return {
                        ...variable.data,
                        repository_id: environment.repository_id,
                        environment_name: environment.name,
                    };
                })
                    .catch(err => {
                    if (err.status === 404) {
                        return undefined;
                    }
                    throw err;
                });
            }
            return undefined;
        });
    }
    async addVariableToRepository(name, repositoryName) {
        return Promise.all([
            this.getOrganizationVariable(name),
            this.getRepository(repositoryName)
        ]).then(results => {
            const variable = results[0];
            if (variable === undefined) {
                throw new Error(`variable ${name} was not found in organization ${this.organization}`);
            }
            const repository = results[1];
            if (repository === undefined) {
                throw new Error(`repository ${repositoryName} was not found in organization ${this.organization}`);
            }
            return this.addRepositoryToVariable(variable, repository);
        });
    }
    async removeOrganizationVariableFromRepository(name, repositoryName) {
        const variable = await this.getOrganizationVariable(name);
        if (variable === undefined) {
            throw new Error(`variable ${name} was not found in organization ${this.organization}`);
        }
        const repository = await this.getRepository(repositoryName);
        if (repository === undefined) {
            throw new Error(`repository ${repositoryName} was not found in organization ${this.organization}`);
        }
        return this.removeRepositoryFromVariable(variable, repository);
    }
    async addRepositoryToVariable(variable, repo) {
        return this.octokit.rest.actions.addSelectedRepoToOrgVariable({
            org: this.organization,
            name: variable.name,
            repository_id: repo.id,
        }).then(result => {
            return result.status === 204;
        });
    }
    async removeRepositoryFromVariable(variable, repo) {
        return this.octokit.rest.actions.removeSelectedRepoFromOrgVariable({
            org: this.organization,
            name: variable.name,
            repository_id: repo.id,
        }).then(result => {
            return result.status === 204;
        });
    }
    async getEnvironment(repositoryName, environmentName) {
        return this.getRepository(repositoryName)
            .then(repo => {
            if (repo) {
                return this.octokit.rest.repos.getEnvironment({
                    owner: repo.owner,
                    repo: repo.name,
                    environment_name: environmentName
                })
                    .then(data => {
                    return {
                        id: data.data.id,
                        name: data.data.name,
                        url: data.data.url,
                        created_at: data.data.created_at,
                        updated_at: data.data.updated_at,
                        repository_id: repo.id,
                    };
                })
                    .catch(err => {
                    if (err.status === 404) {
                        return undefined;
                    }
                    throw err;
                });
            }
            return undefined;
        });
    }
    async getRepository(name) {
        return this.octokit.rest.repos.get({
            owner: this.organization,
            repo: name,
            mediaType: {
                previews: ['nebula']
            }
        }).then(result => {
            if (result.status === 200) {
                const repo = result.data;
                return {
                    id: repo.id,
                    node_id: repo.node_id,
                    name: repo.name,
                    full_name: repo.full_name,
                    owner: this.organization
                };
            }
            return undefined;
        }).catch(err => {
            if (err.status === 404) {
                return undefined;
            }
            throw err;
        });
    }
    async saveOrUpdateOrganizationVariable(variableName, value, visibility, selectedRepoIds) {
        const existingVariable = await this.getOrganizationVariable(variableName);
        const payload = {
            org: this.organization,
            name: variableName,
            value: value,
        };
        if (existingVariable) {
            // updating an existing variable, some parameters are optional if not provided
            if (visibility) {
                payload['visibility'] = visibility;
            }
            else {
                payload['visibility'] = existingVariable.visibility;
            }
            if (visibility === 'selected' && selectedRepoIds) {
                payload['selected_repository_ids'] = selectedRepoIds ? selectedRepoIds : [];
            }
            return this.octokit.rest.actions.updateOrgVariable(payload).then(result => {
                if (result.status === 204) {
                    return 'updated';
                }
                else {
                    throw new Error(`Unexpected status code from setting variable value ${result.status}`);
                }
            });
        }
        else {
            // New variable, some values are no longer optional
            payload['visibility'] = visibility ? visibility : 'all';
            if (visibility === 'selected') {
                payload['selected_repository_ids'] = selectedRepoIds ? selectedRepoIds : [];
            }
            //@ts-ignore
            return this.octokit.rest.actions.createOrgVariable(payload)
                .then(result => {
                if (result.status === 201) {
                    return 'created';
                }
                else {
                    throw new Error(`Unexpected status code from setting variable value ${result.status}`);
                }
            });
        }
    }
    async getRepositoryVariable(repositoryName, variableName) {
        return this.getRepository(repositoryName)
            .then(repo => {
            if (!repo) {
                throw new Error(`Repository ${repositoryName} was not found in organization ${this.organization}`);
            }
            return this.octokit.rest.actions.getRepoVariable({
                owner: this.organization,
                repo: repositoryName,
                name: variableName
            }).then(result => {
                if (result.status === 200) {
                    const variable = result.data;
                    return {
                        name: variable.name,
                        value: variable.value,
                        created_at: variable.created_at,
                        updated_at: variable.updated_at,
                    };
                }
                return undefined;
            }).catch(err => {
                if (err.status === 404) {
                    return undefined;
                }
                throw err;
            });
        });
    }
    async saveOrUpdateRepositoryVariable(repositoryName, variableName, value, overwrite = true) {
        const repoVariable = await this.getRepositoryVariable(repositoryName, variableName);
        if (repoVariable) {
            if (!overwrite) {
                return 'exists';
            }
            return this.octokit.rest.actions.updateRepoVariable({
                owner: this.organization,
                repo: repositoryName,
                name: variableName,
                value: value
            }).then(() => {
                return 'updated';
            });
        }
        else {
            return this.octokit.rest.actions.createRepoVariable({
                owner: this.organization,
                repo: repositoryName,
                name: variableName,
                value: value
            }).then(() => {
                return 'created';
            });
        }
    }
    async saveOrUpdateEnvironmentVariable(repositoryName, environmentName, variableName, value, overwrite = true) {
        const variable = await this.getEnvironmentVariable(repositoryName, environmentName, variableName);
        let promise;
        if (variable) {
            if (!overwrite) {
                return 'exists';
            }
            promise = this.octokit.rest.actions.updateEnvironmentVariable({
                repository_id: variable.repository_id,
                environment_name: environmentName,
                name: variableName,
                value: value
            });
        }
        else {
            promise = this.getRepository(repositoryName)
                .then(repository => {
                if (!repository) {
                    throw new Error(`Repository ${repositoryName} was not found in organization ${this.organization}`);
                }
                return this.octokit.rest.actions.createEnvironmentVariable({
                    repository_id: repository.id,
                    environment_name: environmentName,
                    name: variableName,
                    value: value
                });
            });
        }
        return promise.then((result) => {
            if (result.status === 201) {
                return 'created';
            }
            else if (result.status === 204) {
                return 'updated';
            }
            else {
                throw new Error(`Unexpected status code from creating/updating environment variable on repository '${repositoryName}' and environment '${environmentName}', status code: ${result.status}`);
            }
        });
    }
    async deleteOrganizationVariable(name) {
        return this.getOrganizationVariable(name)
            .then(variable => {
            if (variable) {
                return this.octokit.rest.actions.deleteOrgVariable({
                    org: this.organization,
                    name: variable.name
                }).then(result => {
                    return result.status === 204;
                });
            }
            return true;
        });
    }
    async deleteRepositoryVariable(repositoryName, variableName) {
        return this.getRepository(repositoryName)
            .then(repo => {
            if (repo) {
                return this.octokit.rest.actions.deleteRepoVariable({
                    owner: repo.owner,
                    repo: repo.name,
                    name: variableName
                });
            }
        })
            .then(result => {
            if (result) {
                return result.status === 204;
            }
            return false;
        })
            .catch(err => {
            if (err.status === 404) {
                return true;
            }
            throw err;
        });
    }
    async deleteEnvironmentVariable(repositoryName, environmentName, variableName) {
        return this.getEnvironmentVariable(repositoryName, environmentName, variableName)
            .then(variable => {
            if (variable) {
                return this.octokit.rest.actions.deleteEnvironmentVariable({
                    repository_id: variable.repository_id,
                    environment_name: variable.environment_name,
                    name: variable.name,
                });
            }
        })
            .then(result => {
            if (result) {
                return result.status === 204;
            }
            return false;
        })
            .catch(err => {
            if (err.status === 404) {
                return true;
            }
            throw err;
        });
    }
}
//# sourceMappingURL=VariablesManager.js.map