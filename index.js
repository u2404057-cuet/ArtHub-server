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

    app.put("/arts/:artId", async (req, res) => {
        const artId = req.params.artId;
        const filter = { _id: new ObjectId(artId) };
        const updatedArt = req.body;
        const updateDoc = {
            $set: {
                title: updatedArt.title,
                description: updatedArt.description,
                price: Number(updatedArt.price),
                category: updatedArt.category,
                imageUrl: updatedArt.imageUrl,
            },
        };
        const result = await artCollection.updateOne(filter, updateDoc);
        res.send(result);
    });

    app.delete("/arts/:artId", async (req, res) => {
        const artId = req.params.artId;
        const query = { _id: new ObjectId(artId) };
        const result = await artCollection.deleteOne(query);
        res.send(result);
    });

    app.get("/artist-sales", async (req, res) => {
        const { email, artistId } = req.query;
        if (!email) {
            return res.status(400).send({ error: "Artist email is required" });
        }
        
        // Get all arts matching this artist
        const artistArts = await artCollection.find({
            $or: [
                { artistEmail: email },
                { artistId: artistId || "" }
            ]
        }).toArray();

        const artistArtsMap = {};
        artistArts.forEach(art => {
            const idStr = art._id.toString();
            artistArtsMap[idStr] = art;
        });

        const userCollection = db.collection("user");
        const users = await userCollection.find({ 
            purchased_arts: { $exists: true, $not: { $size: 0 } } 
        }).toArray();

        const salesHistory = [];
        users.forEach(user => {
            const purchasedArts = user.purchased_arts || [];
            purchasedArts.forEach(artId => {
                if (artId && artistArtsMap[artId]) {
                    const artwork = artistArtsMap[artId];
                    salesHistory.push({
                        id: `${user._id}_${artId}`,
                        title: artwork.title,
                        buyerName: user.name || "Anonymous Buyer",
                        buyerEmail: user.email,
                        purchaseDate: user.updatedAt ? new Date(user.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        amount: artwork.price,
                    });
                }
            });
        });

        salesHistory.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        res.send({ salesHistory });
    });



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
