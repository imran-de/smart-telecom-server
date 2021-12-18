const express = require('express')
const app = express()
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const cors = require('cors');
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

const serviceAccount = require('./smart-telecom10.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function verifyToken(req, res, next) {
  if (req?.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];

    try {
      const decodeUser = await admin.auth().verifyIdToken(token);
      req.decodedEamil = decodeUser.email;
    }
    catch {

    }
  }

  next();
}

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xffah.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    const database = client.db('smartTelecom');
    const ordersCollection = database.collection('orders');
    const usersCollection = database.collection('users');
    const productsCollection = database.collection('products');
    const discountCollection = database.collection('discountCollection');
    const reviewCollection = database.collection('reviewCollection');

    //GET PRODUCTS API
    app.get('/products-collection', async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });


    //GET ORDERS COLLECTION API
    app.get('/orders-collection', async (req, res) => {
      const cursor = ordersCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
    

    //DELETE SINGLE PRODUCTS
    app.delete('/orders-collection/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    })


    //GET DISCOUNT PRODUCTS API
    app.get('/discounts-collection', async (req, res) => {
      const cursor = discountCollection.find({});
      const discount = await cursor.toArray();
      res.send(discount);
    });


    //ADD NEW PRODUCTS
    app.post('/products-collection', async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);
      res.json(result);
    })


    //POST API FOR USERS
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });


    //POST API FOR REVIEW COLLECTION
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      console.log(review)
      const result = await reviewCollection.insertOne(review);
      console.log(result);
      res.json(result);
    });


    //GET API FOR REVIEW COLLECTION
    app.get('/reviews', async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });


    //GET API USING EMAIL AND DATE
    app.get('/orders', async (req, res) => {
      const date = new Date(req.query.date).toLocaleDateString();
      const email = req.query.email;
      const query = { email: email, date: date };
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    })


    //GET ALL ORDERS API
    app.get('/orders', async (req, res) => {
      const cursor = ordersCollection.find({});
      const allOrders = await cursor.toArray();
      res.send(allOrders);
    });


    //POST API
    app.post('/orders', async (req, res) => {
      const receiveOrder = req.body;
      console.log(receiveOrder)
      const result = await ordersCollection.insertOne(receiveOrder);
      res.json(result);
    });


    //GET API USING EMAIL PARAM
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      };
      res.json({ admin: isAdmin })
    });


    //PUT API FOR USERS
    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });


    //PUT API FOR ADMIN
    app.put('/users/admin', verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEamil;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: 'admin' } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      }
      else {
        res.status(403).json({ message: 'You do not have access to make admin' });
      }
    });

  }
  finally {
    // await client.close();
  }
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Telecom..');
});

app.listen(port, () => {
  console.log(`Listening at: ${port}`)
});