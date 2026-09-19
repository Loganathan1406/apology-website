// ============================================================
// APOLOGY WEBSITE - LOKI
// ============================================================

const screens = {
  login: document.getElementById("loginScreen"),
  landing: document.getElementById("landingScreen"),
  letter: document.getElementById("letterScreen"),
  apology: document.getElementById("apologyScreen"),
  why: document.getElementById("whyScreen"),
  attempt1: document.getElementById("attempt1"),
  attempt2: document.getElementById("attempt2"),
  attempt3: document.getElementById("attempt3"),
  time: document.getElementById("timeScreen"),
  celebration: document.getElementById("celebrationScreen")
};

const loginForm = document.getElementById("loginForm");
const openLetter = document.getElementById("openLetter");
const continueButton = document.getElementById("continueButton");
const hearButton = document.getElementById("hearButton");
const whyButton = document.getElementById("whyButton");
const yesWhy = document.getElementById("yesWhy");
const noStart = document.getElementById("noStart");
const yesAttempt1 = document.getElementById("yesAttempt1");
const no1 = document.getElementById("no1");
const yesAttempt2 = document.getElementById("yesAttempt2");
const no2 = document.getElementById("no2");
const yesAttempt3 = document.getElementById("yesAttempt3");
const no3 = document.getElementById("no3");
const maybeLater = document.getElementById("maybeLater");
const againButton = document.getElementById("againButton");

const scene = document.getElementById("scene");
const particleLayer = document.getElementById("particleLayer");
const toast = document.getElementById("toast");

const state = {
  sessionId: crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: "",
  phone: "",
  responses: [],
  finalResponse: ""
};

// ============================================================
// SCREEN CONTROL
// ============================================================

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(item => {
    item.classList.remove("is-active");
  });

  screen.classList.add("is-active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ============================================================
// TOAST
// ============================================================

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ============================================================
// PARTICLES
// ============================================================

function burst(amount = 30) {
  const emojis = ["🤍", "🌷", "🥺", "✦", "✨", "☁️"];

  for (let index = 0; index < amount; index++) {
    const particle = document.createElement("span");

    particle.className = "particle";
    particle.textContent =
      emojis[Math.floor(Math.random() * emojis.length)];

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.fontSize = `${12 + Math.random() * 22}px`;
    particle.style.animationDuration =
      `${2.8 + Math.random() * 3.8}s`;
    particle.style.animationDelay =
      `${Math.random() * 0.8}s`;

    particle.style.setProperty(
      "--drift",
      `${-160 + Math.random() * 320}px`
    );

    particle.style.setProperty(
      "--spin",
      `${-520 + Math.random() * 1040}deg`
    );

    particleLayer.appendChild(particle);

    particle.addEventListener("animationend", () => {
      particle.remove();
    });
  }
}

// ============================================================
// SAVE RESPONSE TO EXCEL
// ============================================================

async function saveResponse(finalResponse = "") {
  state.finalResponse = finalResponse || state.finalResponse;

  try {
    const response = await fetch("/api/response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: state.sessionId,
        name: state.name,
        phone: state.phone,
        responses: state.responses,
        finalResponse: state.finalResponse
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error(result.message);
    }
  } catch (error) {
    // The website should continue working even if the server is unavailable.
    console.error("Could not save response:", error);
  }
}

// ============================================================
// RECORD RESPONSE
// ============================================================

function recordResponse(value) {
  if (state.responses.length >= 6) {
    return;
  }

  state.responses.push(value);
  saveResponse();
}

// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("userName").value.trim();
  const phone = document.getElementById("phoneNumber").value.trim();

  if (!name || !phone) {
    showToast("Please enter your name and phone number.");
    return;
  }

  state.name = name;
  state.phone = phone;

  // Create the first Excel row immediately.
  await saveResponse();

  showScreen(screens.landing);
  burst(18);
});

// ============================================================
// LANDING → LETTER
// ============================================================

openLetter.addEventListener("click", () => {
  openLetter.disabled = true;
  openLetter.classList.add("opened");

  burst(25);

  setTimeout(() => {
    showScreen(screens.letter);
    openLetter.disabled = false;
  }, 850);
});

// ============================================================
// LETTER → APOLOGY
// ============================================================

continueButton.addEventListener("click", () => {
  showScreen(screens.apology);
});

// ============================================================
// YES / OKAY PATH
// ============================================================

function acceptApology() {
  state.finalResponse = "YES";
  saveResponse("YES");

  scene.classList.add("joined");
  burst(100);

  setTimeout(() => {
    showScreen(screens.celebration);
  }, 500);
}

hearButton.addEventListener("click", acceptApology);

yesWhy.addEventListener("click", acceptApology);

yesAttempt1.addEventListener("click", acceptApology);

yesAttempt2.addEventListener("click", acceptApology);

yesAttempt3.addEventListener("click", acceptApology);

// ============================================================
// WHY BUTTON
// ============================================================

whyButton.addEventListener("click", () => {
  // "WHY?" is a navigation action, not a YES/NO answer.
  showScreen(screens.why);
});

// ============================================================
// NO / NOT YET PATH
// ============================================================

noStart.addEventListener("click", () => {
  recordResponse("NO");

  scene.classList.add("moving");

  showScreen(screens.attempt1);
});

no1.addEventListener("click", () => {
  recordResponse("NO");

  scene.classList.add("moving");

  showScreen(screens.attempt2);
});

no2.addEventListener("click", () => {
  recordResponse("NO");

  scene.classList.add("moving");

  showScreen(screens.attempt3);
});

no3.addEventListener("click", () => {
  recordResponse("NO");

  scene.classList.add("moving");

  showScreen(screens.time);
});

// ============================================================
// TIME → FINAL
// ============================================================

maybeLater.addEventListener("click", () => {
  state.finalResponse = "MAYBE LATER";
  saveResponse("MAYBE LATER");

  burst(70);

  showScreen(screens.celebration);
});

// ============================================================
// AGAIN
// ============================================================

againButton.addEventListener("click", () => {
  // Start the visual flow again without deleting the previous
  // response row. The same session continues.
  scene.classList.remove("moving", "joined");
  showScreen(screens.landing);
});

// ============================================================
// BACKGROUND STARS
// ============================================================

const starsBackground = document.querySelector(".stars-bg");

for (let index = 0; index < 22; index++) {
  const star = document.createElement("span");

  star.textContent = index % 3 === 0 ? "✦" : "·";
  star.style.position = "absolute";
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.color = "rgba(118, 92, 152, 0.35)";
  star.style.fontSize = `${10 + Math.random() * 15}px`;
  star.style.animation =
    `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`;

  starsBackground.appendChild(star);
}
