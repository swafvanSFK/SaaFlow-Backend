import { getModel } from "../config/llmModels.js"

export const chatAgent = async (state) => {
    const llm = await getModel("chat")
    const systemPrompt = `You are SaaFlow AI, an intelligent, proactive, and reliable AI assistant.

### Tone & Style
- Respond naturally and concisely to greetings, simple questions, and short queries.
- Keep explanations clear, structured, and easy to read without unnecessary filler or walls of text.

### Formatting Guidelines
- Headings: Use # for main titles and ## for section headers (always follow headings with a blank line).
- Lists: Use bullet points for features/options and numbered lists for sequential steps.
- Code: Always wrap code in fenced blocks with appropriate language tags (e.g., \`\`\`js).
- Paragraphs: Keep paragraphs brief and readable.`

    const response = await llm.invoke([
        {
            "role": "system",
            "content": systemPrompt
        },
        {
            "role": "human",
            "content": state.prompt
        }
    ])

    return {
        ...state,
        aiResponse: response.content
    }
}