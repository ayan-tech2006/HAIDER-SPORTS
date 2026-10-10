// Contact page script: validation & message submission via api.sendMessage
// Requires: data.js (api) and common.js (CONTACT_INFO, WHATSAPP_NUMBER, showToast)

document.addEventListener('DOMContentLoaded', () => {
  // Populate contact info from common constants
  if (typeof CONTACT_INFO !== 'undefined') {
    const infoPhone = document.getElementById('infoPhone');
    const infoWhatsapp = document.getElementById('infoWhatsapp');
    const infoEmail = document.getElementById('infoEmail');
    const infoAddress = document.getElementById('infoAddress');
    const infoHours = document.getElementById('infoHours');
    const waChatBtn = document.getElementById('whatsappChatBtn');

    if (infoPhone) {
      infoPhone.textContent = CONTACT_INFO.phone;
      infoPhone.href = `tel:${CONTACT_INFO.phoneRaw}`;
    }
    if (infoWhatsapp) {
      infoWhatsapp.textContent = CONTACT_INFO.whatsapp;
      infoWhatsapp.href = `https://wa.me/${CONTACT_INFO.whatsappRaw}`;
    }
    if (infoEmail) {
      infoEmail.textContent = CONTACT_INFO.email;
      infoEmail.href = `mailto:${CONTACT_INFO.email}`;
    }
    if (infoAddress) {
      infoAddress.textContent = CONTACT_INFO.address;
    }
    if (infoHours) {
      infoHours.textContent = CONTACT_INFO.hours;
    }
    if (waChatBtn) {
      const waMsg = encodeURIComponent('Assalam o Alaikum Rashy Cricket! I would like to inquire about your products.');
      waChatBtn.href = `https://wa.me/${CONTACT_INFO.whatsappRaw || WHATSAPP_NUMBER}?text=${waMsg}`;
    }
  }

  // Pre-fill customer details if remembered in localStorage
  try {
    const savedCust = localStorage.getItem('rashy_customer');
    if (savedCust) {
      const cust = JSON.parse(savedCust);
      if (cust.name) document.getElementById('contactName').value = cust.name;
      if (cust.phone) document.getElementById('contactPhone').value = cust.phone;
      if (cust.email) document.getElementById('contactEmail').value = cust.email;
    }
  } catch (e) {
    // ignore
  }

  // Form handling
  const form = document.getElementById('contactForm');
  const nameInput = document.getElementById('contactName');
  const phoneInput = document.getElementById('contactPhone');
  const emailInput = document.getElementById('contactEmail');
  const subjectInput = document.getElementById('contactSubject');
  const messageInput = document.getElementById('contactMessage');
  const submitBtn = document.getElementById('contactSubmitBtn');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    let isValid = true;
    let firstErrorEl = null;

    // Validate Name
    const nameVal = nameInput.value.trim();
    if (!nameVal || nameVal.length < 2) {
      nameInput.classList.add('invalid');
      nameError.classList.add('show');
      isValid = false;
      if (!firstErrorEl) firstErrorEl = nameInput;
    } else {
      nameInput.classList.remove('invalid');
      nameError.classList.remove('show');
    }

    // Validate Phone (Pakistani 03XXXXXXXXX format)
    const rawPhone = phoneInput.value.trim().replace(/[\s-]/g, '');
    const pakPhoneRegex = /^03\d{9}$/;
    if (!pakPhoneRegex.test(rawPhone)) {
      phoneInput.classList.add('invalid');
      phoneError.classList.add('show');
      isValid = false;
      if (!firstErrorEl) firstErrorEl = phoneInput;
    } else {
      phoneInput.classList.remove('invalid');
      phoneError.classList.remove('show');
    }

    // Validate Email (optional)
    const emailVal = emailInput.value.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      emailInput.classList.add('invalid');
      emailError.classList.add('show');
      isValid = false;
      if (!firstErrorEl) firstErrorEl = emailInput;
    } else {
      emailInput.classList.remove('invalid');
      emailError.classList.remove('show');
    }

    // Validate Message
    const msgVal = messageInput.value.trim();
    if (!msgVal || msgVal.length < 10) {
      messageInput.classList.add('invalid');
      messageError.classList.add('show');
      isValid = false;
      if (!firstErrorEl) firstErrorEl = messageInput;
    } else {
      messageInput.classList.remove('invalid');
      messageError.classList.remove('show');
    }

    if (!isValid) {
      if (firstErrorEl) {
        firstErrorEl.focus();
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit message via api.sendMessage
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending message...`;

    try {
      const data = {
        name: nameVal,
        phone: rawPhone,
        email: emailVal,
        subject: subjectInput.value,
        message: msgVal,
        sentAt: new Date().toISOString()
      };

      if (typeof api !== 'undefined' && api.sendMessage) {
        await api.sendMessage(data);
      } else {
        await new Promise(r => setTimeout(r, 600));
      }

      showToast('Thank you! Your message has been sent successfully.');
      form.reset();
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Something went wrong. Please reach out via WhatsApp.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Real-time input cleanup
  [nameInput, phoneInput, emailInput, messageInput].forEach(inp => {
    inp.addEventListener('input', () => {
      inp.classList.remove('invalid');
      const err = inp.parentElement.querySelector('.field-error');
      if (err) err.classList.remove('show');
    });
  });
});
