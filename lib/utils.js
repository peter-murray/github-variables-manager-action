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
exports.requireStringArgumentValue = exports.getOctokit = exports.getRequiredInput = exports.getGitHubToken = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("./github/github"));
function getGitHubToken() {
    const tokenName = "TEST_GITHUB_TOKEN";
    const token = process.env[tokenName];
    if (!token) {
        throw new Error(`GitHub Token was not set for environment variable "${tokenName}"`);
    }
    return token;
}
exports.getGitHubToken = getGitHubToken;
function getRequiredInput(name) {
    return core.getInput(name, { required: true });
}
exports.getRequiredInput = getRequiredInput;
function getOctokit(token) {
    let octokitToken;
    if (!token) {
        octokitToken = getRequiredInput('github_token');
    }
    else {
        octokitToken = token;
    }
    return github.getOctokit(octokitToken);
}
exports.getOctokit = getOctokit;
function requireStringArgumentValue(name, value) {
    if (value === null || value === undefined) {
        throw new Error(`Need to provide a value for argument "${name}"`);
    }
    const strValue = `${value}`.trim();
    if (strValue.length === 0) {
        throw new Error(`"${name}" value provided was zero length or empty string`);
    }
    return strValue;
}
exports.requireStringArgumentValue = requireStringArgumentValue;
//# sourceMappingURL=utils.js.map