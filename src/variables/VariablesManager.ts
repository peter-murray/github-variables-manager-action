import { GitHubOctokit } from '../github/github';
import { OrganizationVariable } from './OrganizationVariable';

export type OrgVisibility = 'all' | 'private' | 'selected';

export type EnvironmentVariableData = {
  name: string
  created_at: string
  updated_at: string
  value: string
  repository_id: number
  environment_name: string
}

export type Environment = {
  id: number,
  name: string,
  url?: string,
  created_at: string,
  updated_at: string,

  repository_id: number,
}

export type Repository = {
  id: number,
  node_id: string,
  name: string,
  owner: string,
  full_name: string
}

export type RepositoryVariable = {
  variable: Variable,
  repo: Repository
}

export type OrgVariableData = Variable & {
  visibility: OrgVisibility
  selected_repositories_url?: string
}

export type Variable = {
  name: string,
  value: string,
  created_at: string,
  updated_at: string,
}

export class VariablesManager {

  private octokit: GitHubOctokit;

  private organization: string;

  constructor(octokit: GitHubOctokit, organization: string) {
    this.octokit = octokit;
    this.organization = organization;
  }

  async getOrganizationVariable(name: string): Promise<OrganizationVariable | undefined> {
    return this.octokit.rest.actions.getOrgVariable({
      org: this.organization,
      name: name
    }).then(resp => {
      if (resp.status !== 200) {
        throw new Error(`Unexpected status code ${resp.status}`);
      }
      const data = resp.data;

      if (data.selected_repositories_url) {
        //TODO this is paginated endpoint, need to handle that in the future, but not for initial use case
        return this.octokit.rest.actions.listSelectedReposForOrgVariable({
          org: this.organization,
          name: name,
          per_page: 100
        }).then(resp => {
          const selectedRepos = resp.data;

          let shared: Repository[] | undefined;
          if (selectedRepos.total_count > 0) {
            shared = selectedRepos.repositories.map(repo => {
              return {
                id: repo.id,
                node_id: repo.node_id,
                name: repo.name,
                full_name: repo.full_name,
                owner: repo.owner.login
              };
            })
          }
          return new OrganizationVariable(this.organization, data, shared);
        });
      }

      return new OrganizationVariable(this.organization, resp.data);
    }).catch(err => {
      if (err.status === 404) {
        return undefined;
      }
      throw err;
    });
  }

  async getEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string): Promise<EnvironmentVariableData | undefined> {
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

  async addVariableToRepository(name: string, repositoryName: string): Promise<boolean> {
    return Promise.all([
      this.getOrganizationVariable(name),
      this.getRepository(repositoryName)
    ]).then(results => {
      const variable: OrganizationVariable | undefined = results[0];
      if (variable === undefined) {
        throw new Error(`variable ${name} was not found in organization ${this.organization}`);
      }

      const repository: Repository | undefined = results[1];
      if (repository === undefined) {
        throw new Error(`repository ${repositoryName} was not found in organization ${this.organization}`);
      }

      return this.addRepositoryToVariable(variable, repository);
    });
  }

  async removeVariableFromRepository(name: string, repositoryName: string): Promise<boolean> {
    return Promise.all([
      this.getOrganizationVariable(name),
      this.getRepository(repositoryName)
    ]).then(results => {
      const variable: OrganizationVariable | undefined = results[0];
      if (variable === undefined) {
        throw new Error(`variable ${name} was not found in organization ${this.organization}`);
      }

      const repository: Repository | undefined = results[1];
      if (repository === undefined) {
        throw new Error(`repository ${repositoryName} was not found in organization ${this.organization}`);
      }

      return this.removeRepositoryFromVariable(variable, repository);
    });
  }

  async addRepositoryToVariable(variable: OrganizationVariable, repo: Repository): Promise<boolean> {
    return this.octokit.rest.actions.addSelectedRepoToOrgVariable({
      org: this.organization,
      name: variable.name,
      repository_id: repo.id,
    }).then(result => {
      return result.status === 204;
    });
  }

  async removeRepositoryFromVariable(variable: OrganizationVariable, repo: Repository): Promise<boolean> {
    return this.octokit.rest.actions.removeSelectedRepoFromOrgVariable({
      org: this.organization,
      name: variable.name,
      repository_id: repo.id,
    }).then(result => {
      return result.status === 204;
    })
  }

  async getEnvironment(repositoryName: string, environmentName: string): Promise<Environment | undefined> {
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
              }
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

  async getRepository(name: string): Promise<Repository | undefined> {
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
        }
      }
      return undefined;
    }).catch(err => {
      if (err.status === 404) {
        return undefined;
      }
      throw err;
    });
  }

  async saveOrUpdateOrganizationVariable(
    variableName: string,
    value: string,
    visibility?: OrgVisibility,
    selectedRepoIds?: number[]): Promise<'created' | 'updated'> {

    return this.getOrganizationVariable(variableName)
      .then(existingVariable => {
        const payload = {
          org: this.organization,
          name: variableName,
          value: value,
        }

        if (existingVariable) {
          // updating an existing variable, some parameters are optional if not provided
          if (visibility) {
            payload['visibility'] = visibility;
          } else {
            payload['visibility'] = existingVariable.visibility
          }

          if (visibility === 'selected' && selectedRepoIds) {
            payload['selected_repository_ids'] = selectedRepoIds ? selectedRepoIds : [];
          }

          return this.octokit.rest.actions.updateOrgVariable(payload).then(result => {
            if (result.status === 204) {
              return 'updated';
            } else {
              throw new Error(`Unexpected status code from setting variable value ${result.status}`);
            }
          })
        } else {
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
            } else {
              throw new Error(`Unexpected status code from setting variable value ${result.status}`);
            }
          });
        }
      });
  }

  async getRepositoryVariable(repositoryName: string, variableName: string): Promise<Variable | undefined> {
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
            }
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

  async saveOrUpdateRepositoryVariable(repositoryName: string, variableName: string, value: string): Promise<'created' | 'updated'> {
    return this.getRepositoryVariable(repositoryName, variableName)
      .then(repoVariable => {
        if (repoVariable) {
          return this.octokit.rest.actions.updateRepoVariable({
            owner: this.organization,
            repo: repositoryName,
            name: variableName,
            value: value
          }).then(() => {
            return 'updated';
          });
        } else {
          return this.octokit.rest.actions.createRepoVariable({
            owner: this.organization,
            repo: repositoryName,
            name: variableName,
            value: value
          }).then(() => {
            return 'created';
          });
        }
      });
  }

  async saveOrUpdateEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string, value: string): Promise<'created' | 'updated'> {
    return this.getEnvironmentVariable(repositoryName, environmentName, variableName)
      .then(variable => {
        let promise;

        if (variable) {
          promise = this.octokit.rest.actions.updateEnvironmentVariable({
            repository_id: variable.repository_id,
            environment_name: environmentName,
            name: variableName,
            value: value
          });
        } else {
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
          } else if (result.status === 204) {
            return 'updated';
          } else {
            throw new Error(`Unexpected status code from creating/updating environment variable on repository '${repositoryName}' and environment '${environmentName}', status code: ${result.status}`);
          }
        });
      });
  }

  async deleteOrganizationVariable(name: string): Promise<boolean> {
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

  async deleteRepositoryVariable(repositoryName: string, variableName: string): Promise<boolean> {
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

  async deleteEnvironmentVariable(repositoryName: string, environmentName: string, variableName: string): Promise<boolean> {
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
