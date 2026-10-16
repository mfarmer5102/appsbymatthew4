import {postgres_config} from './database.js';
import {VectorSearchHelper} from '../_library/classes/vector_search.js';

// Its own module rather than an export of database.js, which vector_search.js imports.
export const vector_search_helper = new VectorSearchHelper(postgres_config);
