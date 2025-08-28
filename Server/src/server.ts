import Fastify from "fastify";
import fastifyStatic from '@fastify/static';
import path from 'path';
import chatRoutes from "./routes/chat.route";
import { FastifySSEPlugin } from "fastify-sse-v2";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });
fastify.register(FastifySSEPlugin);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'ui-dist'),
  prefix: '/',
});

// Register route modules
fastify.register(chatRoutes, { prefix: "/chat" });

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("🚀 Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
