import { NextResponse } from 'next/server';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const system_message=`Create a text prompt from the image in less than 100 words only. 
Make sure to include fine details of the image in the text prompt. 
The text prompt should in the form of a text instruction to an image generation model.""",
`
export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const buffer = Buffer.from(await file.arrayBuffer());
   
    const llm = new ChatOpenAI({ temperature:0, modelName:"gpt-4o-mini", openAIApiKey:process.env.OPENAI_API_KEY })
    const messages = [
        new SystemMessage(system_message),
        new HumanMessage({
            content: [
                { type: "image_url", image_url: { url: `data:image/png;base64,${buffer.toString("base64")}`, detail: 'high' } },
            ],
            additional_kwargs: {},
        })
    ];
    const llmResponse = await llm.invoke(messages)
    const text = (llmResponse as AIMessage).content;
    return NextResponse.json({ prompt:text as string });
}