"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const genai_1 = require("@google/genai");
class VectorService {
    ai = null;
    db;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
            try {
                this.ai = new genai_1.GoogleGenAI({ apiKey });
                console.log("✅ Gemini Client Initialized for Vector Service.");
            }
            catch (err) {
                console.error("❌ Failed to initialize Gemini Client for Vector Service:", err);
            }
        }
        try {
            // Use the specific database instance from server.ts config
            this.db = (0, firestore_1.getFirestore)("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
            console.log("✅ Firestore Admin SDK connected to vector collection.");
        }
        catch (err) {
            console.error("❌ Failed to connect to Firestore Database:", err);
        }
    }
    /**
     * Generates embedding vector for a given text.
     */
    async getEmbedding(text) {
        if (!this.ai) {
            // Fallback random mock vector if offline
            return Array.from({ length: 768 }, () => Math.random() - 0.5);
        }
        try {
            const response = (await this.ai.models.embedContent({
                model: "text-embedding-004",
                contents: text,
            }));
            if (response.embedding?.values) {
                return response.embedding.values;
            }
            throw new Error("Empty embedding values returned from API.");
        }
        catch (err) {
            console.warn("⚠️ Embedding API failed, returning mock vector:", err.message);
            return Array.from({ length: 768 }, () => Math.random() - 0.5);
        }
    }
    /**
     * Chunks a document body into overlapping pieces.
     */
    chunkText(text, chunkSize = 800, overlap = 150) {
        const words = text.split(/\s+/);
        const chunks = [];
        let currentWords = [];
        let currentLength = 0;
        for (const word of words) {
            currentWords.push(word);
            currentLength += word.length + 1; // approx char count
            if (currentLength >= chunkSize) {
                chunks.push(currentWords.join(" "));
                // Keep overlap by slicing back some words
                const overlapCount = Math.floor(currentWords.length * (overlap / chunkSize));
                currentWords = currentWords.slice(-Math.max(1, overlapCount));
                currentLength = currentWords.join(" ").length;
            }
        }
        if (currentWords.length > 0) {
            chunks.push(currentWords.join(" "));
        }
        return chunks.filter(c => c.trim().length > 10);
    }
    /**
     * Chunks, embeds, and saves an OKF document.
     */
    async indexDocument(companyId, filePath, type, markdownBody, tags, last_updated) {
        if (!this.db)
            throw new Error("Firestore DB not connected.");
        console.log(`📦 Starting indexing for doc: ${filePath} (type: ${type})`);
        const chunks = this.chunkText(markdownBody);
        console.log(`📦 Split document into ${chunks.length} chunks.`);
        // 1. Delete previous chunks of this specific file to avoid duplicates on update
        try {
            const existingRefs = await this.db
                .collection("knowledge_chunks")
                .where("companyId", "==", companyId)
                .where("filePath", "==", filePath)
                .get();
            if (!existingRefs.empty) {
                console.log(`🧹 Cleaning up ${existingRefs.size} obsolete index chunks for ${filePath}...`);
                const batch = this.db.batch();
                existingRefs.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        }
        catch (err) {
            console.warn("⚠️ Cleanup of existing chunks warning:", err.message);
        }
        // 2. Index new chunks
        let indexedCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const content = chunks[i];
            const embedding = await this.getEmbedding(content);
            const chunkDoc = {
                companyId,
                type,
                content,
                // Save as standard array
                embedding: embedding,
                tags,
                last_updated,
                chunkIndex: i,
                filePath,
            };
            // If Firestore supports Vector type locally/admin SDK
            try {
                if (typeof firestore_1.FieldValue.vector === "function") {
                    chunkDoc.embeddingVector = firestore_1.FieldValue.vector(embedding);
                }
            }
            catch (e) {
                // Fallback to array only
            }
            await this.db.collection("knowledge_chunks").add(chunkDoc);
            indexedCount++;
        }
        console.log(`✅ Successfully indexed ${indexedCount} chunks for file ${filePath}`);
        return indexedCount;
    }
    /**
     * Main query retriever implementing Vector Search + In-Memory similarity fallback
     */
    async searchChunks(companyId, allowedTypes, queryText, limit = 5) {
        if (!this.db)
            throw new Error("Firestore DB not connected.");
        console.log(`🔍 Searching OKF indexes for query: "${queryText}" [Filter: companyId=${companyId}, types=${JSON.stringify(allowedTypes)}]`);
        const queryVector = await this.getEmbedding(queryText);
        // Try Firestore native Vector Search first
        try {
            const collectionRef = this.db.collection("knowledge_chunks");
            // Basic query filters
            let baseQuery = collectionRef
                .where("companyId", "==", companyId)
                .where("type", "in", allowedTypes);
            // Verify if .findNearest is supported
            if (typeof baseQuery.findNearest === "function") {
                console.log("🔍 Attempting Native Firestore Vector Search Query...");
                // Native vector search query
                const vectorQuery = baseQuery.findNearest({
                    vectorField: "embeddingVector",
                    queryVector: queryVector,
                    distanceMeasure: "COSINE",
                    limit: limit,
                });
                const snapshot = await vectorQuery.get();
                if (!snapshot.empty) {
                    const results = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            content: data.content,
                            type: data.type,
                            filePath: data.filePath,
                            score: doc.compareValue ?? 1.0, // Firestore vector distance
                            tags: data.tags || [],
                        };
                    });
                    console.log(`✅ Native Vector Search returned ${results.length} results.`);
                    return results;
                }
            }
        }
        catch (err) {
            console.log(`⚠️ Native Firestore Vector Search failed or not supported (${err.message}). Falling back to memory cosine-similarity scanner.`);
        }
        // High-Fidelity Cosine Similarity Memory Scan Fallback
        console.log("💾 Running Memory-based Cosine-Similarity Scanner...");
        // 1. Fetch all candidate documents with metadata matching filters
        const querySnap = await this.db
            .collection("knowledge_chunks")
            .where("companyId", "==", companyId)
            .where("type", "in", allowedTypes)
            .get();
        if (querySnap.empty) {
            console.log("🔍 No documents found matching metadata filters.");
            return [];
        }
        console.log(`💾 Candidate chunks fetched: ${querySnap.size}. Calculating similarities...`);
        const scoredResults = [];
        // 2. Score each candidate
        querySnap.docs.forEach((doc) => {
            const data = doc.data();
            const docEmbedding = data.embedding;
            if (Array.isArray(docEmbedding) && docEmbedding.length > 0) {
                const score = this.cosineSimilarity(queryVector, docEmbedding);
                scoredResults.push({
                    content: data.content,
                    type: data.type,
                    filePath: data.filePath,
                    score,
                    tags: data.tags || [],
                });
            }
        });
        // 3. Sort by descending score and limit
        const results = scoredResults
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        console.log(`✅ Memory scanner returned top ${results.length} matches.`);
        return results;
    }
    /**
     * Helper to calculate Cosine Similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0.0;
        let normA = 0.0;
        let normB = 0.0;
        // Support comparing vectors of slightly mismatched lengths gracefully (e.g. api vs fallback mock)
        const len = Math.min(vecA.length, vecB.length);
        for (let i = 0; i < len; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0)
            return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
exports.VectorService = VectorService;
//# sourceMappingURL=vector-service.js.map