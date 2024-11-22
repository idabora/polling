const { kafka } = require('./client');

async function createPollTopic(pollId, numOptions) {
    const admin = kafka.admin();

    await admin.connect();
    console.log(`Admin connected for topic creation: Poll ID ${pollId}`);

    const topicName = `poll_${pollId}`;

    await admin.createTopics({
        topics: [
            {
                topic: topicName,
                numPartitions: numOptions,
                replicationFactor: 1, 
            },
        ],
    });

    console.log(`Topic created: ${topicName} with ${numOptions} partitions`);
    await admin.disconnect();
}
createPollTopic(process.argv[2],4)
