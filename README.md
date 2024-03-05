# RAG with Gemini AI

This repository implements Retrieval-Augmented Generation (RAG) using Gemini AI, a technique that combines information retrieval and language generation for more contextually relevant responses.

## What is RAG and its uses?

Retrieval-Augmented Generation (RAG) is a technique that leverages both information retrieval and language generation models. It enhances the language generation process by retrieving relevant information from a document or a knowledge base before generating a response. This approach allows the model to provide more contextually accurate and informed answers to user queries.

Uses of RAG:
- Enhanced question-answering systems.
- More contextually relevant chatbots.
- Improved content summarization.


# Gemini AI Multi-Turn Conversations

This repository leverages Gemini AI to build multi-turn conversations, allowing for freeform interactions across multiple turns. The SDK simplifies the conversation management process, eliminating the need to manually handle conversation history.

## Usage

To construct a multi-turn conversation using the Gemini Pro model, follow these steps:

1. Initialize the chat with the gemini-pro model by calling `startChat()`.
2. Use `sendMessage()` to send a new user message, automatically updating the chat history with the message and the model's response.

Roles associated with content in a conversation:

- **user**: The role that provides prompts. This is the default for `sendMessage` calls.
- **model**: The role that provides responses. Use this role when calling `startChat()` with existing history.

Example code snippet:

```javascript
const genAI = require('openai');

// Initialize the chat with the gemini-pro model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Start the chat with initial history
const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: "Hello, I have 2 dogs in my house.",
    },
    {
      role: "model",
      parts: "Great to meet you. What would you like to know?",
    },
  ],
  generationConfig: {
    maxOutputTokens: 100,
  },
});

// Send a new user message
const response = chat.sendMessage({
  role: "user",
  parts: "Can you tell me more about Gemini AI?",
});


## APIs

### 1. /load-document

**Description**: This API will read the content from the document which was uploaded by the user.

**Endpoint**: `POST /load-document`

### 2. /create-embeddings

**Description**: This API will create an embeddings for the content from the file (user uploaded ), Here I chunks the code based on the new line `\n`

**Endpoint**: `POST /create-embeddings` 

### 3. /conversation

**Description**:
    * This conversation API will the core part in RAG, here the user will make a prompt about the file they  uploaded. 
    * The user query will be embedded initially using the "model: embedding-001" and then it will make a aggregation using mongoDB query
    * It will return the top scores based on the users query.
    * Finally the context will send to the `gemini-ai` and it make the content more generative


**Endpoint**: `POST /conversation`

## MongoDB Atlas Integration

This project uses MongoDB Atlas as a vector database to store and retrieve document embeddings efficiently. This integration enhances the retrieval process by enabling fast and scalable storage of document embeddings, improving the overall performance of the RAG model.



## Installation

1. Install express generator globally:

```bash
npx express-generator
```

2. Install project dependencies:

```bash
npm install
```

3. Install nodemon for automatic server restarts:

```bash
npm install -g nodemon
```

4. Install dotenv for environment variable configuration:

```bash
npm install dotenv
```

5. Install OpenAI npm package:

```bash
npm install openai
```

Now, your project is set up with all the necessary dependencies. You can run the application using `nodemon` for automatic restarts during development.


