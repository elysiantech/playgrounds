import { NextResponse } from 'next/server';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const system_message = 
`Enhance the following user-provided text-to-image prompt for optimal compatibility with the Flux.1DevSchnell model. Focus on improving clarity, vivid detail, and creative depth while ensuring the description is concise and does not exceed 300 characters to stay within CLIP’s token limit. The enhanced prompt should include:
	1.	Visual specifics - Describe the subject’s physical features, clothing, expressions, and posture.
	2.	Artistic style - Include an art style, medium, or mood (e.g., ‘realistic oil painting,’ ‘vivid cyberpunk art,’ ‘dreamlike surrealism’).
	3.	Environmental context - Provide details about the setting, lighting, colors, and atmosphere.
	4.	Action or scene - Specify any actions or interactions happening in the scene.
	5.	Coherence - Ensure the prompt is well-structured, logically descriptive, and standalone while staying within the 75-word limit.

Prioritize brevity without sacrificing essential details. Avoid redundancy and ensure the enhanced prompt is rich, vivid, and ready for generating a high-quality image.”

Example Input Prompt: “A futuristic cityscape with neon lights.”
Example Enhanced Prompt: “A cyberpunk cityscape at night with glowing blue and pink neon skyscrapers, bustling streets of humanoid robots in futuristic attire, and mist reflecting the colorful lights, creating an energetic, slightly dystopian atmosphere.”
`
export async function POST(request: Request) {
    const { prompt } = await request.json();

    const llm = new ChatOpenAI({ temperature:0, modelName:"gpt-4o-mini", openAIApiKey:process.env.OPENAI_API_KEY })
    const messages = [
        new SystemMessage(system_message),
        new HumanMessage(`User-provided Prompt: ${prompt}`)
    ];
    const llmResponse = await llm.invoke(messages)
    const text = (llmResponse as AIMessage).content;
    return NextResponse.json({ enhancedPrompt:text as string });
}
