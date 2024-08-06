import * as core from '@actions/core';
import { VariablesManager } from '../variables/VariablesManager.js';
import { getRequiredInput, getOctokit } from '../utils.js';
async function run() {
    try {
        await exec();
    }
    catch (err) {
        core.setFailed(err);
    }
}
run();
async function exec() {
    const variableName = getRequiredInput('variable'), variableValue = getRequiredInput('value'), repository = getRequiredInput('repository'), overwrite = core.getBooleanInput('overwrite_existing', { required: true });
    try {
        const repo = validateRepository(repository);
        const variables = new VariablesManager(getOctokit(), repo.owner);
        const result = await variables.saveOrUpdateRepositoryVariable(repo.repo, variableName, variableValue, overwrite);
        if (result) {
            core.info(`Successfully ${result} variable ${repository}/${variableName}.`);
        }
        else {
            core.setFailed(`Did not succeed in creating/updating variable ${repository}/${variableName}`);
        }
    }
    catch (err) {
        core.error(`Failed to add/update variable ${repository}/${variableName}.`);
        core.setFailed(err);
    }
}
function validateRepository(repository) {
    if (repository.indexOf('/') > 0) {
        const parts = repository.split('/');
        return {
            owner: parts[0],
            repo: parts[1]
        };
    }
    else {
        throw new Error(`A fully qualified repository name of the form '<owner>/<repo>' is required, but was '${repository}'.`);
    }
}
//# sourceMappingURL=add-or-update-repository-variable.js.map