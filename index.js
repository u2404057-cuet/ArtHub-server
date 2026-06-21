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
    // await client.connect();
    const db = client.db("ArtHub");
    const artCollection = db.collection("arts");

    app.get("/arts", async (req, res) => {
      const { search, category, minPrice, maxPrice, sortBy, page, limit } = req.query;

      let result = await artCollection.find().toArray();

      if (category && category !== "all" && category.trim() !== "") {
        result = result.filter(
          (art) =>
            art.category &&
            art.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (search && search.trim() !== "") {
        const searchKeyword = search.toLowerCase();
        result = result.filter(
          (art) =>
            (art.title && art.title.toLowerCase().includes(searchKeyword)) ||
            (art.artistName &&
              art.artistName.toLowerCase().includes(searchKeyword))
        );
      }

      if (minPrice) {
        result = result.filter((art) => art.price >= Number(minPrice));
      }
      if (maxPrice) {
        result = result.filter((art) => art.price <= Number(maxPrice));
      }

      if (sortBy === "newest") {
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === "price-asc") {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc") {
        result.sort((a, b) => b.price - a.price);
      }

      if (page) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 9;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        
        const paginatedResult = result.slice(startIndex, endIndex);
        res.send({
          artworks: paginatedResult,
          currentPage: pageNum,
          totalPages: Math.ceil(result.length / limitNum),
          totalItems: result.length
        });
      } else {
        res.send(result);
      }
    });

    app.get("/arts/:artId", async (req, res) => {
      const artId = req.params.artId;
      const query = {
        _id: new ObjectId(artId),
      };
      const art = await artCollection.findOne(query);
      res.send(art);
    });

    app.post("/arts", async (req, res) => {
      const art = req.body;
      const result = await artCollection.insertOne(art);
      res.send(result);
    });

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

      const artistArts = await artCollection
        .find({
          $or: [{ artistEmail: email }, { artistId: artistId || "" }],
        })
        .toArray();

      const artistArtsMap = {};
      artistArts.forEach((art) => {
        const idStr = art._id.toString();
        artistArtsMap[idStr] = art;
      });

      const userCollection = db.collection("user");
      const users = await userCollection
        .find({
          purchased_arts: { $exists: true, $not: { $size: 0 } },
        })
        .toArray();

      const salesHistory = [];
      users.forEach((user) => {
        const purchasedArts = user.purchased_arts || [];
        purchasedArts.forEach((artId) => {
          if (artId && artistArtsMap[artId]) {
            const artwork = artistArtsMap[artId];
            salesHistory.push({
              id: `${user._id}_${artId}`,
              title: artwork.title,
              buyerName: user.name || "Anonymous Buyer",
              buyerEmail: user.email,
              purchaseDate: user.updatedAt
                ? new Date(user.updatedAt).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              amount: artwork.price,
            });
          }
        });
      });

      salesHistory.sort(
        (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)
      );
      res.send({ salesHistory });
    });

    app.get("/admin/users", async (req, res) => {
      const userCollection = db.collection("user");
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.put("/admin/users/:userId/role", async (req, res) => {
      const userId = req.params.userId;
      const { role } = req.body;
      const userCollection = db.collection("user");
      let query = {};
      try {
        query._id = new ObjectId(userId);
      } catch (e) {
        query._id = userId;
      }
      const result = await userCollection.updateOne(query, { $set: { role } });
      res.send(result);
    });


    app.get("/admin/transactions", async (req, res) => {
      const userCollection = db.collection("user");
      const users = await userCollection.find().toArray();
      const arts = await artCollection.find().toArray();

      const artsMap = {};
      arts.forEach((art) => {
        artsMap[art._id.toString()] = art;
      });

      const transactions = [];

      users.forEach((user) => {
        // 1. Subscription Transaction
        const plan = (user.plan || "free").toLowerCase();
        if (plan !== "free") {
          const amount = plan === "premium" ? 19.99 : 9.99;
          transactions.push({
            id: `sub_${user._id}`,
            type: "subscription",
            email: user.email,
            amount: amount,
            date: user.updatedAt
              ? new Date(user.updatedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          });
        }

        // 2. Artwork Purchases Transactions
        const purchased = user.purchased_arts || [];
        purchased.forEach((artId, idx) => {
          if (artId && artsMap[artId]) {
            const art = artsMap[artId];
            transactions.push({
              id: `pur_${user._id}_${artId}_${idx}`,
              type: "purchase",
              email: user.email,
              amount: art.price || 0,
              date: user.updatedAt
                ? new Date(user.updatedAt).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            });
          }
        });
      });

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.send(transactions);
    });

    app.get("/admin/analytics", async (req, res) => {
      const userCollection = db.collection("user");
      const users = await userCollection.find().toArray();
      const arts = await artCollection.find().toArray();

      const artsMap = {};
      arts.forEach((art) => {
        artsMap[art._id.toString()] = art;
      });

      let totalUsers = users.length;
      let totalArtists = users.filter((u) => u.role === "artist").length;

      let totalArtworksSold = 0;
      let totalRevenue = 0;

      const categoryCounts = {};
      const dailySales = {}; // date -> revenue

      users.forEach((user) => {
        // Subscription revenue
        const plan = (user.plan || "free").toLowerCase();
        if (plan !== "free") {
          const subAmount = plan === "premium" ? 19.99 : 9.99;
          totalRevenue += subAmount;

          const dateKey = user.updatedAt
            ? new Date(user.updatedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          dailySales[dateKey] = (dailySales[dateKey] || 0) + subAmount;
        }

        const purchased = user.purchased_arts || [];
        purchased.forEach((artId) => {
          if (artId && artsMap[artId]) {
            const art = artsMap[artId];
            totalArtworksSold += 1;
            totalRevenue += art.price || 0;

            // Category counts
            const cat = art.category || "Mixed Media";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

            // Sales chart
            const dateKey = user.updatedAt
              ? new Date(user.updatedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0];
            dailySales[dateKey] = (dailySales[dateKey] || 0) + (art.price || 0);
          }
        });
      });

      // Format charts data
      const categoryData = Object.keys(categoryCounts).map((cat) => ({
        name: cat,
        value: categoryCounts[cat],
      }));

      const salesData = Object.keys(dailySales)
        .map((date) => ({
          date: date,
          revenue: Number(dailySales[date].toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      res.send({
        analytics: {
          totalUsers,
          totalArtists,
          totalArtworksSold,
          totalRevenue: Number(totalRevenue.toFixed(2)),
        },
        charts: {
          salesData,
          categoryData,
        },
      });
    });

    // await client.db("admin").command({ ping: 1 });
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
