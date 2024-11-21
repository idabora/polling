const { kafka } = require('./client')

async function adminFunc() {
    const admin = kafka.admin();
    console.log("Admin created successfully...");

    await admin.createTopics({
        topics: [
            {
                topic: "gogogo",
                numPartitions: 2,
            }
        ]
    });

    await admin.disconnect();
    console.log("Admin is dicsonnected....");

}

adminFunc();