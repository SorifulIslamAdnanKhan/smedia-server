const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
require('dotenv').config();

const port = process.env.PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3aa5vlu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {

        // Database Collections
        const postCollection = client.db("smedia").collection("post");
        const userCollection = client.db("smedia").collection("user");


        // Post API

        app.post('/post', async (req, res) => {
            const post = req.body;
            console.log(post);
            const result = await postCollection.insertOne(post);
            res.send(result);
        });

        app.get('/post', async (req, res) => {
            const query = {};
            const posts = await postCollection.find(query).toArray();
            res.send(posts);
        });

        app.get('/post/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await postCollection.findOne(query);
            res.send(result)
        })


        // User API

        app.post('/user', async (req, res) => {
            const user = req.body;
            const exist = await userCollection.findOne({ email: user.email });
            if (exist) {
                return res.send({ status: 0, message: 'User already exist.' })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: { $regex: new RegExp(email, 'i') } };
            const user = await userCollection.findOne(query);
            res.send(user);
        });

        // app.patch('/user/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     console.log(req.body);
        //     const name = req.body.name;
        //     const email = req.body.email;
        //     const address = req.body.address;
        //     const university = req.body.university;
        //     const updatedDoc = {
        //         $set: {
        //             name: name,
        //             email: email,
        //             address: address,
        //             university: university
        //         }
        //     }
        //     const result = await userCollection.updateOne(query, updatedDoc);
        //     res.send(result);
        // })

        app.patch('/user/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };

                // Get the fields to update from the request body
                const { name, email, address, university } = req.body;

                const updatedFields = {};
                if (name) updatedFields.name = name;
                if (email) updatedFields.email = email;
                if (address) updatedFields.address = address;
                if (university) updatedFields.university = university;

                const updatedDoc = {
                    $set: updatedFields,
                };

                const result = await userCollection.updateOne(query, updatedDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }

                res.json({ message: 'User updated successfully' });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });


        // POST /api/posts/:postId/like
        app.post('/post/:postId/like', async (req, res) => {
            const postId = req.params.postId;
            const userId = req.user.id; // Assuming you have user authentication middleware

            try {
                const db = client.db('your-database-name'); // Update with your database name
                const postsCollection = db.collection('posts'); // Update with your posts collection name

                const post = await postsCollection.findOne({ _id: ObjectId(postId) });

                if (!post) {
                    return res.status(404).json({ error: 'Post not found' });
                }

                // Check if the user has already liked the post
                const alreadyLiked = post.likes.includes(userId);

                if (alreadyLiked) {
                    // User has already liked the post, so unlike it
                    post.likes = post.likes.filter((like) => like !== userId);
                } else {
                    // User hasn't liked the post, so like it
                    post.likes.push(userId);
                }

                // Update the likes count in the post document
                post.likesCount = post.likes.length;

                // Update the post in the database
                await postsCollection.updateOne({ _id: ObjectId(postId) }, { $set: post });

                res.status(200).json({ likesCount: post.likesCount });
            } catch (error) {
                console.error('Error liking/unliking post:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    } finally {

    }
}
run().catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('SMedia Server Running..')
});

app.listen(port, () => {
    console.log(`SMedia Server Running on Port ${port}`);
});