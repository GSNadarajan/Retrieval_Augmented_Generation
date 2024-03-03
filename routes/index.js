var express = require('express');
var router = express.Router();
const mongodb =  require("mongodb")

/* GET home page. */
router.get('/', async function(req, res, next) {
  try{
    const connection =await  mongodb.MongoClient.connect(process.env.DB);
    const db = connection.db("rag_doc");
    const collection = db.collection("docs");
    await collection.insertOne({test: "Success"})
    await connection.close();
    res.json( { title: 'Express' });
  } catch(error){
    console.log(error);
  }
});

module.exports = router;
