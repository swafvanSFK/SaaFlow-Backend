import { getModel } from "../config/llmModels.js"
import axios from 'axios'
import { uploadToS3 } from "../utils/uploadToS3.js"
import { getFromS3 } from "../utils/getFromS3.js"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchImageWithRetry = async (prompt, maxRetries = 2) => {
    const cleanPrompt = prompt
        .replace(/["'`]/g, '')
        .replace(/[‑–—\n\r]/g, ' ')
        .replace(/[^a-zA-Z0-9 ,.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200)

    const seed = Math.floor(Math.random() * 100000)

    // Strategy:
    // 1. Pollinations turbo model (significantly less prone to 429 rate-limiting)
    // 2. Pollinations standard endpoint with seed & nologo
    // 3. Fallback to short prompt
    const candidateUrls = [
        `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?model=turbo&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 80))}?model=turbo&nologo=true`
    ]

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }

    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        for (const url of candidateUrls) {
            try {
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 40000,
                    headers
                })

                if (response.status === 200 && response.data && response.data.length > 0) {
                    return response
                }
            } catch (err) {
                lastError = err
                // If rate-limited (429), wait before next attempt
                if (err.response?.status === 429) {
                    await sleep(1500 * (attempt + 1))
                }
            }
        }
        if (attempt < maxRetries) {
            await sleep(2000)
        }
    }

    throw lastError || new Error("Failed to retrieve image from all endpoints")
}

export const visionAgent = async (state) => {
    try {
        const llm = await getModel("image")

        const res = await llm.invoke(`
You are an expert AI image prompt engineer.
Convert the user request into a concise image prompt under 35 words.
Focus on subject, style, lighting, and composition.
Use only standard English characters. Do not use quotes or markdown.
Return ONLY the prompt text.

User Request: 
${state.prompt}
        `)

        const promptText = (typeof res?.content === "string" ? res.content : state.prompt).trim()
        const imageRes = await fetchImageWithRetry(promptText || state.prompt)

        const buffer = Buffer.from(imageRes.data)
        const fileName = `image-${Date.now()}.png`

        await uploadToS3(fileName, buffer, "image/png")

        const downloadUrl = await getFromS3(fileName, 24 * 60 * 60)

        return {
            ...state,
            aiResponse: `Here is your image:`,
            images: [downloadUrl]
        }
    } catch (error) {
        console.error("Error in vision agent:", error?.message || error)
        return {
            ...state,
            aiResponse: "Failed to generate image due to high demand or rate limits. Please try again in a few moments.",
            images: []
        }
    }
}