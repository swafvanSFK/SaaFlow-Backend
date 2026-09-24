import { getModel } from "../config/llmModels.js"
import { generatePPT } from "../utils/generatePPT.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { uploadToS3 } from "../utils/uploadToS3.js"

export const pptAgent = async (state) => {
    try {
        const llm = await getModel("ppt")

        const prompt = `You are a professional presentation designer.

Return ONLY a valid JSON object matching this exact schema:
{
    "title": "Presentation Title",
    "subtitle": "Short descriptive subtitle",
    "slides": [
        {
            "title": "Slide Title",
            "points": [
                "Key bullet point 1",
                "Key bullet point 2",
                "Key bullet point 3",
                "Key bullet point 4"
            ]
        }
    ]
}

Rules:
- Generate 5 to 7 content slides.
- Each slide should have 3 to 5 concise bullet points.
- Do NOT include markdown code blocks, backticks, or any conversational text.
- Output ONLY pure, valid JSON.

Topic / Request:
${state.prompt}
`

        const res = await llm.invoke(prompt)
        const rawContent = (typeof res?.content === "string" ? res.content : "").trim()
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/)

        if (!jsonMatch) {
            throw new Error(`LLM did not return JSON. Output: ${rawContent.slice(0, 100)}`)
        }

        const data = JSON.parse(jsonMatch[0])
        const buffer = await generatePPT(data)

        const filename = `ppt-${Date.now()}.pptx`
        await uploadToS3(filename, buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        const downloadUrl = await getFromS3(filename, 24 * 60 * 60)

        return {
            ...state,
            aiResponse: `Here is your generated PPT document: **${data?.title || "Presentation"}**

[Download ${data?.title || "Presentation"}.pptx](${downloadUrl})

_Link is active for 24 hours._`,
        }
    } catch (error) {
        console.error("Error in PPT agent:", error)
        return {
            ...state,
            aiResponse: "Something went wrong. Please try again."
        }
    }
}