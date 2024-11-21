const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // User ID
    username: { type: String, required: true },
    votesCast: { type: Number, default: 0 },
    text:{type:String,required:true},
    question:{type:String,required:true}
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
