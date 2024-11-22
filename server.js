const express = require("express");
const http = require("http");
require('./connection/connection')
const { Server } = require("socket.io");
const cors = require("cors");
const path = require('path');
const { kafka } = require("./client"); 
const { castVote } = require('./producer')

// Models
const Poll = require("./models/poll");
const Leaderboard = require("./models/leaderboard");

const producer = kafka.producer();
producer.connect();


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

const staticPath = path.join(__dirname, './public');
app.use(express.static(staticPath));

// WebSocket Events
io.on("connection", (socket) => {
    socket.on("cast_vote", async ({ pollId, optionId, question, text, userId }) => {
        try {
            const { updatedPoll, updatedLeaderboard } = await castVote(pollId, optionId, question, text, userId);
            io.emit("poll_updated", updatedPoll);
            io.emit("leaderboard_updated", updatedLeaderboard);

        } catch (error) {
            console.error("Error producing vote:", error);
        }
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

        // io.emit("new_poll", newPoll);
    } catch (error) {
        console.error("Error creating poll:", error);
        res.status(500).send("Error creating poll.");
    }
});

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

module.exports = { io };
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
