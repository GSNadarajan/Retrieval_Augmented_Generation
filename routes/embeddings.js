const {OpenAI} = require("openai")

async function createEmbeddings(text){
    try{
        const openai = new OpenAI({
            apiKey : process.env.OpenAIKEY
        })

        const embeddings = openai.embeddings.create({
            input : text,
            model : "text-embedding-ada-002"
        })

        return embeddings
    }
    catch(error){
        throw new Error(error)
    }
}

module.exports = { createEmbeddings} ;