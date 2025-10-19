import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv'

dotenv.config({'path': '.env.local',})

const genAI = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
});