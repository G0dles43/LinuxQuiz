let questions = [],
  currentQuestion = 0,
  score = 0,
  selectedQuestions = [],
  userAnswers = [];
let startTime, timerInterval;

async function loadQuestions() {
  const response = await fetch("linux_quiz.json");
  questions = await response.json();
  updateRangeLabels();
}

function updateSliderBackground(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);

  const percentage = ((val - min) / (max - min)) * 100;
  slider.style.backgroundImage = `linear-gradient(to right, var(--secondary-color) 0%, var(--secondary-color) ${percentage}%, #ccc ${percentage}%, #ccc 100%)`;
}

document.querySelectorAll('input[type="range"]').forEach((slider) => {
  slider.classList.add("styled-slider");
  updateSliderBackground(slider);
  slider.addEventListener("input", () => updateSliderBackground(slider));
});

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function initializeQuiz() {
  const minId = parseInt(document.getElementById("range-min").value);
  const maxId = parseInt(document.getElementById("range-max").value);

  if (minId > maxId || minId < 1 || maxId > 315)
    return alert("Nieprawidłowy zakres!");

  selectedQuestions = questions
    .filter((q) => q.id >= minId && q.id <= maxId)
    .sort(() => Math.random() - 0.5);
  if (selectedQuestions.length === 0) return alert("Brak pytań!");

  document.querySelector(".range-slider").style.display = "none";

  currentQuestion = 0;
  score = 0;
  userAnswers = [];

  document.getElementById("start-btn").style.display = "none";
  document.getElementById("quiz-box").style.display = "block";
  document.getElementById("result-box").style.display = "none";

  updateProgress();
  showQuestion();
  startTimer();
}

function showQuestion() {
  const q = selectedQuestions[currentQuestion];
  const answersContainer = document.getElementById("answers");
  answersContainer.innerHTML = "";
  document.getElementById("question").textContent = q.question;
  document.getElementById("question-type").textContent =
    q.type === "open" ? "Pytanie otwarte" : "Wielokrotny wybór";

  if (q.type === "open") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "open-answer";
    input.placeholder = "Wpisz odpowiedź...";
    answersContainer.appendChild(input);
  } else {
    q.answers.forEach((a, i) => {
      const label = document.createElement("label");
      label.className = "answer-item";

      const input = document.createElement("input");
      input.type = q.type === "multiple" ? "checkbox" : "radio";
      input.name = "answer";
      input.value = i;

      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + a.text));
      answersContainer.appendChild(label);
    });
  }
}

function checkAnswer() {
  const q = selectedQuestions[currentQuestion];
  let isCorrect = false;
  let selected = [];
  let input = "";

  if (q.type === "open") {
    const inputElem = document.querySelector(".open-answer");
    input = inputElem ? inputElem.value.trim() : "";
    const userInput = input.toLowerCase();
    const correct = q.answers
      .filter((a) => a.correct)
      .map((a) => a.text.toLowerCase());
    isCorrect = correct.includes(userInput);

    userAnswers[currentQuestion] = {
      isCorrect,
      input,
    };
  } else {
    selected = Array.from(document.querySelectorAll("input:checked")).map((i) =>
      parseInt(i.value)
    );
    const correctIndexes = q.answers
      .map((a, i) => (a.correct ? i : -1))
      .filter((i) => i !== -1);
    isCorrect =
      selected.length === correctIndexes.length &&
      selected.every((i) => correctIndexes.includes(i));

    userAnswers[currentQuestion] = {
      isCorrect,
      selected,
    };
  }

  if (isCorrect) score++;
}

function showResults() {
  stopTimer();

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  const sounds = [
    document.getElementById("end-sound2"),
    document.getElementById("end-sound3"),
    document.getElementById("end-sound4"),
  ];
  const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
  randomSound.play();
  document.getElementById("quiz-box").style.display = "none";

  document.getElementById("result-box").style.display = "block";
  document.getElementById(
    "final-score"
  ).textContent = `${score} / ${selectedQuestions.length}`;
  document.getElementById("final-time").textContent = `${minutes}:${seconds}`;

  const summary = document.getElementById("summary");
  summary.innerHTML = selectedQuestions
    .map((q, i) => {
      const ua = userAnswers[i];
      const correctAnswers = q.answers
        .filter((a) => a.correct)
        .map((a) => a.text);

      if (q.type === "open") {
        const userInput = ua?.input?.trim() || "(brak)";
        return `
        <div class="question-result">
          <h4>${q.question}</h4>
          <div class="answer ${ua?.isCorrect ? "correct" : "incorrect"}">
            Twoja odpowiedź: ${userInput}
          </div>
          ${
            ua?.isCorrect
              ? ""
              : `<div class="answer missed">Poprawna odpowiedź: ${correctAnswers.join(
                  " / "
                )}</div>`
          }
        </div>
      `;
      } else {
        const selected = ua?.selected || [];
        return `
        <div class="question-result">
          <h4>${q.question}</h4>
${q.answers
  .map((a, j) => {
    let cls = "";
    const anyCorrectSelected = q.answers.some(
      (ans, idx) => ans.correct && selected.includes(idx)
    );
    const isSelected = selected.includes(j);

    if (a.correct && isSelected) {
      cls = "correct";
    } else if (a.correct && !isSelected) {
      cls = anyCorrectSelected ? "missed-warning" : "correct";
    } else if (!a.correct && isSelected) {
      cls = "incorrect";
    }

    return `<div class="answer ${cls}">${a.text}</div>`;
  })
  .join("")}

        </div>
      `;
      }
    })
    .join("");
}

function updateProgress() {
  document.getElementById("current-question").textContent = currentQuestion + 1;
  document.getElementById("total-questions").textContent =
    selectedQuestions.length;
  document.querySelector(".progress-bar").style.width = `${
    ((currentQuestion + 1) / selectedQuestions.length) * 100
  }%`;
}

function updateRangeLabels() {
  let min = parseInt(document.getElementById("range-min").value);
  let max = parseInt(document.getElementById("range-max").value);

  if (min > max) {
    [min, max] = [max, min];
    document.getElementById("range-min").value = min;
    document.getElementById("range-max").value = max;
  }

  document.getElementById("range-label").textContent = `${min} - ${max}`;
  document.getElementById("selected-count").textContent = questions.filter(
    (q) => q.id >= min && q.id <= max
  ).length;
}

document.getElementById("start-btn").addEventListener("click", initializeQuiz);
document.getElementById("next-btn").addEventListener("click", () => {
  checkAnswer();
  currentQuestion++;
  if (currentQuestion < selectedQuestions.length) {
    updateProgress();
    showQuestion();
  } else {
    showResults();
  }
});
document
  .getElementById("restart-btn")
  .addEventListener("click", () => location.reload());

["range-min", "range-max"].forEach((id) =>
  document.getElementById(id).addEventListener("input", updateRangeLabels)
);

loadQuestions();

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    const nextBtn = document.getElementById("next-btn");

    if (nextBtn && nextBtn.offsetParent !== null) {
      event.preventDefault();
      nextBtn.click();
    }
  }
});
