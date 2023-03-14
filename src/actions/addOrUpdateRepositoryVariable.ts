import * as core from '@actions/core';
import { VariablesManager } from '../variables/VariablesManager';
import { getRequiredInput, getOctokit } from '../utils'

async function run() {
  try {
    await exec();
  } catch (err: any) {
    core.setFailed(err);
  }
}
run();

async function exec() {
  const variableName: string = getRequiredInput('variable')
    , variableValue: string = getRequiredInput('value')
    , repository: string = getRequiredInput('repository')
    ;

  try {
    const repo = validateRepository(repository);
    const variables: VariablesManager = new VariablesManager(getOctokit(), repo.owner);

    const result: string = await variables.saveOrUpdateRepositoryVariable(repo.repo, variableName, variableValue);

    if (result) {
      core.info(`Successfully ${result} variable ${repository}/${variableName}.`);
    } else {
      core.setFailed(`Did not succeed in creating/updating variable ${repository}/${variableName}`);
    }
  } catch (err: any) {
    core.error(`Failed to add/update variable ${repository}/${variableName}.`);
    core.setFailed(err);
  }
}


type repo = {repo: string, owner: string};

function validateRepository(repository: string): repo {
  if (repository.indexOf('/') > 0) {
    const parts = repository.split('/');
    return {
      owner: parts[0],
      repo: parts[1]
    }
  } else {
    throw new Error(`A fully qualified repository name of the form '<owner>/<repo>' is required, but was '${repository}'.`);
  }
}