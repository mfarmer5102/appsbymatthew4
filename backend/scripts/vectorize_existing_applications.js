/**
 * Backfill vector embeddings for existing applications.
 *
 * Reads every non-deleted application, rebuilds its embedding text from the joined
 * skill and support status names, and upserts the vector into dim_application_embedding
 * under the current model version.
 *
 * Prerequisites:
 *   - SUPABASE_DB_URL and OPENAI_API_KEY set (a backend/.env is enough locally)
 *   - The `vector` extension enabled in the Supabase project
 *
 * Usage:
 *   npm run vectorize-existing-apps
 */

// Must come first: ESM evaluates imports in source order, and importing the data layer
// triggers secrets.js, which reads process.env at module scope.
import 'dotenv/config';

import {do_vectorize} from '../src/data/applications.js';
import {postgres_config, EMBEDDING_MODEL_VERSION} from '../src/configuration/database.js';

async function main() {
    console.log('Vectorizing applications');
    console.log(`Model version: ${EMBEDDING_MODEL_VERSION}\n`);

    const started_at = Date.now();
    const {total, processed, failed} = await do_vectorize();
    const elapsed_seconds = ((Date.now() - started_at) / 1000).toFixed(1);

    console.log('\nDone.');
    console.log(`  Applications found: ${total}`);
    console.log(`  Embedded:           ${processed}`);
    console.log(`  Failed:             ${failed}`);
    console.log(`  Elapsed:            ${elapsed_seconds}s`);

    if (failed > 0) {
        console.log('\nSome applications could not be embedded. Check the errors above.');
    }

    return failed > 0 ? 1 : 0;
}

main()
    .then(async (exit_code) => {
        await postgres_config.close();
        process.exit(exit_code);
    })
    .catch(async (error) => {
        console.error('\nVectorization failed:', error.message);
        await postgres_config.close();
        process.exit(1);
    });
