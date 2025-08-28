import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler (request, reply) {
  return { hello: 'world' }
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

import { split } from 'sentence-splitter';
//import { Mistral } from '@mistralai/mistralai';

const text = "Dr. Smith said 'Hello world.' Then he left. Then we have another sentence";
const sentences = split(text)
  .filter(node => node.type === 'Sentence')
  .map(node => node.raw.trim());

console.log(sentences);

// const apiKey = process.env.MISTRAL_API_KEY;

// const client = new Mistral({apiKey: apiKey});

// const chatResponse = await client.chat.complete({
//   model: 'mistral-small-2506',
//   messages: [{role: 'user', content: 'Whats the best programming language?'}],
// });

// console.log('Chat:', chatResponse.choices[0].message.content);