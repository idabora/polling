// Generate a unique user ID for each window or tab
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = '121'
    localStorage.setItem('userId', userId);
}

const socket = io("http://localhost:3000");

const pollsContainer = document.getElementById("polls-container");
const leaderboardContainer = document.getElementById("leaderboard");
const pollForm = document.getElementById("poll-form");
const questionInput = document.getElementById("question");
const optionsInput = document.getElementById("options");

async function fetchPolls() {
    try {
        const response = await fetch("http://localhost:3000/polls");
        const polls = await response.json();
        displayPolls(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
    }
}

function displayPolls(polls) {
    console.log("yeyeyeye")
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
    console.log("DONENNENE")
}

function displayLeaderboard(leaderboard) {
    // console.log("&&&&&&&&&&&&&&", Array.isArray(leaderboard));

    if (Array.isArray(leaderboard)) {
        leaderboardContainer.innerHTML = leaderboard.map((entry) => `
            <li>
              <strong>Question:</strong> ${entry.question}<br>
              <strong>Answer:</strong> ${entry.text}<br>
              <strong>Votes:</strong> ${entry.votesCast}
            </li>
          `).join('');

    } else {
        console.log("inside else", leaderboard);
        leaderboardContainer.innerHTML = `
  <li>
    <strong>Question:</strong> ${leaderboard.question}<br>
    <strong>Answer:</strong> ${leaderboard.text}<br>
    <strong>Votes:</strong> ${leaderboard.votesCast}
  </li>
`;

    }
}

function castVote(pollId, optionId, question, text) {
    socket.emit("cast_vote", {
        pollId,
        optionId,
        question,
        text,
        userId: userId
    });
}

socket.on("poll_updated", (updatedPoll) => {
    console.log("Poll updated:", updatedPoll);
    fetchPolls();
});

socket.on("leaderboard_updated", (updatedLeaderboard) => {
    console.log("Leaderboard updated:", updatedLeaderboard);
    displayLeaderboard(updatedLeaderboard);
});


pollForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value;
    const options = optionsInput.value.split(',').map(option => option.trim());

    if (!question || options.length < 2) {
        alert("Please enter a question and at least two options.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/polls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, options })
        });

        const newPoll = await response.json();
        console.log("New poll created:", newPoll);

        // socket.emit("new_poll", newPoll);

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
    console.log(Array.isArray(newPoll).length > 0)
    displayLeaderboard(newPoll);
}

function init() {
    fetchPolls();
    gg();
    setInterval(fetchPolls, 5000);
}

window.onload = init;
