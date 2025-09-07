import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize the client
const client = new QdrantClient({
    host: '127.0.0.1',  // or 'localhost'
    port: 6333
});

async function setup() {
    try {
        // 1. CREATE A COLLECTION
        // Basic collection with simple vector configuration
        var { exists } = await client.collectionExists('my_collection');
        if (!exists) {
            await client.createCollection('my_collection', {
                vectors: {
                    size: 4,        // Vector dimension
                    distance: 'Cosine' // Distance metric: 'Cosine', 'Euclid', 'Dot'
                }
            });
        }

        console.log('Collection created successfully!');

        // 3. ADD POINTS TO COLLECTION
        // Single point
        await client.upsert('my_collection', {
            points: [
                {
                    id: 1,
                    vector: [0.1, 0.2, 0.3, 0.4], // Must match vector size
                    payload: {
                        name: 'Document 1',
                        category: 'tech',
                        tags: ['ai', 'machine learning']
                    }
                }
            ]
        });

        // Multiple points
        await client.upsert('my_collection', {
            points: [
                {
                    id: 2,
                    vector: [0.5, 0.6, 0.7, 0.8],
                    payload: {
                        name: 'Document 2',
                        category: 'science',
                        tags: ['physics', 'research']
                    }
                },
                {
                    id: 3,
                    vector: [0.9, 0.1, 0.5, 0.3],
                    payload: {
                        name: 'Document 3',
                        category: 'tech',
                        author: 'John Doe'
                    }
                }
            ]
        });

        // 4. ADD POINTS WITH UUID IDs
        await client.upsert('my_collection', {
            points: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440000', // UUID string
                    vector: [0.2, 0.4, 0.6, 0.8],
                    payload: {
                        title: 'Important Document',
                        priority: 'high'
                    }
                }
            ]
        });

        console.log('Points added successfully!');

        // 6. SEARCH/QUERY POINTS
        const searchResults = await client.query('my_collection', {
            query: [0.1, 0.2, 0.3, 0.4], // Query vector
            limit: 5,
            with_payload: true, // Include payload in results
            with_vector: false  // Include vectors in results (optional)
        });

        console.log('Search results:', searchResults);

        // 7. SEARCH WITH FILTERS
        const filteredResults = await client.query('my_collection', {
            query: [0.1, 0.2, 0.3, 0.4],
            limit: 3,
            filter: {
                must: [
                    {
                        key: 'category',
                        match: {
                            value: 'tech'
                        }
                    }
                ]
            },
            with_payload: true
        });

        console.log('Filtered results:', filteredResults);

        // 8. GET COLLECTION INFO
        const collectionInfo = await client.getCollection('my_collection');
        console.log('Collection info:', collectionInfo);

        // 9. LIST ALL COLLECTIONS
        const collections = await client.getCollections();
        console.log('All collections:', collections);

    } catch (error) {
        console.error('Error:', error);
    }
}
setup();
export default client;