import { getModel } from "../config/llmModels.js"

export const codingAgent = async (state) => {
    const intentLLM = await getModel("intent")
    const codingLLM = await getModel("coding")

    const intentRes = await intentLLM.invoke(`
        You are an intent classifier.
    
    Return ONLY on of these values.

    CODE_GENERATION
    CODE_EXPLANATION
    CODE_REVIEW
    DEBUGGING
    CODE_OPTIMIZATION
    CODE_TRANSLATION
    CODE_SECURITY_AUDIT
    CODE_COMPLETION
    CODE_DOCUMENTATION
    CODE_CONVERSION

    User Request: ${state.prompt}
    `)

    const intent = intentRes.content?.trim()
    if (intent === "CODE_GENERATION") {
        const prompt = `
            You are SaaFlowAI Coding Agent.

Generate the requested project

Default Stack:
- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Use Tailwind CSS for styling.

Rules:
- If the user asks for a complete project, create all necessary files.
- Keep the code clean, modular, and well-commented.
- Respond ONLY with a JSON object in this exact structure without markdown code blocks:
{
    "files": [
        {
            "name": "index.html",
            "content": "..."
        }
    ]
}

User Request: ${state.prompt}
        `
        const res = await codingLLM.invoke(prompt)
        const cleanedContent = res.content.replace(/```json|```/g, "").trim()
        let files = []
        try {
            const data = JSON.parse(cleanedContent)
            files = data.files || []
        } catch (err) {
            console.error("Failed to parse LLM response JSON in codingAgent:", err)
        }

        return {
            ...state, 
            aiResponse: "Code Generated Successfully.",
            artifacts: [
                { id: Date.now(), type: "Project", files }
            ]
        }
    }

    const res = await codingLLM.invoke(`
    The user's request is:

${intent}

Return Markdown only.
Never generate project files.
Use headings like:
# Overview
## Explanation
## Proplems
## Improvments
## Code Example
## Steps
## Conclusion
## Optimized code (if needed)

User Request: 

${state.prompt}

        `)

    const data = res.content

    return {
        ...state,
        aiResponse: data,
        artifacts: []
    }
} 