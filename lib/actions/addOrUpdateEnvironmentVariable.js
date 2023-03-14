"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const VariablesManager_1 = require("../variables/VariablesManager");
const utils_1 = require("../utils");
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
    const variableName = (0, utils_1.getRequiredInput)('variable'), variableValue = (0, utils_1.getRequiredInput)('value'), repository = (0, utils_1.getRequiredInput)('repository'), environment = (0, utils_1.getRequiredInput)('environment');
    try {
        const repo = validateRepository(repository);
        const variables = new VariablesManager_1.VariablesManager((0, utils_1.getOctokit)(), repo.owner);
        const result = await variables.saveOrUpdateEnvironmentVariable(repo.repo, environment, variableName, variableValue);
        if (result) {
            core.info(`Successfully updated variable ${repository}/${environment}/${variableName}.`);
        }
        else {
            core.setFailed(`Did not succeed in creating/updating variable ${repository}/${environment}/${variableName}`);
        }
    }
    catch (err) {
        core.error(`Failed to add/update variable ${repository}/${environment}/${variableName}.`);
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
//# sourceMappingURL=addOrUpdateEnvironmentVariable.js.map