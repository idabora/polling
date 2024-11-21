const { Partitioners } = require('kafkajs');
const { kafka } = require('./client');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function producerFunc() {
    const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner })

    await producer.connect();

    rl.setPrompt("> ");
    rl.prompt();

    rl.on('line', async function (line) {
        const [riderName, location] = line.split(" ");
        console.log("*************",location);
        await producer.send({
            topic: 'gogogo',
            messages: [
                {
                    partition: location.toLowerCase() === 'north'?0:1,
                    key: 'location-update',
                    value: JSON.stringify({ name: riderName, location })
                }
            ]
        });
    }).on('close', async () => {
        
        await producer.disconnect();
    })

}

producerFunc();