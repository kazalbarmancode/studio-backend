import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

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


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ msg: "Unauthorized! No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CAT_HARRY_CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    
    req.user = payload; 

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).send({ msg: "Unauthorized! Invalid token." });
  }
};
app.post("/studioData", verifyToken, async (req, res) => {
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
app.delete("/studioData/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid ID format" });
    }

    const studio = await featuredCollections.findOne({ _id: new ObjectId(id) });

    if (!studio) {
      return res.status(404).send({ success: false, message: "Studio not found" });
    }

    const userEmail = req.user?.email;
    if (studio.ownerEmail !== userEmail) {
      return res.status(403).send({
        success: false,
        message: "Forbidden! You can only delete your own studio listing.",
      });
    }

    const result = await featuredCollections.deleteOne({ _id: new ObjectId(id) });

    res.send({
      success: true,
      deletedCount: result.deletedCount,
      message: "Studio deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting studio:", error);
    res.status(500).send({ success: false, error: "Failed to delete studio" });
  }
});
app.patch("/studioData/:id",verifyToken, async (req, res) => {
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
    res.status(500).send({
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
      query = { category: { $regex: new RegExp(`^${category}$`, "i") } };
    }

    const result = await featuredCollections.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch studios" });
  }
});

app.get("/studioData/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (ObjectId.isValid(id)) {
      query = {
        $or: [{ _id: id }, { _id: new ObjectId(id) }],
      };
    } else {
      query = { _id: id };
    }

    const result = await featuredCollections.findOne(query);
    console.log("Database query result:", result);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Studio not found" });
    }

    res.send(result);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send({ error: "Server error" });
  }
});
app.get("/catagory", async (req, res) => {
  const result = await catagoryCollections.find().toArray();
  res.send(result);
});
app.post("/booking", verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).send({ success: false, message: "Unauthorized user!" });
    }

   

    const newBooking = {
      ...data,
      userEmail: userEmail, 
      status: "Confirmed",
      createdAt: new Date(),
    };

    const result = await bookingCollection.insertOne(newBooking);

    res.send({
      success: true,
      insertedId: result.insertedId,
      message: "Studio booked successfully!",
    });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).send({ success: false, error: "Failed to create booking" });
  }
});
app.get("/my-bookings/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookingCollection.find({ userEmail: email }).toArray();
  res.send(result);
});
app.delete("/my-bookings/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInEmail = req.user?.email; 

    const booking = await bookingCollection.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return res.status(404).send({ success: false, message: "Booking not found" });
    }

    console.log("Logged-in User Email from Token:", loggedInEmail);
    console.log("Booking Doc Email Fields:", {
      userEmail: booking.userEmail,
      email: booking.email,
      allBookingData: booking
    });

    const bookingOwnerEmail = booking.userEmail || booking.email;

    if (bookingOwnerEmail !== loggedInEmail) {
      return res.status(403).send({
        success: false,
        message: "Forbidden! You can only delete your own bookings.",
      });
    }

    const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });

    res.send({
      success: true,
      deletedCount: result.deletedCount,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).send({ success: false, error: "Failed to delete booking" });
  }
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
