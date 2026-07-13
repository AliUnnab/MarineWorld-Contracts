"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const vector_service_1 = require("./vector-service");
class AgentService {
    vectorService;
    constructor() {
        this.vectorService = new vector_service_1.VectorService();
    }
    /**
     * Performs search query restricted to Sales Agent access scope.
     * Access: companyId matches, and document type must be either 'Fiyat Listesi' or 'Katalog'.
     */
    async searchSalesAgent(companyId, query, limit = 5) {
        const allowedTypes = ["Fiyat Listesi", "Katalog"];
        console.log(`💼 [Sales Agent Search] Resolving query for company ${companyId}`);
        return await this.vectorService.searchChunks(companyId, allowedTypes, query, limit);
    }
    /**
     * Performs search query restricted to Technical Service Agent access scope.
     * Access: companyId matches, and document type must be exactly 'Bakım Kılavuzu'.
     */
    async searchTechnicalAgent(companyId, query, limit = 5) {
        const allowedTypes = ["Bakım Kılavuzu"];
        console.log(`🛠️ [Technical Agent Search] Resolving query for company ${companyId}`);
        return await this.vectorService.searchChunks(companyId, allowedTypes, query, limit);
    }
    /**
     * General role-based gateway query resolver.
     */
    async queryByAgentRole(role, companyId, query, limit = 5) {
        if (role === "sales") {
            return await this.searchSalesAgent(companyId, query, limit);
        }
        else if (role === "technical") {
            return await this.searchTechnicalAgent(companyId, query, limit);
        }
        else {
            throw new Error(`Unauthorized agent role or unknown scope: '${role}'`);
        }
    }
}
exports.AgentService = AgentService;
//# sourceMappingURL=agent-service.js.map