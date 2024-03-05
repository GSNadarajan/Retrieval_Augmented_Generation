var express = require("express");
var router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const { createEmbeddings } = require("./embeddings");
const fs = require("fs");
require('dotenv').config()
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

var PDFParser = require("pdf2json");
const { runInNewContext } = require("vm");
const parser = new PDFParser(this, 1);
const DB =
  "mongodb+srv://Nattu:dEGBZBiEpR3Xyr0k@cluster0.0yeuk36.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    const connection = await MongoClient.connect(process.env.DB);
    // console.log("env from file" ,process.env.DB);
    const db = connection.db("rag_doc");
    const collection = db.collection("demo");
    await collection.insertOne({ test: "Success" });
    await connection.close();
    res.json({ title: "Express" });
  } catch (error) {
    console.log(error);
  }
});

router.post("/load-document", async (req, res) => {
  try {
    parser.loadPDF("./demo/ajithkumar.pdf");
    parser.on("pdfParser_dataReady", async (data) => {
      await fs.writeFileSync("./context.txt", parser.getRawTextContent());
      const content = await fs.readFileSync("./context.txt", "utf-8");
      const splitContent = content.split("\n");
      const connection = await MongoClient.connect(process.env.DB);
      const db = connection.db("rag_doc");
      const collection = db.collection("demo");

      for (line of splitContent) {
        const embedings = await createEmbeddings(line);
        await collection.insertOne({
          text: line,
          // embeddings : embedings.data[0].embeding
          embeddings: embedings,
        });
      }
      await connection.close();
    });
    res.json("Done");
  } catch (error) {
    console.log(error);
    res.json(500).json({ message: "Error" });
  }
});

router.post("/conversation", async (req, res) => {
  try {
    let sessionId = req.body.sessionId;
    const connection = await MongoClient.connect(process.env.DB);
    if(connection){
      console.log("Making db conn");
    }
    else{
      console.log("Mongo connection failure")
    }
    const db = connection.db("rag_doc");

    if (!sessionId) {
      const collection = db.collection("sessions");
      const sessionData = await collection.insertOne({
        createdAt: new Date(),
      });
      sessionId = sessionData._id;
    }

    if (sessionId) {
      const collection = db.collection("sessions");
      const sessionData = await collection.findOne({
        _id: new ObjectId(sessionId),
      });
      if (sessionData) {
        sessionId = sessionData._id;
        // return res.json({
        //   message: "Session found",
        // });
      } else {
        res.json({
          message: "Session not found",
        });
      }
    }


    // Let's work conversationc
    const message = req.body.message;
    const Concollection = db.collection("conversation");
    await Concollection.insertOne({
      sessionId: sessionId,
      message : message,
      role : "USER",
      createdAt: new Date()

    });

    // Convert message to vector
    // console.log(req.body.message);
    const messageVector = await createEmbeddings(req.body.message);

    const demoCollection = db.collection("demo");
    const vectorSearch = await demoCollection.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embeddings",
          queryVector: messageVector,
          numCandidates: 150,
          limit: 10,
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ]);

    let finalResult = []

    
    for await(let doc of vectorSearch){
      finalResult.push(doc)
    }
  
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const formattedMessage = `
    Ajith Kumar, popularly known as 'Thala Ajith,' is a celebrated Indian film actor who has left an indelible mark on the Tamil film industry. Born on May 1, 1971, in Hyderabad, India, Ajith's acting style is characterized by a unique blend of intensity, versatility, and natural flair. His ability to immerse himself into diverse roles has earned him accolades and Ajith's filmography is an impressive tapestry of successful movies, each contributing to his iconic status. Films like 'Mankatha,' 'Veeram,' 'Vedalam,' and 'Viswasam' have not only showcased his acting prowess but have also established him as a leading star in the industry. Apart from his cinematic achievements, Ajith is known for his philanthropic efforts, and his role as a family man. Ajith Kumar stands as a multifaceted personality, a revered actor, a racing enthusiast, a humble individual, and a beacon of inspiration. Ajith's humility and simplicity are often spoken about by those who have worked with him. Despite his celebrity status, he maintains a down-to-earth demeanor, making him approachable. Ajith's journey to stardom is a tale of perseverance, talent, and charisma. Beyond acting, Ajith is passionate about motorsports, expressing his love for speed and adventure. Ajith's dedication to motorsports has garnered him recognition and awards, further adding to his diverse repertoire. In addition to his contributions to the entertainment industry, Ajith is actively involved in philanthropic endeavors. His charitable activities span a range of causes, including education and healthcare. From a young age, Ajith displayed a penchant for acting and the arts. His foray into the film industry began in the late 1980s when he took on small roles. However, it was his breakthrough role in the film 'Prema Pusthakam' in 1992 that catapulted him into the spotlight. The success of the movie marked the beginning of Ajith's illustrious career in the world of cinema.
    `;
    // const chat = model.startChat({
    //   history: [
    //     {
    //       role: "model",
    //       parts: "You are a humble helper who can answer for questions asked by users from the given context.",
    //     },
    //     {
    //       role: "user",
    //       parts: formattedMessage
    //     },
    //   ],
    //   generationConfig: {
    //     maxOutputTokens: 50,
    //   },
    // });

    // console.log("formatted message", formattedMessage)

   

    // const result = await chat.sendMessage(message);
    // const response = await result.response;
    // const text = response.text();
    // console.log("text" ,text);


    /// -----------------------DEMO MODEL FOR CHAT BASED ON THE CONTENT --------------------------------

    const formattedContent = finalResult.map(doc => doc.text).join("\n");

// Combine with the additional question
    const formattedmessage = `${formattedContent}\n\n From the above context, answer the following question: ${message}`;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts : formattedmessage
        },
        {
          role: "model",
          parts: "You are a humble helper who can answer for questions asked by users from the given context.",
          
        },
        
      ],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });
  
    // const msg = "Who is thala?";
    // console.log("users messsage", message);
  
    const result = await chat.sendMessage(req.body.message);
    const response = await result.response;
    const text = response.text();
    console.log(text);

    /// -----------------------DEMO MODEL FOR CHAT BASED ON THE CONTENT --------------------------------

  
    return res.json(text);
  } catch (error) {
    res.json({ messsage: "Something went wrong" });
    console.log(error);
  }
});

router.get("/embeddings", async (req, res) => {
  try {
    const embeddings = await createEmbeddings("This is nattu !");
    res.json(embeddings);
  } catch (error) {
    console.log(error);
    res.status;
  }
});

module.exports = router;
