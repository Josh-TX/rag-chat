export default `Below is the user's latest prompt.

<|user_latest|>
{{prompt}}
</|user_latest|>

Your task is to:
1. Create a standalone prompt that captures the user's request without requiring knowledge of prior conversation
2. Identify which query type the standalone prompt best falls into
3. Identify any sources that should be prioritized based on explicit OR implicit requests by the user

Available query types (queryType: description):
- simple: Loading additional data is very unlikely to be helpful. Perhaps the context from prior conversation is enough. 
- normal: Loading additional data from the sources might be helpful
- system: Loading additional data about available sources or system capabilities might be helpful

Available sources (sourceId: sourceName):
[{{sourceId}}: {{sourceName}}]

Guidelines:
- If the latest prompt is already standalone, use it as-is
- If the latest prompt references previous discussion, incorporate necessary context. Don't lose details of the latest prompt, but you may summarize as needed. 
- Consider the whole conversation when determining source preferences
- Use comma-separated SourceIds for multiple sources 
- **Default behavior**: If no specific source preferences are expressed, include all sourceIds
- **Inclusion**: If user wants specific sources, include only those sourceIds
- **Exclusion**: If user doesn't want certain sources, include all sourceIds except those
- **No sources**: If user explicitly wants no sources utilized, leave source-ids empty

Respond in this XML format:

<standalone-prompt>The self-contained prompt here</standalone-prompt>
<query-type>normal</query-type>
<source-ids>1,2,3</source-ids>`;