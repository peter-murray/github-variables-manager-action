//
// Utilizing the core functions of @action/github here to achieve the same result but required as we need access to
// updated versions of the REST api for accessing variables as of 2023-03
//
import * as http from 'http'
import * as httpClient from '@actions/http-client'

import {Octokit} from '@octokit/core'
import {OctokitOptions, OctokitPlugin} from '@octokit/core/dist-types/types'
import {restEndpointMethods} from '@octokit/plugin-rest-endpoint-methods'
import {paginateRest} from '@octokit/plugin-paginate-rest'

export type GitHubOctokit = InstanceType<typeof GitHub>

export function getOctokit(
  token: string,
  options?: OctokitOptions,
  ...additionalPlugins: OctokitPlugin[]
): GitHubOctokit {
  const GitHubWithPlugins = GitHub.plugin(...additionalPlugins)
  return new GitHubWithPlugins(getOctokitOptions(token, options))
}

const baseUrl = getApiBaseUrl();

export const defaults: OctokitOptions = {
  baseUrl,
  request: {
    agent: getProxyAgent(baseUrl)
  }
};

export const GitHub = Octokit.plugin(
  restEndpointMethods,
  paginateRest
).defaults(defaults);


export function getOctokitOptions(
  token: string,
  options?: OctokitOptions
): OctokitOptions {
  const opts = Object.assign({}, options || {}) // Shallow clone - don't mutate the object provided by the caller

  // Auth
  const auth = getAuthString(token, opts)
  if (auth) {
    opts.auth = auth
  }

  return opts
}

function getAuthString(
  token: string,
  options: OctokitOptions
): string | undefined {
  if (!token && !options.auth) {
    throw new Error('Parameter token or opts.auth is required')
  } else if (token && options.auth) {
    throw new Error('Parameters token and opts.auth may not both be specified')
  }

  return typeof options.auth === 'string' ? options.auth : `token ${token}`
}

function getProxyAgent(destinationUrl: string): http.Agent {
  const hc = new httpClient.HttpClient()
  return hc.getAgent(destinationUrl)
}

function getApiBaseUrl(): string {
  return process.env['GITHUB_API_URL'] || 'https://api.github.com'
}