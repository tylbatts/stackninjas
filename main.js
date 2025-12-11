const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('primary-nav');
const yearEl = document.getElementById('year');
const form = document.getElementById('contact-form');

// Mobile navigation toggle
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Close nav on link click (mobile)
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// Smooth scrolling for anchor links
const anchorLinks = document.querySelectorAll('a[href^="#"]');
anchorLinks.forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId && targetId !== '#') {
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// Set current year
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Contact form validation
const requiredFields = ['fullName', 'company', 'role', 'email', 'message'];

function validateEmail(email) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
}

function clearErrors() {
  requiredFields.forEach((field) => {
    const errorEl = document.getElementById(`error-${field}`);
    if (errorEl) errorEl.textContent = '';
  });
}

function showError(field, message) {
  const errorEl = document.getElementById(`error-${field}`);
  if (errorEl) errorEl.textContent = message;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();
  const formStatus = document.getElementById('form-status');
  if (formStatus) formStatus.textContent = '';

  let valid = true;

  requiredFields.forEach((field) => {
    const input = document.getElementById(field);
    if (input && !input.value.trim()) {
      showError(field, 'This field is required.');
      valid = false;
    }
  });

  const emailInput = document.getElementById('email');
  if (emailInput && emailInput.value && !validateEmail(emailInput.value)) {
    showError('email', 'Enter a valid work email.');
    valid = false;
  }

  if (!valid) return;

  if (formStatus) {
    formStatus.textContent = 'Thanks — we’ll review and get back to you shortly.';
  }

  form.reset();
});
