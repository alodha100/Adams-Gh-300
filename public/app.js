const form = document.querySelector('#registration-form');
const topicsContainer = document.querySelector('#topics');
const submitButton = document.querySelector('#submit');
const status = document.querySelector('#status');

async function loadTopics() {
  topicsContainer.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/topics');
    if (!response.ok) throw new Error('Unable to load topics.');
    const topics = await response.json();
    topicsContainer.replaceChildren();
    for (const topic of topics) {
      const card = document.createElement('label');
      card.className = 'topic';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'topicId';
      radio.value = topic.id;
      radio.required = true;
      const title = document.createElement('strong');
      title.textContent = topic.title;
      const description = document.createElement('span');
      description.textContent = topic.description;
      const duration = document.createElement('small');
      duration.textContent = topic.duration;
      const registrations = document.createElement('span');
      registrations.className = 'registration-count';
      registrations.textContent = `${topic.registrationCount} of ${topic.capacity} registered (maximum ${topic.capacity} people)`;
      card.append(radio, title, description, duration, registrations);
      topicsContainer.append(card);
    }
    if (!topics.length) throw new Error('No topics are currently available.');
    submitButton.disabled = false;
  } catch {
    topicsContainer.textContent = 'Training topics are unavailable. Please refresh to try again.';
  } finally {
    topicsContainer.setAttribute('aria-busy', 'false');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  status.textContent = 'Registering…';
  status.className = '';
  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to register.');
    status.textContent = result.message;
    status.className = 'success';
    form.reset();
    await loadTopics();
  } catch (error) {
    status.textContent = error.message || 'Unable to register. Please try again.';
    status.className = 'error';
  } finally {
    submitButton.disabled = !topicsContainer.querySelector('input[name="topicId"]');
  }
});

loadTopics();
