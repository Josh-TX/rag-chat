export default `Below is the user's latest prompt.

<|user_latest|>
{{{prompt}}}
</|user_latest|>

Your task is to:
1. Create a standalone prompt that captures the user's request without requiring knowledge of prior conversation
2. Identify which query type the standalone prompt best falls into. Could be simple, normal, or system. 
3. Identify any sources that should be prioritized based on explicit OR implicit requests by the user
4. Generate up to 3 hypothetical passages that could plausibly appear in the available sources as answers to the standalone prompt.

Available query types (queryType: description):
- simple: Loading additional data is very unlikely to be helpful. Perhaps the context from prior conversation is enough. 
- normal: Loading additional data from the sources might be helpful
- system: Loading additional data about available sources or system capabilities might be helpful

Available sources (sourceId: sourceName):
{{{sourceList}}}

Guidelines:
- If the latest prompt is already standalone, use it verbatim as the standalone-prompt. Don't change anything at all
- If the latest prompt references previous discussion, incorporate necessary context into the standalone-prompt. Try to include all the details of the latest prompt nearly verbatim, but the prior conversation may be summarized
- Consider the whole conversation when determining source preferences
- Use comma-separated SourceIds for multiple sources 
- **Default behavior**: If no specific source preferences are expressed, include all sourceIds
- **Inclusion**: If user wants specific sources, include only those sourceIds
- **Exclusion**: If user doesn't want certain sources, include all sourceIds except those
- **No sources**: If user explicitly wants no sources utilized, leave source-ids empty
- Don't generate any hypothetical passages if the query type is simple or if the user wants no sources
- If generating any hypothetical passages, each one should be 2 to 4 sentences long.
- Hypothetical passages should NOT directly answer the prompt, but rather try to mimic how relevant information would be written within the available sources. 
- Don't make the hypothetical passages too similar to each other. Try to diversify the style, terminology, content, and which position it takes in mimicing an answer. 

Respond in this XML format:

<standalone-prompt>The self-contained prompt here</standalone-prompt>
<query-type>normal</query-type>
<source-ids>1,2,3</source-ids>
<hypothetical>For these reasons you shouldn't do prompt. But prompt has many advantages worth mentioning</hypothetical>
<hypothetical>This is why there's strong consensus regarding prompt</hypothetical>
`

    ;