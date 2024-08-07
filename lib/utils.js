import * as core from '@actions/core';
import * as github from './github/github.js';
export function getGitHubToken() {
    const tokenName = "TEST_GITHUB_TOKEN";
    const token = process.env[tokenName];
    if (!token) {
        throw new Error(`GitHub Token was not set for environment variable "${tokenName}"`);
    }
    return token;
}
export function getRequiredInput(name) {
    return core.getInput(name, { required: true });
}
export function getOctokit(token, baseUrl) {
    let octokitToken;
    if (!token) {
        octokitToken = getRequiredInput('github_token');
    }
    else {
        octokitToken = token;
    }
    let githubApiUrl;
    if (baseUrl) {
        githubApiUrl = baseUrl;
    }
    else {
        githubApiUrl = core.getInput('github_api_url') || process.env.GITHUB_API_URL || 'https://api.github.com';
    }
    return github.getOctokit(octokitToken, { baseUrl: githubApiUrl });
}
export function requireStringArgumentValue(name, value) {
    if (value === null || value === undefined) {
        throw new Error(`Need to provide a value for argument "${name}"`);
    }
    const strValue = `${value}`.trim();
    if (strValue.length === 0) {
        throw new Error(`"${name}" value provided was zero length or empty string`);
    }
    return strValue;
}
//# sourceMappingURL=utils.js.map