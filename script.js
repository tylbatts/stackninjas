// Smooth scrolling for in-page navigation
const navLinks = document.querySelectorAll('.nav__links a, .footer__links a, .hero__actions a');
navLinks.forEach(link => {
  link.addEventListener('click', event => {
    const targetId = link.getAttribute('href');
    if (targetId.startsWith('#')) {
      event.preventDefault();
      document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// Sticky nav shadow on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Mobile navigation toggle
const navToggle = document.querySelector('.nav__toggle');
const navMenu = document.querySelector('.nav__links');
navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

// Set footer year
const year = document.getElementById('year');
year.textContent = new Date().getFullYear();

// Contact form validation and fake submission
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');

const validators = {
  name: value => value.trim() !== '' ? '' : 'Name is required.',
  email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid work email.',
  company: value => value.trim() !== '' ? '' : 'Company is required.',
  role: value => value.trim() !== '' ? '' : 'Role is required.',
  message: value => value.trim().length > 5 ? '' : 'Please provide a short message.'
};

form.addEventListener('submit', event => {
  event.preventDefault();
  statusEl.textContent = '';
  let hasError = false;

  Object.entries(validators).forEach(([field, validate]) => {
    const input = form.elements[field];
    const errorEl = document.getElementById(`error-${field}`);
    const message = validate(input.value);
    errorEl.textContent = message;
    if (message) {
      hasError = true;
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  });

  if (!hasError) {
    statusEl.textContent = 'Thanks — we’ve received your message and will follow up shortly.';
    form.reset();
  }
});
