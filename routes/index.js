var express = require('express');
var router = express.Router();
const mongodb =  require("mongodb");
const { createEmbeddings} = require('./embeddings');
const fs = require('fs')
const db = require('dotenv').config()


var PDFParser = require('pdf2json')
const parser = new PDFParser(this, 1)
const DB = "mongodb+srv://Nattu:dEGBZBiEpR3Xyr0k@cluster0.0yeuk36.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

/* GET home page. */
router.get('/', async function(req, res, next) {
  try{
    console.log("inside try")
    const connection =await  mongodb.MongoClient.connect(DB);
    console.log(process.env.DB);
    const db = connection.db("rag_doc");
    const collection = db.collection("docs");
    await collection.insertOne({test: "Success"})
    await connection.close();
    res.json( { title: 'Express' });
  } catch(error){
    console.log(error);
  }
});

router.post("/load-document", async(req, res) => {
  try{
    parser.loadPDF("./docs/ajithkumar.pdf");
    parser.on("pdfParser_dataReady",async(data) => {
      await fs.writeFileSync("./context.txt", parser.getRawTextContent())
      const content = await fs.readFileSync("./context.txt","utf-8");
      const splitContent = content.split("\n");
      const connection =await  mongodb.MongoClient.connect(process.env.DB);
      const db = connection.db("rag_doc");
      const collection = db.collection("demo");

      for(line of splitContent){
        const embedings = await createEmbeddings(line);
        console.log("embedded content: ", embedings);
        await collection.insertOne({
          text : line,
          // embeddings : embedings.data[0].embeding
          embeddings : embedings
        })
      }
      await connection.close();
      
    })
    res.json("Done")

  }
  catch(error){
    console.log(error)
    res.json(500).json({message: "Error"})

  }
})





router.get('/embeddings', async(req,res) => {
  try{
    const embeddings = await createEmbeddings("This is nattu !");
    res.json(embeddings);


  }
  catch(error){
      console.log(error);
      res.status
  }
}) 


module.exports = router;
