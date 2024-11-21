const { kafka } = require("./client");
const Poll = require("./models/Poll");
const Leaderboard = require("./models/Leaderboard");

async function consumePollVotes(pollId) {
    const consumer = kafka.consumer({ groupId: `poll_${pollId}_group` });

    await consumer.connect();
    await consumer.subscribe({ topic: `poll_${pollId}`, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { userId, optionId } = JSON.parse(message.value.toString());

            try {
                // Find poll and update votes
                const poll = await Poll.findById(pollId);
                const option = poll.options.find((o) => o.id === optionId);

                if (option) {
                    option.votes++;
                    await poll.save();

                    // Find the winning option(s)
                    const maxVotes = Math.max(...poll.options.map((o) => o.votes));
                    const winningOptions = poll.options
                        .filter((o) => o.votes === maxVotes)
                        .map((o) => o.text);

                    // Update leaderboard
                    await Leaderboard.findByIdAndUpdate(
                        { _id: userId },
                        {
                            $set: { username: `User_${userId}`, question: poll.question, text: winningOptions.join(", ") },
                            $inc: { votesCast: 1 },
                        },
                        { upsert: true, new: true }
                    );

                    console.log(`Vote processed for poll ${pollId}: User ${userId}, Option ${option.text}`);

                    // Emit updates to all clients
                    io.emit("poll_updated", poll);
                    io.emit("leaderboard_updated", await Leaderboard.find().sort({ votesCast: -1 }).lean());
                }
            } catch (error) {
                console.error("Error processing vote:", error);
            }
        },
    });
}

// Start consuming votes for a specific poll
consumePollVotes("your_poll_id_here");
