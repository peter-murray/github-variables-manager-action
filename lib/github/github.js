import * as httpClient from '@actions/http-client';
import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { paginateRest } from '@octokit/plugin-paginate-rest';
export function getOctokit(token, options, ...additionalPlugins) {
    const GitHubWithPlugins = GitHub.plugin(...additionalPlugins);
    return new GitHubWithPlugins(getOctokitOptions(token, options));
}
const baseUrl = getApiBaseUrl();
export const defaults = {
    baseUrl,
    request: {
        agent: getProxyAgent(baseUrl)
    }
};
export const GitHub = Octokit.plugin(restEndpointMethods, paginateRest).defaults(defaults);
export function getOctokitOptions(token, options) {
    const opts = Object.assign({}, options || {}); // Shallow clone - don't mutate the object provided by the caller
    // Auth
    const auth = getAuthString(token, opts);
    if (auth) {
        opts.auth = auth;
    }
    return opts;
}
function getAuthString(token, options) {
    if (!token && !options.auth) {
        throw new Error('Parameter token or opts.auth is required');
    }
    else if (token && options.auth) {
        throw new Error('Parameters token and opts.auth may not both be specified');
    }
    return typeof options.auth === 'string' ? options.auth : `token ${token}`;
}
function getProxyAgent(destinationUrl) {
    const hc = new httpClient.HttpClient();
    return hc.getAgent(destinationUrl);
}
function getApiBaseUrl() {
    return process.env['GITHUB_API_URL'] || 'https://api.github.com';
}
//# sourceMappingURL=github.js.map