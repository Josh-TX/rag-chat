import { split } from 'sentence-splitter';
import * as db from '../db';
import vdbClient from '../qdrant-client';
import embedClient from '../clients/embed-clients';
import { randomUUID } from 'crypto';


export type AddSourceRequest = {
    source: string,
    author: string | null,
    sections: SourceSection[]
    chunkSize: number,
    chunkOverlap: number,
}

export type SourceSection = {
    name: string,
    content: string
}

export type Snippet = {
    sectionName: string,
    source: string,
    author: string | null
    content: string
}

export type SemanticSearchResult = {
    searchPassage: string,
    vector: number[],
    snippets: Snippet[]
}

export type PointPayload = {
    sectionId: number,
    sectionName: string,
    startIndex: number,
    endIndex: number,
    source: string,
    author: string | null
}

export async function addSource(request: AddSourceRequest): Promise<void> {
    let embedRequests: Array<{
        sectionId: number,
        sectionName: string,
        startIndex: number,
        endIndex: number,
        content: string
    }> = [];
    for (let sourceSection of request.sections) {
        const sentences: string[] = split(sourceSection.content).filter(node => node.type === 'Sentence').map(node => node.raw.trim());
        if (!sentences.length) {
            continue;
        }
        let sectionId = db.createSection({ name: sourceSection.name, source: request.source, author: request.author, content: sourceSection.content });
        if (sentences.length <= request.chunkSize) {
            embedRequests.push({
                sectionId: sectionId,
                sectionName: sourceSection.name,
                startIndex: 0,
                endIndex: sentences.length - 1,
                content: sourceSection.content
            });
        } else {
            const stepSize = request.chunkSize - request.chunkOverlap;
            const numChunks = Math.ceil((sentences.length - request.chunkOverlap) / stepSize);
            for (let i = 0; i < numChunks; i++) {
                let startIndex: number;
                if (i == numChunks - 1) {
                    startIndex = sentences.length - request.chunkSize;
                } else {
                    startIndex = i * stepSize;
                }
                const endIndex = startIndex + request.chunkSize - 1;
                const chunkSentences = sentences.slice(startIndex, endIndex + 1);
                const chunkContent = chunkSentences.join(' ');
                embedRequests.push({
                    sectionId: sectionId,
                    sectionName: sourceSection.name,
                    startIndex: startIndex,
                    endIndex: endIndex,
                    content: chunkContent
                });
            }
        }
    }
    let vectors = await embedClient.embed(embedRequests.map(z => z.content));
    if (typeof vectors == "string") {
        throw "error embedding: " + vectors;
    }
    if (vectors.length != embedRequests.length) {
        throw "error: embedRequests.length doesn't match vectors.length"
    }
    let points: Array<{
        id: string,
        vector: number[],
        payload: PointPayload
    }> = [];
    for (let i = 0; i < vectors.length; i++) {
        let embedRequest = embedRequests[i];
        let pointPayload: PointPayload = {
            sectionId: embedRequest.sectionId,
            sectionName: embedRequest.sectionName,
            startIndex: embedRequest.startIndex,
            endIndex: embedRequest.endIndex,
            source: request.source,
            author: request.author
        }
        points.push({
            id: randomUUID(),
            vector: vectors[i],
            payload: pointPayload
        })
    }
    await vdbClient.upsert('gemini', {
        points: points
    });

    console.log(embedRequests);
}

export async function sementicSearch(searchPassages: string[]): Promise<SemanticSearchResult[]> {
    var vectors = await embedClient.embed(searchPassages)
    if (typeof vectors == "string") {
        throw "error embedding: " + vectors;
    }
    var chunksPromises = vectors.map(async (vector) => {
        var queryResult = await vdbClient.query("gemini", {
            query: vector, // Query vector
            limit: 5,
            with_payload: true, // Include payload in results
            with_vector: false  // Include vectors in results (optional)
        })
        var payloads = queryResult.points.map(z => <PointPayload>z.payload);
        var snippets = payloads.map(payload => {
            var section = db.getSectionById(payload.sectionId);
            var sentences: string[] = split(section.content).filter(node => node.type === 'Sentence').map(node => node.raw.trim());
            var content = sentences.slice(payload.startIndex, payload.endIndex + 1).join(" ");
            var snippet: Snippet = {
                sectionName: payload.sectionName,
                source: payload.source,
                author: payload.author,
                content: content
            };
            return snippet
        });
        return snippets;
    });
    var chunkss = await Promise.all(chunksPromises);
    var result: SemanticSearchResult[] = [];
    for (var i = 0; i < searchPassages.length; i++) {
        result.push({
            searchPassage: searchPassages[i],
            vector: vectors[i],
            snippets: chunkss[i]
        })
    }
    return result
}

