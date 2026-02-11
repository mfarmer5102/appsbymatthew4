/**
 * One-time script to generate embeddings for existing applications
 *
 * This script:
 * 1. Finds all applications without an embedding field
 * 2. Generates embeddings using OpenAI API
 * 3. Updates the applications with the embeddings
 *
 * Usage:
 *   node backend/scripts/vectorize_existing_applications.js
 *
 * Prerequisites:
 *   - OPENAI_API_KEY must be set in environment or AWS Secrets Manager
 *   - MongoDB Atlas connection configured
 */

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const MONGO_URL = process.env.MONGO_INSTANCE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'apps_by_matthew';
const COLLECTION_NAME = 'applications';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 10; // Process in batches to avoid rate limits

// Validate configuration
if (!MONGO_URL) {
    console.error('Error: MONGO_INSTANCE_URL environment variable not set');
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    process.exit(1);
}

// Initialize clients
const mongoClient = new MongoClient(MONGO_URL);
const openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Format application data for vectorization
 */
function formatForVectorization(app) {
    const parts = [];

    if (app.title) parts.push(`Title: ${app.title}`);
    if (app.description) parts.push(`Description: ${app.description}`);
    if (app.associated_skill_codes && app.associated_skill_codes.length > 0) {
        parts.push(`Technologies/Skills: ${app.associated_skill_codes.join(', ')}`);
    }
    if (app.support_status_code) parts.push(`Support Status: ${app.support_status_code}`);

    return parts.join('\n');
}

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text) {
    try {
        const response = await openaiClient.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error.message);
        throw error;
    }
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function vectorizeApplications() {
    try {
        console.log('🚀 Starting vectorization of existing applications...\n');

        // Connect to MongoDB
        console.log('📊 Connecting to MongoDB...');
        await mongoClient.connect();
        const db = mongoClient.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Find applications without embeddings
        console.log('🔍 Finding applications without embeddings...');
        const appsWithoutEmbeddings = await collection
            .find({
                embedding: { $exists: false },
                deleted_at: null
            })
            .toArray();

        console.log(`📝 Found ${appsWithoutEmbeddings.length} applications to vectorize\n`);

        if (appsWithoutEmbeddings.length === 0) {
            console.log('✅ All applications already have embeddings!');
            return;
        }

        // Process in batches
        let processed = 0;
        let failed = 0;

        for (let i = 0; i < appsWithoutEmbeddings.length; i += BATCH_SIZE) {
            const batch = appsWithoutEmbeddings.slice(i, i + BATCH_SIZE);
            console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(appsWithoutEmbeddings.length / BATCH_SIZE)}`);

            for (const app of batch) {
                try {
                    console.log(`   Processing: "${app.title}"...`);

                    // Format text for vectorization
                    const textToVectorize = formatForVectorization(app);

                    // Generate embedding
                    const embedding = await generateEmbedding(textToVectorize);

                    // Update document
                    await collection.updateOne(
                        { _id: app._id },
                        {
                            $set: {
                                embedding: embedding,
                                updated_at: new Date()
                            }
                        }
                    );

                    processed++;
                    console.log(`   ✓ Success (${processed}/${appsWithoutEmbeddings.length})`);

                    // Rate limiting - wait between requests
                    await sleep(200); // 200ms delay between requests

                } catch (error) {
                    failed++;
                    console.error(`   ✗ Failed: ${error.message}`);
                }
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Vectorization Summary:');
        console.log('='.repeat(50));
        console.log(`Total applications: ${appsWithoutEmbeddings.length}`);
        console.log(`Successfully processed: ${processed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log('='.repeat(50) + '\n');

        if (processed > 0) {
            console.log('✅ Vectorization complete!');
            console.log('💡 Next step: Create vector search index in MongoDB Atlas');
            console.log('   Index name: applications_vector_index');
            console.log('   Index definition: See plan file for details');
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoClient.close();
        console.log('\n👋 Closed MongoDB connection');
    }
}

// Run the script
vectorizeApplications()
    .then(() => {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
