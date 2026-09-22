import { getModel } from "../config/llmModels.js"
import { uploadToS3 } from "../utils/uploadToS3.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { generatePDF } from "../utils/generatePDF.js"

export const pdfAgent = async (state) => {
    try {
        const llm = await getModel("pdf")
        const prompt = `
You are an expert document writer and researcher.
Your job is to generate a comprehensive, highly informative document structure on the provided topic.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Document Title",
  "subtitle": "Concise informative subtitle",
  "sections": [
    {
      "heading": "Section Heading",
      "points": [
        "First key point with detailed explanation",
        "Second key point",
        "Third key point"
      ]
    }
  ]
}

Rules:
- Generate 4 to 8 detailed sections.
- Each section must have 3 to 6 comprehensive bullet points.
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
        console.log('data -------------- > ', data)
        const pdfBuffer = await generatePDF(data)

        const fileName = `pdf-${Date.now()}.pdf`
        await uploadToS3(fileName, pdfBuffer, "application/pdf")

        const downloadUrl = await getFromS3(fileName, 24 * 60 * 60)

        return {
            ...state,
            aiResponse: `Here is your generated PDF document: **${data?.title || "Document"}**

[Download ${data?.title || "Document"}.pdf](${downloadUrl})

_Link is active for 24 hours._`,
        }
    } catch (error) {
        console.error("Error in pdf agent:", error)
        return {...state, aiResponse: "Failed to process PDF"}
    }
}