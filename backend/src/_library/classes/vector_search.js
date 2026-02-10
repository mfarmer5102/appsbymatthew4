import { error_config } from '../../configuration/errors.js';

export class VectorSearchHelper {
    constructor(applications_coll) {
        this.applications_coll = applications_coll;
    }

    /**
     * Search applications by vector similarity
     * @param {Array<number>} queryEmbedding - 1536-dimension query vector
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} - Array of similar application records
     */
    async searchApplications(queryEmbedding, limit = 5) {
        try {
            const pipeline = [
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        // index: 'applications_vector_index',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: 50, // Number of candidates to consider
                        limit: limit,
                    }
                },
                {
                    $match: {
                        deleted_at: null // Filter out soft-deleted records
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        associated_skill_codes: 1,
                        support_status_code: 1,
                        is_featured: 1,
                        live_site_url: 1,
                        repo_urls: 1,
                        score: { $meta: 'vectorSearchScore' } // Include similarity score
                    }
                }
            ];

            const results = await this.applications_coll.ref.aggregate(pipeline).toArray();
            return results;
        } catch (error) {
            console.error('Vector search error:', error);
            // Don't throw error - return empty array to allow graceful degradation
            // The chat can still function without vector search results
            console.warn('Returning empty results due to vector search failure');
            return [];
        }
    }

    /**
     * Search applications with a minimum score threshold
     * @param {Array<number>} queryEmbedding - 1536-dimension query vector
     * @param {number} limit - Maximum number of results to return
     * @param {number} minScore - Minimum similarity score (0-1)
     * @returns {Promise<Array>} - Array of similar application records
     */
    async searchApplicationsWithThreshold(queryEmbedding, limit = 5, minScore = 0.5) {
        const results = await this.searchApplications(queryEmbedding, limit);
        return results.filter(result => result.score >= minScore);
    }
}
