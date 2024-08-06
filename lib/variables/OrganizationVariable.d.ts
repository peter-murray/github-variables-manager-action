import { OrgVariableData, Repository } from "./VariablesManager.js";
export declare class OrganizationVariable {
    private data;
    readonly organization: string;
    readonly sharedRepositories?: Repository[];
    constructor(organization: string, data: OrgVariableData, selectedRepos?: Repository[]);
    get name(): string;
    get value(): string;
    get visibility(): string;
    get updated(): string;
    get created(): string;
    isSharedWithRepositories(): boolean;
}
