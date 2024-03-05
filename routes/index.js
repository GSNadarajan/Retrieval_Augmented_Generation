var express = require("express");
var router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");
const { createEmbeddings } = require("./embeddings");
const fs = require("fs");
const db = require("dotenv").config();

var PDFParser = require("pdf2json");
const { runInNewContext } = require("vm");
const parser = new PDFParser(this, 1);
const DB =
  "mongodb+srv://Nattu:dEGBZBiEpR3Xyr0k@cluster0.0yeuk36.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    console.log("inside try");
    const connection = await MongoClient.connect(DB);
    console.log(process.env.DB);
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
        console.log("embedded content: ", embedings);
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
    const connection = await MongoClient.connect(DB);
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


    // Let's work conversation
    const message = req.body.message;
    const Concollection = db.collection("conversation");
    await Concollection.insertOne({
      sessionId: sessionId,
      message : message,
      role : "USER",
      createdAt: new Date()

    });

    // Convert message to vector
    console.log(req.body.message);
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

    return res.json(finalResult);
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
