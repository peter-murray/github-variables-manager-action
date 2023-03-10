import { describe, expect, beforeAll, test, beforeEach, afterEach } from 'vitest';

import { VariablesManager } from './VariablesManager';
import { getGitHubToken, getOctokit } from '../utils';

const TEST_ORGANIZATION = 'octodemo';
const TEST_ORGANIZATION_VARIABLE_NAME = 'ORGANIZATION_TEST_VARIABLE';
const TEST_ORGANIZATION_VARIABLE_VALUE = 'organization test variable used in test suites, do not delete';

const TEST_REPOSITORY_NAME = 'actions-variables-test';
const TEST_REPOSITORY_VARIABLE_NAME = 'TEST_VARIABLE';
const TEST_REPOSITORY_VARIABLE_VALUE = 'repository_value';

const TEST_ENVIRONMENT_NAME = 'production';
const TEST_ENVIRONMENT_VARIABLE_NAME = 'TEST_VARIABLE';
const TEST_ENVIRONMENT_VARIABLE_VALUE = 'environment_production_value';

describe('VariablesManager', () => {

  let variablesManager: VariablesManager;

  beforeAll(() => {
    const octokit = getOctokit(getGitHubToken());

    variablesManager = new VariablesManager(octokit, TEST_ORGANIZATION);
  });

  describe('#getRepository()', () => {

    test('should return the repository', async () => {
      const data = await variablesManager.getRepository(TEST_REPOSITORY_NAME);

      expect(data).toBeDefined();
      expect(data).toHaveProperty('name', TEST_REPOSITORY_NAME);
    });

    test('should not return a repository that does not exist', async () => {
      const repositoryName = 'does-not-exist';
      const data = await variablesManager.getRepository(repositoryName);
      expect(data).toBeUndefined();
    });
  });

  describe('#getEnvironmentVariable()', async () => {

    test('it should retrieve an environment variable', async () => {
      const data = await variablesManager.getEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, TEST_ENVIRONMENT_VARIABLE_NAME);

      expect(data).toBeDefined();
      expect(data).toHaveProperty('name', TEST_ENVIRONMENT_VARIABLE_NAME);
      expect(data).toHaveProperty('value', TEST_ENVIRONMENT_VARIABLE_VALUE);
    });
  });

  describe('#getRepositoryVariable()', async () => {

    test('it should retrieve a repository variable', async () => {
      const data = await variablesManager.getRepositoryVariable(TEST_REPOSITORY_NAME, TEST_REPOSITORY_VARIABLE_NAME);

      expect(data).toBeDefined();
      expect(data).toHaveProperty('name', TEST_REPOSITORY_VARIABLE_NAME);
      expect(data).toHaveProperty('value', TEST_REPOSITORY_VARIABLE_VALUE);
    });
  });

  describe('#getOrganizationVariable()', async () => {

    test('it should retrieve an organization variable', async () => {
      const data = await variablesManager.getOrganizationVariable(TEST_ORGANIZATION_VARIABLE_NAME);

      expect(data).toBeDefined();
      expect(data?.name).toBe(TEST_ORGANIZATION_VARIABLE_NAME);
      expect(data?.value).toBe(TEST_ORGANIZATION_VARIABLE_VALUE);
    });
  });

  describe('#saveOrUpdateEnvironmentVariable()', async () => {

    const NEW_ENVIRONMENT_VARIABLE_NAME = 'NEW_VARIABLE';
    const UPDATED_ENVIRONMENT_VARIABLE = 'UPDATING_VARIABLE';

    beforeEach(async () => {
      // Need to ensure that the "new" variable does not exist
      await variablesManager.deleteEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, NEW_ENVIRONMENT_VARIABLE_NAME);
    });

    test('it should create a new environment variable', async () => {
      const variableName = NEW_ENVIRONMENT_VARIABLE_NAME;
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, variableName);
      expect(existing).toBeUndefined();

      const result = await variablesManager.saveOrUpdateEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('created');
    });

    test('it should update an environment variable', async () => {
      const variableName = UPDATED_ENVIRONMENT_VARIABLE
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, variableName);
      expect(existing).toBeDefined();

      const result = await variablesManager.saveOrUpdateEnvironmentVariable(TEST_REPOSITORY_NAME, TEST_ENVIRONMENT_NAME, variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('updated');
    });
  });

  describe('#saveOrUpdateRepositoryVariable()', async () => {

    const NEW_REPOSITORY_VARIABLE_NAME = 'NEW_VARIABLE';
    const UPDATED_REPOSITORY_VARIABLE = 'UPDATING_VARIABLE';

    beforeEach(async () => {
      // Need to ensure that the "new" variable does not exist
      await variablesManager.deleteRepositoryVariable(TEST_REPOSITORY_NAME, NEW_REPOSITORY_VARIABLE_NAME);
    });

    test('it should create a new repository variable', async () => {
      const variableName = NEW_REPOSITORY_VARIABLE_NAME;
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getRepositoryVariable(TEST_REPOSITORY_NAME, variableName);
      expect(existing).toBeUndefined();

      const result = await variablesManager.saveOrUpdateRepositoryVariable(TEST_REPOSITORY_NAME, variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('created');
    });

    test('it should update a repository variable', async () => {
      const variableName = UPDATED_REPOSITORY_VARIABLE
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getRepositoryVariable(TEST_REPOSITORY_NAME, variableName);
      expect(existing).toBeDefined();

      const result = await variablesManager.saveOrUpdateRepositoryVariable(TEST_REPOSITORY_NAME, variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('updated');
    });
  });

  describe('#saveOrUpdateOrganizationVariable()', async () => {

    const NEW_ORGANZIATION_VARIABLE_NAME = 'NEW_VARIABLE';
    const UPDATED_ORGANIZATION_VARIABLE = 'ORGANIZATION_UPDATING_VARIABLE';

    beforeEach(async () => {
      // Need to ensure that the "new" variable does not exist
      await variablesManager.deleteOrganizationVariable(NEW_ORGANZIATION_VARIABLE_NAME);
    });

    test('it should create a new organization variable', async () => {
      const variableName = NEW_ORGANZIATION_VARIABLE_NAME;
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getOrganizationVariable(variableName);
      expect(existing).toBeUndefined();

      const result = await variablesManager.saveOrUpdateOrganizationVariable(variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('created');
    });

    test('it should update a organization variable', async () => {
      const variableName = UPDATED_ORGANIZATION_VARIABLE
      const variableValue = `${Date.now()}`;

      const existing = await variablesManager.getOrganizationVariable(variableName);
      expect(existing).toBeDefined();

      const result = await variablesManager.saveOrUpdateOrganizationVariable(variableName, variableValue);
      expect(result).toBeDefined();
      expect(result).toBe('updated');
    });
  });

  describe('add and remove repository to organization variable()', async () => {

    const VARIABLE_NAME = 'ORGANIZATION_TEST_VARIABLE_LIMITED_TEMP_TEST';

    let orgVariable;
    let repository;

    beforeEach(async () => {
      await variablesManager.saveOrUpdateOrganizationVariable(VARIABLE_NAME, 'Limited access organization test variable used in test suite', 'selected');

      orgVariable = await variablesManager.getOrganizationVariable(VARIABLE_NAME);
      expect(orgVariable).toBeDefined();

      repository = await variablesManager.getRepository(TEST_REPOSITORY_NAME);
      expect(repository).toBeDefined();
    });

    afterEach(async () => {
      await variablesManager.deleteOrganizationVariable(VARIABLE_NAME);
    });

    test('Adding repository to organization variable', async () => {
      const result = await variablesManager.addVariableToRepository(VARIABLE_NAME, TEST_REPOSITORY_NAME);
      expect(result).toBeDefined();
      expect(result).toBe(true);
    });

    test('Removing repository from organization variable', async () => {
      const result = await variablesManager.addVariableToRepository(VARIABLE_NAME, TEST_REPOSITORY_NAME);
      expect(result).toBeDefined();
      expect(result).toBe(true);

      let organizationVariable = await variablesManager.getOrganizationVariable(VARIABLE_NAME);
      expect(organizationVariable).toBeDefined();
      expect(organizationVariable?.visibility).toBe('selected');
      expect(organizationVariable?.sharedRepositories).toHaveLength(1);

      const removalResult = await variablesManager.removeVariableFromRepository(VARIABLE_NAME, TEST_REPOSITORY_NAME);
      expect(removalResult).toBeDefined();
      expect(removalResult).toBe(true);

      organizationVariable = await variablesManager.getOrganizationVariable(VARIABLE_NAME);
      expect(organizationVariable).toBeDefined();
      expect(organizationVariable?.sharedRepositories).toSatisfy(value => { return value === undefined || value.length === 0});
    });
  });
});