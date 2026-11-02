import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

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
const bookingCollection = db.collection("bookings");


app.post("/studioData", async (req, res) => {
  try {
    const studioData = req.body;
    const newStudio = {
      ...studioData,
      createdAt: new Date(),
    };

    const result = await featuredCollections.insertOne(newStudio);

    res.status(200).json({
      success: true,
      insertedId: result.insertedId,
      message: "Studio added successfully!",
    });
  } catch (error) {
    console.error("Database Insert Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.get("/studioData/email", async (req, res) => {
  const email = req.query.email;
  const query = { ownerEmail: { $regex: new RegExp(`^${email}$`, "i") } };
  const result = await featuredCollections.find(query).toArray();
  res.send(result);
});

app.delete("/studioData/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await featuredCollections.deleteOne(query);

    if (result.deletedCount > 0) {
      res.send({
        success: true,
        deletedCount: result.deletedCount,
        message: "Studio deleted successfully",
      });
    } else {
      res.status(404).send({ success: false, message: "Studio not found" });
    }
  } catch (error) {
    console.error("Error deleting studio:", error);
    res.status(500).send({ error: "Failed to delete studio" });
  }
});
app.patch("/studioData/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid Studio ID format" });
    }

    const updatedData = req.body;

    delete updatedData._id;

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updatedData,
    };

    const result = await featuredCollections.updateOne(filter, updateDoc);

    res.send({ success: true, result });
  } catch (error) {
    console.error("CRITICAL BACKEND ERROR:", error);
    res
      .status(500)
      .send({
        success: false,
        message: error.message || "Failed to update studio",
      });
  }
});

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

app.get("/studioData", async (req, res) => {
  const result = await featuredCollections.find().limit(6).toArray();
  res.send(result);
});

app.get("/allStudioData", async (req, res) => {
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

app.get("/studioData/:id", async (req, res) => {
  const { id } = req.params;
  const result = await featuredCollections.findOne({ _id: id });
  res.send(result);
});
app.get("/catagory", async (req, res) => {
  const result = await catagoryCollections.find().toArray();
  res.send(result);
});
app.post("/booking", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});
app.get("/my-bookings/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookingCollection.find({ userEmail: email }).toArray();
  res.send(result);
});

app.delete("/my-bookings/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});
app.get("/", (req, res) => {
  res.send("Store Server Backend Running");
});

app.listen(PORT, () => {
  console.log(`server run succecfully in ${PORT}`);
});
export default (req, res) => {
  return app(req, res);
};
