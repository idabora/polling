const { kafka } = require("./client");

async function consumePollVotes(groupId) {
    const consumer = kafka.consumer({ groupId: groupId });
    await consumer.connect();

    await consumer.subscribe({ topics: [`poll_${groupId}`], fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { question, text } = JSON.parse(message.value.toString());

            console.log(`GroupId:${groupId}, Topic:${question} voted:${text} Partiton:${partition}:`);
        },
    });
}

const pollId = process.argv[2];
if (!pollId) {
    console.error("Poll ID is required to start the consumer.");
    process.exit(1);
}

consumePollVotes(pollId);