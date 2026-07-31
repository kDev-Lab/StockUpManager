// If these HTML files are hosted separately from the chat backend (e.g. static
// hosting + a Node server on Render), set this to that backend's full URL,
// e.g. 'https://stock-up-manager-api.onrender.com'. Leave blank if the same
// server serves both the pages and /api/chat (e.g. local dev, or Render
// hosting everything together).
const API_BASE = '';

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mobileNav = document.getElementById('mobile-nav');
navToggle.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Hero screenshot theme toggle
const appScreenshot = document.getElementById('app-screenshot');
const screenshotToggleBtns = document.querySelectorAll('.screenshot-toggle-btn');
if (appScreenshot && screenshotToggleBtns.length) {
  const screenshotSources = {
    dark: 'app-screenshot-dark.png',
    light: 'app-screenshot-light.png',
  };
  screenshotToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      appScreenshot.src = screenshotSources[theme];
      screenshotToggleBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });
    });
  });
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// ---------- Chat widget ----------
const chatLauncher = document.getElementById('chat-launcher');
const chatPanel = document.getElementById('chat-panel');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatSuggestions = document.getElementById('chat-suggestions');
const footerChatOpen = document.getElementById('footer-chat-open');

let history = [];
let isSending = false;

function openChat() {
  chatPanel.hidden = false;
  chatLauncher.setAttribute('aria-expanded', 'true');
  chatInput.focus();
}

function closeChat() {
  chatPanel.hidden = true;
  chatLauncher.setAttribute('aria-expanded', 'false');
}

chatLauncher.addEventListener('click', () => {
  if (chatPanel.hidden) openChat();
  else closeChat();
});
chatClose.addEventListener('click', closeChat);
footerChatOpen.addEventListener('click', openChat);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !chatPanel.hidden) closeChat();
});

function appendMessage(text, role) {
  const bubble = document.createElement('div');
  bubble.className = `chat-message chat-message-${role}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('chat-typing-indicator');
  if (typing) typing.remove();
}

async function sendMessage(message) {
  if (!message.trim() || isSending) return;

  isSending = true;
  chatSend.disabled = true;
  chatSuggestions.style.display = 'none';

  appendMessage(message, 'user');
  chatInput.value = '';
  showTyping();

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    const data = await response.json();
    hideTyping();

    if (!response.ok) {
      appendMessage(data.error || "Something went wrong — please try again.", 'error');
      return;
    }

    appendMessage(data.reply, 'bot');
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: data.reply });
    if (history.length > 12) history = history.slice(-12);
  } catch (err) {
    hideTyping();
    appendMessage("Couldn't reach the assistant — check your connection and try again.", 'error');
  } finally {
    isSending = false;
    chatSend.disabled = false;
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(chatInput.value);
});

chatSuggestions.querySelectorAll('.chat-suggestion').forEach((btn) => {
  btn.addEventListener('click', () => sendMessage(btn.dataset.q));
});
