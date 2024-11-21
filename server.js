const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require('path')

// Models
const Poll = require("./models/Poll");
const Leaderboard = require("./models/Leaderboard");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

const staticPath = path.join(__dirname, './public');
app.use(express.static(staticPath));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// WebSocket Events
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Listen for the vote event with userId included
    socket.on("cast_vote", async ({ pollId, optionId, userId, question, text }) => {
        try {
            const poll = await Poll.findById(pollId);
            console.log("****&&&&", poll)

            // console.log("MAX",max);
            const option = poll.options.find((o) => o.id === optionId);

            if (option) {
                option.votes++;
                await poll.save();

                let arr = poll.options.map(o => o.votes)
                let max = arr.reduce((max, current) => {
                    return current > max ? current : max;
                }, 0);
                console.log(poll.options);
                let opt = poll.options.filter(o => o.votes === max)
                console.log("MAX-", max, opt);
                const text = opt.length > 1
                    ? opt.map(option => option.text).join(", ")
                    : opt[0]?.text || "";
                // Update the leaderboard (optional: track votes cast by each userId)
                const leaderboard = await Leaderboard.findByIdAndUpdate(
                    { _id: userId },
                    { votesCast: max, username: `User_${userId}`, question, text },
                    // { $inc: { votesCast: 1 }, username: `User_${userId}`,question ,text},
                    { upsert: true, new: true }
                );

                // let lb = await Leaderboard.findByIdAndUpdate(
                // { _id: userId });
                // Broadcast updated poll and leaderboard to all clients
                io.emit("poll_updated", poll);
                io.emit("leaderboard_updated", leaderboard);
            }
        } catch (error) {
            console.error("Error casting vote:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})


// REST API Endpoints
app.get("/polls", async (req, res) => {
    try {
        const polls = await Poll.find();
        res.json(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
        res.status(500).send("Error fetching polls.");
    }
});

// Add a POST route to create a new poll
app.post("/polls", async (req, res) => {
    const { question, options } = req.body;

    // Validate that there is a question and at least 2 options
    if (!question || options.length < 2) {
        return res.status(400).send("Question and at least two options are required.");
    }

    try {
        const newPoll = new Poll({
            question,
            options: options.map((text, index) => ({
                text,
                votes: 0,
                id: `option_${index + 1}`
            }))
        });

        await newPoll.save();
        res.status(201).json(newPoll);

        // Emit the new poll to all connected clients via WebSocket
        io.emit("new_poll", newPoll);
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).send("Error creating poll.");
    }
});

// Fetch and return the leaderboard data
app.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Leaderboard.find().sort({ votesCast: -1 }).lean();
        console.log("Leaderboard data:", leaderboard);
        res.json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).send("Error fetching leaderboard.");
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
