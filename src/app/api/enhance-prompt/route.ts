import { NextResponse } from 'next/server';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(request: Request) {
    const { prompt } = await request.json();

    const llm = new ChatOpenAI({ temperature:0, modelName:"gpt-4o-mini", openAIApiKey:process.env.OPENAI_API_KEY })
    const messages = [
        new SystemMessage(`
            Using the following USER_PROMPT and/or Image, create a concise text prompt (no more than 75 words) suitable for an image generation model.
            Highlight key features and details, including size, shape, material, and any distinctive attributes.
            Use simplified or neutral background elements, such as flat colors or minimal distractions, to ensure the subject is the primary focus.
            The text prompt should be concise (less than 100 words) and written in the form of an instruction to an image generation model.
        `),
        new HumanMessage(`USER_PROMPT: ${prompt}`)
    ];
    const llmResponse = await llm.invoke(messages)
    const text = (llmResponse as AIMessage).content;
    return NextResponse.json({ enhancedPrompt:text as string });
}
