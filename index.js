import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
if (!process.env.MONGO_DB_URL) {
  console.error("CRITICAL ERROR: MONGO_DB_URL is not defined in environment variables!");
}

const client = new MongoClient(process.env.MONGO_DB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("studio-store");
const featuredCollections = db.collection("featured");
const catagoryCollections = db.collection("catagory");
const bookingCollections = db.collection("how_it_works");
const guaranteeCollection = db.collection("host_guarantee");



app.get("/host_guarantee", async (req, res) => {
  try {
    const result = await guaranteeCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching host guarantee data:", error);
    res.status(500).send({ error: "Failed to fetch host guarantee data" });
  }
});

app.get("/how_it_works", async (req, res) => {
  const result = await bookingCollections.find().toArray();
  res.send(result);
});

app.get("/featureds", async (req, res) => {
  const result = await featuredCollections.find().limit(6).toArray();
  res.send(result);
});

app.get("/allFeatureds", async (req, res) => {
  try {
    const category = req.query.category;
    let query = {};

    if (category) {
      query = { category: { $regex: category, $options: "i" } };
    }

    const result = await featuredCollections.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch studios" });
  }
});

app.get("/featureds/:id", async (req, res) => {
  const { id } = req.params;
  const result = await featuredCollections.findOne({ _id: id });
  res.send(result);
});
app.get("/catagory", async (req, res) => {
  const result = await catagoryCollections.find().toArray();
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`server run succecfully in ${PORT}`);
});
