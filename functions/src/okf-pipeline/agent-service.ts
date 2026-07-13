import { VectorService } from "./vector-service";

export interface AgentSearchResult {
  content: string;
  type: string;
  filePath: string;
  score: number;
  tags: string[];
}

export class AgentService {
  private vectorService: VectorService;

  constructor() {
    this.vectorService = new VectorService();
  }

  /**
   * Performs search query restricted to Sales Agent access scope.
   * Access: companyId matches, and document type must be either 'Fiyat Listesi' or 'Katalog'.
   */
  public async searchSalesAgent(
    companyId: string,
    query: string,
    limit = 5
  ): Promise<AgentSearchResult[]> {
    const allowedTypes = ["Fiyat Listesi", "Katalog"];
    console.log(`💼 [Sales Agent Search] Resolving query for company ${companyId}`);
    return await this.vectorService.searchChunks(
      companyId,
      allowedTypes,
      query,
      limit
    );
  }

  /**
   * Performs search query restricted to Technical Service Agent access scope.
   * Access: companyId matches, and document type must be exactly 'Bakım Kılavuzu'.
   */
  public async searchTechnicalAgent(
    companyId: string,
    query: string,
    limit = 5
  ): Promise<AgentSearchResult[]> {
    const allowedTypes = ["Bakım Kılavuzu"];
    console.log(`🛠️ [Technical Agent Search] Resolving query for company ${companyId}`);
    return await this.vectorService.searchChunks(
      companyId,
      allowedTypes,
      query,
      limit
    );
  }

  /**
   * General role-based gateway query resolver.
   */
  public async queryByAgentRole(
    role: "sales" | "technical",
    companyId: string,
    query: string,
    limit = 5
  ): Promise<AgentSearchResult[]> {
    if (role === "sales") {
      return await this.searchSalesAgent(companyId, query, limit);
    } else if (role === "technical") {
      return await this.searchTechnicalAgent(companyId, query, limit);
    } else {
      throw new Error(`Unauthorized agent role or unknown scope: '${role}'`);
    }
  }
}
