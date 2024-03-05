const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function createEmbeddings(text) {
    try {
        console.log("Create embedding function");
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        const result = await model.embedContent(text);
        const embedding = result.embedding.values;
        return embedding;
    } catch (error) {
        throw new Error(error);
    }
}

// createEmbeddings("Hello world");

module.exports = { createEmbeddings };
