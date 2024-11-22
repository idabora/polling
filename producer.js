const { kafka } = require('./client');
const Leaderboard = require('./models/leaderboard')
const Poll = require('./models/poll');
const { io } = require('./server')
async function castVote(pollId, optionIndex, question, text, userId) {
    const producer = kafka.producer();

    await producer.connect();
    console.log("PRODUCER-", io);
    console.log(`Casting vote for Poll ID ${pollId}, Option ${optionIndex} Option text - ${text}`);
    const poll = await Poll.findById(pollId);
    console.log("****&&&&", poll)

    const option = poll.options.find((o) => o.id === optionIndex);

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
        // Update the leaderboard 
        const leaderboard = await Leaderboard.findByIdAndUpdate(
            { _id: userId },
            { votesCast: max, username: `User_${userId}`, question, text: text },
            // { $inc: { votesCast: 1 }, username: `User_${userId}`,question ,text},
            { upsert: true, new: true }
        );

        // Broadcast updated poll and leaderboard to all clients
        await producer.send({
            topic: `poll_${pollId}`,
            messages: [{ value: JSON.stringify({ pollId, optionIndex: optionIndex, question: question, text: text }) }],
        });
        // console.log("leaderboard",leaderboard);
        // io.emit("poll_updated", poll);
        // io.emit("leaderboard_updated", leaderboard);
        console.log(`Vote cast to topic ${text}, partition ${optionIndex}`);
        await producer.disconnect();
        return { updatedPoll: poll, updatedLeaderboard: leaderboard };

    }
}

module.exports = { castVote };
