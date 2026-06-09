// Newsletter signup — wires the footer form to whatever provider is configured.
// Currently uses Netlify Forms (set in the form element's data-netlify="true").
// Swap with ConvertKit/Mailchimp by changing the fetch target.

import { trackEvent } from './analytics.js';

export function initNewsletter() {
  const form = document.querySelector('#newsletter-form');
  if (!form) return;

  const status = form.querySelector('.newsletter__status');
  const submit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();

    if (!isValidEmail(email)) {
      setStatus(status, 'Please enter a valid email address.', 'error');
      return;
    }

    submit.disabled = true;
    setStatus(status, 'Joining…', 'loading');

    try {
      const formData = new FormData(form);
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);

      setStatus(status, "You're in. Check your inbox.", 'success');
      form.reset();
      trackEvent('Newsletter Signup', { location: window.location.pathname });
    } catch (err) {
      console.error(err);
      setStatus(status, 'Something went wrong. Please try again.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setStatus(el, message, state) {
  if (!el) return;
  el.textContent = message;
  el.dataset.state = state;
}
