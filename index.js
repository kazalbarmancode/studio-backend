import express from "express";
import 'dotenv/config' 


import cors from 'cors'
import { MongoClient } from "mongodb";
const app = express();

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT||5000;

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


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`server run succecfully in ${PORT}`);
});