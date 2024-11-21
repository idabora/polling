const { kafka } = require('./client');

async function castVote(pollId, optionIndex, voteData) {
    const producer = kafka.producer();

    await producer.connect();

    const topicName = `poll_${pollId}`;
    console.log(`Casting vote for Poll ID ${pollId}, Option ${optionIndex}`);

    await producer.send({
        topic: topicName,
        messages: [
            {
                partition: optionIndex, // Send to the partition corresponding to the option
                value: JSON.stringify(voteData),
            },
        ],
    });

    console.log(`Vote cast to topic ${topicName}, partition ${optionIndex}`);
    await producer.disconnect();
}

module.exports = { castVote };
