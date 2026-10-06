import searchTool from "../config/tavily.js"
import deductCredits from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const searchAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "search")
        const results = await searchTool.invoke({
            query: state.prompt
        })
        await deductCredits(state.userId, "search")
        
        return {
            ...state,
            searchResults: results,
            images: results.images
        }
    } catch (error) {
        console.error("Error in search agent:", error)
        return {
            ...state,
            aiResponse: error.data.message || "Failed to Generate Search",
            searchResults: [],
            images: []
        }
    }
}