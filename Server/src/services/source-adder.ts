import { split } from 'sentence-splitter';
import * as db from '../db';

export type AddSourceRequest = {
    sourceName: string,
    sections: SourceSection[]
    chunkSize: number,
    chunkOverlap: number,
}

export type SourceSection = {
    id: string,
    content: string
}

export type EmbedRequest = {
    sourceName: string,
    sectionId: string,
    startIndex: number,
    endIndex: number,
    content: string
}

export function addSource(request: AddSourceRequest): void {
    var embedRequests: EmbedRequest[] = [];
    for (var sourceSection of request.sections) {
        const sentences: string[] = split(sourceSection.content).filter(node => node.type === 'Sentence').map(node => node.raw.trim());
        if (!sentences.length) {
            continue;
        }
        if (sentences.length <= request.chunkSize) {
            embedRequests.push({
                sourceName: request.sourceName,
                sectionId: sourceSection.id,
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
                    sourceName: request.sourceName,
                    sectionId: sourceSection.id,
                    startIndex: startIndex,
                    endIndex: endIndex,
                    content: chunkContent
                });
            }
        }
    }
    var sourceEntity = db.getOrCreateSource(request.sourceName);

    console.log(embedRequests);
}
