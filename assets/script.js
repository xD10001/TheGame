const stations = Array.from(document.querySelectorAll('.station'));
const progressBar = document.querySelector('.progress__bar span');
const progressLabel = document.querySelector('.progress__label');
const mainElement = document.querySelector('main');
const heroStart = document.querySelector('[data-action="start"]');
const finalSection = document.getElementById('final-stop');
const replayButton = finalSection?.querySelector('[data-action="replay"]');
const hornButton = document.querySelector('[data-horn]');
const hornSecret = document.querySelector('.horn-secret');

let currentIndex = -1;
let hornTaps = 0;
let hornTimeout;

const stationState = new Map();
stations.forEach((station) => stationState.set(station.id, { completed: false }));

function updateProgress() {
  const total = stations.length;
  const current = Math.min(Math.max(currentIndex + 1, 0), total);
  const percent = total === 0 ? 0 : Math.min((current / total) * 100, 100);
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressLabel) progressLabel.textContent = `Station ${current} von ${total}`;
}

function showStation(index) {
  stations.forEach((station, i) => {
    station.hidden = i !== index;
  });
  if (finalSection) finalSection.hidden = true;
  currentIndex = index;
  updateProgress();
}

function showFinal() {
  stations.forEach((station) => (station.hidden = true));
  if (finalSection) finalSection.hidden = false;
  currentIndex = stations.length;
  updateProgress();
}

function enableNext(station) {
  const nextButton = station.querySelector('[data-action="next"]');
  if (nextButton) nextButton.disabled = false;
  if (!stationState.has(station.id)) {
    stationState.set(station.id, { completed: true });
  } else {
    stationState.get(station.id).completed = true;
  }
}

function handleNavigation(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  if (action === 'start') {
    showStation(0);
    if (mainElement) {
      window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
    }
  }

  if (currentIndex < 0) return;
  const currentStation = stations[currentIndex];

  switch (action) {
    case 'next': {
      const state = stationState.get(currentStation.id);
      if (!state || !state.completed) return;
      if (currentIndex === stations.length - 1) {
        showFinal();
        if (mainElement) {
          window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
        }
      } else {
        showStation(currentIndex + 1);
      }
      break;
    }
    case 'prev': {
      if (currentIndex === 0) {
        currentStation.hidden = true;
        currentIndex = -1;
        updateProgress();
        break;
      }
      if (currentIndex > 0) {
        showStation(currentIndex - 1);
      }
      break;
    }
    case 'replay': {
      showStation(0);
      if (mainElement) {
        window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
      }
      break;
    }
    default:
      break;
  }
}

document.addEventListener('click', handleNavigation);

function initStoryStation(station) {
  const choices = station.querySelectorAll('[data-story-choice]');
  const result = station.querySelector('[data-result="story"]');
  const achievement = station.querySelector('[data-achievement]');

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      const key = choice.dataset.storyChoice;
      const data = {
        cms: 'CMS-Relaunch: Ich habe Content-Modelle entschlackt und Versionierung eingeführt.',
        intranet: 'Kommunikations-App: Fokus auf Moderationsrechte und mobile Performance.'
      };
      if (result) {
        result.textContent = data[key];
      }
      if (achievement) {
        achievement.textContent = 'Recruiter-Notiz: Ich liefere auch unter Zeitdruck planbar aus.';
      }
      choices.forEach((btn) => btn.classList.toggle('is-active', btn === choice));
      enableNext(station);
    });
  });
}

function initSkillStation(station) {
  const options = station.querySelectorAll('[data-correct]');
  const result = station.querySelector('[data-result="skills"]');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const isCorrect = option.dataset.correct === 'true';
      const proof = option.dataset.proof;
      options.forEach((btn) => btn.classList.remove('is-active', 'is-wrong'));
      option.classList.add(isCorrect ? 'is-active' : 'is-wrong');
      if (result) {
        result.textContent = proof;
        result.style.color = isCorrect ? 'var(--secondary)' : '#f87171';
      }
      if (isCorrect) enableNext(station);
    });
  });
}

function initProjectsStation(station) {
  const projects = station.querySelectorAll('[data-project]');
  const result = station.querySelector('[data-result="projects"]');
  const opened = new Set();

  projects.forEach((project) => {
    const trigger = project.querySelector('[data-project-open]');
    const details = project.querySelector('.project-details');
    if (!trigger || !details) return;
    trigger.addEventListener('click', () => {
      const hidden = details.hasAttribute('hidden');
      details.toggleAttribute('hidden', !hidden);
      project.classList.toggle('is-active', hidden);
      if (hidden) {
        opened.add(project);
      }
      if (result) {
        result.textContent = `${opened.size} Ticket(s) geprüft – gerne zeige ich mehr im Call.`;
      }
      if (opened.size >= 2) {
        enableNext(station);
      }
    });
  });
}

function initPersonalityStation(station) {
  const traits = station.querySelectorAll('[data-trait]');
  const result = station.querySelector('[data-result="personality"]');
  const opened = new Set();

  traits.forEach((trait) => {
    trait.addEventListener('click', () => {
      const text = trait.querySelector('.trait__text');
      const hidden = text.hasAttribute('hidden');
      text.toggleAttribute('hidden', !hidden);
      trait.classList.toggle('is-active', hidden);
      if (hidden) opened.add(trait);
      if (result) {
        result.textContent = `${opened.size}/3 Crew-Karten aufgedeckt`;
      }
      if (opened.size === traits.length) {
        result.textContent = 'Crew komplett – lass uns zusammen den nächsten Sprint planen!';
        enableNext(station);
      }
    });
  });
}

stations.forEach((station) => {
  if (station.id.includes('story')) initStoryStation(station);
  if (station.id.includes('skills')) initSkillStation(station);
  if (station.id.includes('projects')) initProjectsStation(station);
  if (station.id.includes('personality')) initPersonalityStation(station);
});

if (heroStart) {
  heroStart.addEventListener('click', () => {
    showStation(0);
  });
}

if (replayButton) {
  replayButton.addEventListener('click', () => {
    stations.forEach((station) => {
      stationState.set(station.id, { completed: false });
      const nextButton = station.querySelector('[data-action="next"]');
      if (nextButton) nextButton.disabled = true;
      station
        .querySelectorAll('.is-active, .is-wrong')
        .forEach((el) => el.classList.remove('is-active', 'is-wrong'));
      station.querySelectorAll('[data-result]').forEach((res) => {
        res.textContent = '';
        res.removeAttribute('style');
      });
      station.querySelectorAll('.project-details').forEach((details) => details.setAttribute('hidden', ''));
      station.querySelectorAll('.trait__text').forEach((text) => text.setAttribute('hidden', ''));
    });
    hornTaps = 0;
    if (hornSecret) {
      hornSecret.textContent = '';
    }
    showStation(0);
  });
}

if (hornButton) {
  hornButton.addEventListener('click', () => {
    hornTaps += 1;
    clearTimeout(hornTimeout);
    hornTimeout = setTimeout(() => {
      hornTaps = 0;
      if (hornSecret) {
        hornSecret.textContent = '';
      }
    }, 1200);

    if (!hornSecret) return;

    if (hornTaps >= 3) {
      hornSecret.textContent = 'Nightshift-Snack: Franzbrötchen mit kaltem Brew-Kaffee.';
      hornTaps = 0;
    } else {
      hornSecret.textContent = `Hupe ${hornTaps}/3`;
    }
  });
}

updateProgress();
