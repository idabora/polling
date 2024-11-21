// Generate a unique user ID for each window or tab
let userId = localStorage.getItem('userId');
if (!userId) {
    // Generate a random user ID if none exists
    // userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    userId = '121'
    localStorage.setItem('userId', userId);  // Save it so that the same user ID is used across sessions/tabs
}

// Connect to the WebSocket server
const socket = io("http://localhost:3000");

// Get DOM elements for polls, leaderboard, and form
const pollsContainer = document.getElementById("polls-container");
const leaderboardContainer = document.getElementById("leaderboard");
const pollForm = document.getElementById("poll-form");
const questionInput = document.getElementById("question");
const optionsInput = document.getElementById("options");

// Fetch the polls from the backend
async function fetchPolls() {
    try {
        const response = await fetch("http://localhost:3000/polls");
        const polls = await response.json();
        displayPolls(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
    }
}

// Display polls in the HTML
function displayPolls(polls) {
    pollsContainer.innerHTML = polls.map((poll) => `
    <div class="poll">
      <h3>${poll.question}</h3>
      <div class="options">
        ${poll.options.map(option => `
          <button class="vote-button" onclick="castVote('${poll._id}', '${option.id}', '${poll.question}','${option.text}')">
            ${option.text} (${option.votes} votes)
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Display leaderboard data
function displayLeaderboard(leaderboard) {
    console.log("&&&&&&&&&&&&&&", Array.isArray(leaderboard));

    if (Array.isArray(leaderboard)) {
        leaderboard.map((event) => {
            leaderboardContainer.innerHTML =
                `<li>${event.question} Ans> ${event.text}: ${event.votesCast} votes</li>
        `;
        })
    } else {
        console.log("inside else",leaderboard);
        leaderboardContainer.innerHTML =
            `<li>${leaderboard.question} Ans> ${leaderboard.text}: ${leaderboard.votesCast} votes</li>
        `;
    }
}

// Cast a vote for a given poll and option
function castVote(pollId, optionId,question,text) {
    // Emit the vote to the server with the unique userId
    socket.emit("cast_vote", {
        pollId,
        optionId,
        userId: userId,
        question,
        text
    });
}

// Handle real-time updates for polls and leaderboard
socket.on("poll_updated", (updatedPoll) => {
    console.log("Poll updated:", updatedPoll);
    fetchPolls(); // Refresh polls when a vote is cast or poll is updated
});

// Handle real-time updates for polls and leaderboard
socket.on("leaderboard_updated", (updatedLeaderboard) => {
    console.log("Leaderboard updated:", updatedLeaderboard);
    // Assuming leaderboard is now an array, you can safely call map()
    // if (Array.isArray(updatedLeaderboard)) {
    displayLeaderboard(updatedLeaderboard);
    // } else {
    // console.error("Leaderboard is not an array");
    // }
});


// Handle form submission for creating a new poll
// Handle form submission for creating a new poll
pollForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value;
    const options = optionsInput.value.split(',').map(option => option.trim());

    if (!question || options.length < 2) {
        alert("Please enter a question and at least two options.");
        return;
    }

    try {
        // Send the new poll data to the server to create it
        const response = await fetch("http://localhost:3000/polls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, options })
        });

        const newPoll = await response.json();
        console.log("New poll created:", newPoll);

        // Emit the new poll to all connected clients via WebSocket
        socket.emit("new_poll", newPoll);

        // Reset the form
        pollForm.reset();
    } catch (error) {
        console.error("Error creating poll:", error);
    }
});

async function gg() {
    const response = await fetch("http://localhost:3000/leaderboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    const newPoll = await response.json();
    console.log(Array.isArray(newPoll).length>0)
    if(Array.isArray(newPoll).length>0){
        console.log("YES")
        displayLeaderboard(newPoll);
    }
}

// Initialize the app by fetching the polls and the leaderboard
function init() {
    fetchPolls();
    gg();
    // Optionally, you can set an interval to refresh polls and leaderboard every few seconds
    setInterval(fetchPolls, 5000);  // Refresh polls every 5 seconds
}

// Run the initialization when the page loads
window.onload = init;
