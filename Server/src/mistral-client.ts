import { Mistral } from '@mistralai/mistralai';
const apiKey = process.env.MISTRAL_API_KEY;
const mistralClient = new Mistral({apiKey: apiKey});
export default mistralClient;