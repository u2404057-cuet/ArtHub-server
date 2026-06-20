const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
    try {
        
        await client.connect();
        const db = client.db("ArtHub");
        const artCollection = db.collection("arts");

    app.get("/arts", async (req, res) => {
        const cursor = artCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get("/arts/:artId", async (req,res) => {
        const artId = req.params.artId;
        const query = {
            _id : new ObjectId(artId)
        }
        const art = await artCollection.findOne(query);
        res.send(art);
    })

    app.post("/arts", async (req, res) => {
        const art = req.body;
        const result = await artCollection.insertOne(art);
        res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is working");
});

app.listen(port, () => {
  console.log(`Server is running is port ${port}`);
});
