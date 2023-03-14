"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationVariable = void 0;
class OrganizationVariable {
    constructor(organization, data, selectedRepos) {
        this.organization = organization;
        this.data = data;
        this.sharedRepositories = selectedRepos;
    }
    get name() {
        return this.data.name;
    }
    get value() {
        return this.data.value;
    }
    get visibility() {
        return this.data.visibility;
    }
    get updated() {
        return this.data.updated_at;
    }
    get created() {
        return this.data.created_at;
    }
    isSharedWithRepositories() {
        return this.visibility === 'selected' && this.sharedRepositories !== undefined;
    }
}
exports.OrganizationVariable = OrganizationVariable;
//# sourceMappingURL=OrganizationVariable.js.map