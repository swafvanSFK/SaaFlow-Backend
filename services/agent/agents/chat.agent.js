import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModels.js"
import { getMemory } from "../config/memory.js"

export const chatAgent = async (state) => {
    
    const llm = await getModel("chat")
    
    const history = await getMemory(state.conversationId)

    const searchContext = state.searchResults ? `Web Search Results
    ${JSON.stringify(state.searchResults)}
    Answer the user using only the above search results.
    ` : ""

    const systemPrompt = `You are SaaFlow AI, an intelligent, proactive, and reliable AI assistant.

    ${searchContext}

If searchContext exists:
- Use search results to answer.
- Do not mention internal tools.

### Tone & Style
- Respond naturally and concisely to greetings, simple questions, and short queries.
- Keep explanations clear, structured, and easy to read without unnecessary filler or walls of text.

### Formatting Guidelines
- Headings: Use # for main titles and ## for section headers (always follow headings with a blank line).
- Lists: Use bullet points for features/options and numbered lists for sequential steps.
- Code: Always wrap code in fenced blocks with appropriate language tags (e.g., \`\`\`js).
- Paragraphs: Keep paragraphs brief and readable.`

    const messages = [
        new SystemMessage(systemPrompt),
    ]

    history.forEach((message) => {
        if(message.role == "user") {
            messages.push(new HumanMessage(message.content))
        }
        if (message.role == "assistant") {
            messages.push(new AIMessage(message.content))
        }
    })

    messages.push(new HumanMessage(state.prompt))

    const response = await llm.invoke(messages)

    return {
        ...state,
        aiResponse: response.content
    }
}