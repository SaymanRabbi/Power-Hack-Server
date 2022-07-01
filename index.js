const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const uri = `mongodb+srv://power_hack:${process.env.DB_PASS}@cluster0.pcf8i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyidentity(req,res,next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
     return res.status(401).send({messages:"Unauthorized access"})
  }
  const authtoken = authHeader.split(' ')[1]

   jwt.verify(authtoken,process.env.ACCESS_TOKEN,function(err, decoded) {
       if (err) {
          return res.status(403).send({messages:"Forbiden"})
       }
       req.decoded = decoded;
       next()
    })
  
}
async function run() {
    try {
      const database = client.db('usercollection').collection('user')
      const login = client.db('loginCollection').collection('login')
        await client.connect();
        // ============post data==============
        app.post('/add-billing', async (req, res) => {
            const data = req.body;
            const result = await database.insertOne(data)
            res.send({messages:'success'})
        })
        // ===================get data==================
        app.get('/billing-list',verifyidentity, async (req, res) => {
            const data = await database.find({}).toArray()
            res.send(data)
        })
        // ==========delete data==============
        app.delete('/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await database.deleteOne(filter)
            res.send(result)
        })
      // ================get data================
      app.get('/update-billing/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const result = await database.findOne(filter)
        if (result) {
          res.send(result)
        }
        else {
          res.send({messages:'error'})
        }
})
     
// ===============update======================
        app.put('/update-billing/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id)};
        const options = { upsert: true };
        const value = req.body
        const updateDoc = {
          $set: {
                name: value.name,
                email: value.email,
                number: value.number,
                amount:value.amount

          },
        };
        const result = await database.updateOne(filter, updateDoc, options);
        res.send({success:result})
        })
      // =======authentication=================
      app.post('/registration', async (req, res) => {
        const data = req.body;
        const email = data.email
        const exits = await login.findOne({ email })
        if (exits) {
          return res.send({messages:'Error'})
        }
        const result = await login.insertOne(data)
            res.send({messages:'success',result})
      })
      app.get('/login/:id', async (req, res) => {
        const email = req.params.id;
        const result = await login.findOne({ email })
        if (result) {
          res.send(result)
        }
        else {
          res.send({messages:'error'})
        }
       
      })
      // =========jwt=========
      app.post('/token', async (req, res) => {
        const email = req.query.email;
        const createToken = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
            expiresIn:'1d'
        })
        res.send({createToken})
      })
      
    } finally {
    //   await client.close();
    }
  }
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})