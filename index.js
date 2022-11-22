const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hjhvnge.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verifyJWT token
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send([{ message: "Unauthorized access" }]);
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send([{ message: "Unauthorized access" }]);
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  const services = client.db("photoData").collection("service");
  const reviews = client.db("photoData").collection("review");
  const myServices = client.db("photoData").collection("myService");

  try {
    // Home page Get Data
    app.get("/", async (req, res) => {
      const query = {};
      const result = await services
        .find(query)
        .sort({ date: -1 })
        .limit(3)
        .toArray();
      res.send(result);
    });

    // Service Page Get Data
    app.get("/services", async (req, res) => {
      const query = {};
      const result = await services.find(query).toArray();
      res.send(result);
    });

    // Details Get Data
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await services.findOne(query);
      res.send(result);
    });

    // Post Review
    app.post("/review", async (req, res) => {
      const query = req.body;
      query.date = new Date();
      const result = await reviews.insertOne(query);
      res.send(result);
    });

    // Get Review By Service Name
    app.get("/reviews/:name", async (req, res) => {
      const title = req.params.name;
      const query = { title };
      const result = await reviews.find(query).sort({ date: -1 }).toArray();
      res.send(result);
    });

    // Get Review By Service id
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviews.find(query).toArray();
      res.send(result);
    });

    // Get My Reviews
    app.get("/myreviews/:email", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.params.email) {
        return res.status(401).send([{ message: "Unauthorized access" }]);
      }
      let query = {};
      if (req.params.email) {
        query = {
          userEmail: req.params.email,
        };
      }
      const result = await reviews.find(query).sort({ date: -1 }).toArray();
      res.send(result);
    });

    // Delete Review
    app.delete("/reviewdelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviews.deleteOne(query);
      res.send(result);
    });

    // Create JWT token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Add My Service
    app.post("/myservice", async (req, res) => {
      const query = req.body;
      query.date = new Date();
      const result = await services.insertOne(query);
      res.send(result);
    });

    // app.get("/myservice/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const result = await myServices.find(query).toArray();
    //   res.send(result);
    // });

    // Update My Review
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const update = req.body.review;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          review: update,
        },
      };
      const result = await reviews.updateOne(query, updatedDoc);
      res.send(result);
    });
  } catch {
    (error) => console.log(error.message);
  }
}
run();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
