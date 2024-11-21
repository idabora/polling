const { Kafka } = require('kafkajs');

module.exports.kafka = new Kafka({
    clentId: "polling_application",
    brokers: ["192.168.29.207:9092"]
})