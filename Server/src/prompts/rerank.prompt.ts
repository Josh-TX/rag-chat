export default `Below is the user's prompt.

<prompt>
{{{prompt}}}
</prompt>

And here are some source snippets that might be relevant and helpful in responding to the prompt

{{{snippets}}}

Your task is to:
1. Score each snippet on a scale of 0 to 100. 0 means the snippet is not helpful or irrelevant to the prompt, and 100 means it's maximally relevant and contains helpful/useful information. Also provide an explanation of the score
2. Create an optimal snippet group. The group should contain diverse coverage of information that's relavant to the prompt. Also provide an explanation of the why the group's snippets were chosen

Guidelines:
- do NOT score the snippets in accordance to how much your general knowledge agrees with the snippet's content.
- If the prompt requests certain sources/sections/authors, you can use that to influence what score you give each snippet 
- Each snippet's score should be un-influenced by other snippets. Don't give an mostly-irrelevant snippet a high score just because it's a tiny bit more relevant than the other snippets 
- The snippet group should be in CSV format. There should be at least one snippet id, and no more than three snippet ids. 
- The snippet group should prefer the high-scoring snippets, but also avoid having multiple very-similar snippets. Try to balance having both high scores and diversity. 
- The explanations should be within the output XML tags, and should be 1 to 2 sentences long. 

Respond in this example XML format:

<snippet id="1" score="30">Focused too much on [topic X]</snippet>
<snippet id="2" score="20">The user didnt want info from this author</snippet>
<snippet id="3" score="60">On topic, but might be too vague to be useful</snippet>
<snippet-group csv="1,3">They have good coverage of both [topic X] and [topic Y]. Snippet 2 was too similar to snippet 3 and had a low score</snippet-group>
`;

//the {{{snippets}}} should follow this patterns
/*
<snippet id="1">
    <source>{{source_1}}</source>
    <author>{{author_1}}</author>
    <section-title>{{section_1}}</section-title>
    <content>{{content_1}}</content>
</snippet>
<snippet id="2">...</snippet>
*/