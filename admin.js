const { kafka } = require('./client');

async function createPollTopic(pollId, numOptions) {
    const admin = kafka.admin();

    await admin.connect();
    console.log(`Admin connected for topic creation: Poll ID ${pollId}`);

    const topicName = `poll_${pollId}`;

    // Create topic with partitions equal to the number of options
    await admin.createTopics({
        topics: [
            {
                topic: topicName,
                numPartitions: numOptions, // Number of partitions = number of options
                replicationFactor: 1, // Adjust based on your Kafka cluster
            },
        ],
    });

    console.log(`Topic created: ${topicName} with ${numOptions} partitions`);
    await admin.disconnect();
}

module.exports = { createPollTopic };
