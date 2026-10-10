/**
 * Store Settings & Configuration Script for Haider Sports Admin
 * Handles contact details, per-city shipping charges, payment gateways,
 * and Supabase administrator credentials.
 */

let settingsRecordId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize layout & auth guard
  await admin.initLayout('settings', 'Store Settings');

  // 2. Initialize Tab Switching
  initTabs();

  // 3. Initialize City Rates Manager
  initCityRates();

  // 4. Load Current Settings
  await loadSettings();

  // 5. Initialize Form & Password Listeners
  initFormListeners();
});

/* ==========================================================================
   Tab Navigation
   ========================================================================== */
function initTabs() {
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.style.display = 'block';
    });
  });
}

/* ==========================================================================
   Load Settings
   ========================================================================== */
async function loadSettings() {
  try {
    const { data: rows, error } = await supabaseClient
      .from('settings')
      .select('*')
      .limit(1);

    if (error) throw error;

    let settings = null;
    if (rows && rows.length > 0) {
      settings = rows[0];
      settingsRecordId = settings.id;
    }

    if (settings) {
      // Store Info
      document.getElementById('setStoreName').value = settings.store_name || 'Haider Sports';
      document.getElementById('setEmail').value = settings.email || 'support@haidersports.pk';
      document.getElementById('setPhone').value = settings.phone || '+92 300 1234567';
      document.getElementById('setWhatsapp').value = settings.whatsapp || '+92 300 1234567';
      document.getElementById('setAddress').value = settings.address || 'Kashmir Road, Model Town, Sialkot, Punjab, Pakistan';

      // Social JSON
      const social = settings.social || {};
      document.getElementById('setHours').value = social.openingHours || 'Mon - Sat: 10:00 AM - 10:00 PM';
      document.getElementById('setFacebook').value = social.facebook || '';
      document.getElementById('setInstagram').value = social.instagram || '';
      document.getElementById('setTiktok').value = social.tiktok || '';
      document.getElementById('setYoutube').value = social.youtube || '';

      // Delivery JSON
      const delivery = settings.delivery || {};
      document.getElementById('setFlatRate').value = delivery.flatRate ?? 250;
      document.getElementById('setFreeAbove').value = delivery.freeAbove ?? 5000;

      // Populate City Rates
      const cityRatesContainer = document.getElementById('cityRatesContainer');
      cityRatesContainer.innerHTML = '';
      const rates = delivery.cityRates || [];
      if (rates.length > 0) {
        rates.forEach(r => addCityRateRow(r.city, r.rate));
      }

      // Payments JSON
      const bank = settings.bank_details || {};
      document.getElementById('setCodEnabled').checked = bank.codEnabled !== false;
      document.getElementById('setBankEnabled').checked = bank.bankEnabled !== false;
      document.getElementById('setBankName').value = bank.bankName || '';
      document.getElementById('setAccountTitle').value = bank.accountTitle || '';
      document.getElementById('setAccountNumber').value = bank.accountNumber || '';
      document.getElementById('setIban').value = bank.iban || '';
      document.getElementById('setJazzCash').value = bank.jazzCash || '';
      document.getElementById('setEasyPaisa').value = bank.easyPaisa || '';
    } else {
      // Defaults
      document.getElementById('setFlatRate').value = 250;
      document.getElementById('setFreeAbove').value = 5000;
    }

  } catch (err) {
    console.error('Error loading settings:', err);
    admin.toast('Error loading store settings: ' + err.message, 'error');
  }
}

/* ==========================================================================
   Per-City Delivery Rates Rows
   ========================================================================== */
function initCityRates() {
  document.getElementById('addCityRateBtn').addEventListener('click', () => {
    addCityRateRow();
  });
}

function addCityRateRow(city = '', rate = '') {
  const container = document.getElementById('cityRatesContainer');
  const row = document.createElement('div');
  row.className = 'city-rate-row';
  row.innerHTML = `
    <input type="text" class="form-control form-control--sm city-name-input" placeholder="City Name (e.g. Sialkot, Lahore)" value="${admin.escapeHtml(city)}" required>
    <input type="number" class="form-control form-control--sm city-rate-input" placeholder="Rate (Rs.)" value="${rate}" min="0" step="50" required>
    <button type="button" class="btn btn--outline btn--xs" style="color: #ef4444; border-color: #fca5a5;" onclick="this.closest('.city-rate-row').remove()" title="Remove rate">
      <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
    </button>
  `;
  container.appendChild(row);
  if (window.lucide) lucide.createIcons();
}

function getCityRatesData() {
  const rows = document.querySelectorAll('#cityRatesContainer .city-rate-row');
  const list = [];
  rows.forEach(r => {
    const city = r.querySelector('.city-name-input').value.trim();
    const rateStr = r.querySelector('.city-rate-input').value.trim();
    if (city && rateStr) {
      list.push({
        city,
        rate: parseInt(rateStr, 10)
      });
    }
  });
  return list;
}

/* ==========================================================================
   Form Listeners & Password Update
   ========================================================================== */
function initFormListeners() {
  // Save Settings
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const storeName = document.getElementById('setStoreName').value.trim();
    const email = document.getElementById('setEmail').value.trim();
    const phone = document.getElementById('setPhone').value.trim();
    const whatsapp = document.getElementById('setWhatsapp').value.trim();
    const address = document.getElementById('setAddress').value.trim();

    const social = {
      openingHours: document.getElementById('setHours').value.trim(),
      facebook: document.getElementById('setFacebook').value.trim(),
      instagram: document.getElementById('setInstagram').value.trim(),
      tiktok: document.getElementById('setTiktok').value.trim(),
      youtube: document.getElementById('setYoutube').value.trim()
    };

    const delivery = {
      flatRate: parseInt(document.getElementById('setFlatRate').value, 10) || 0,
      freeAbove: parseInt(document.getElementById('setFreeAbove').value, 10) || 0,
      cityRates: getCityRatesData()
    };

    const bankDetails = {
      codEnabled: document.getElementById('setCodEnabled').checked,
      bankEnabled: document.getElementById('setBankEnabled').checked,
      bankName: document.getElementById('setBankName').value.trim(),
      accountTitle: document.getElementById('setAccountTitle').value.trim(),
      accountNumber: document.getElementById('setAccountNumber').value.trim(),
      iban: document.getElementById('setIban').value.trim(),
      jazzCash: document.getElementById('setJazzCash').value.trim(),
      easyPaisa: document.getElementById('setEasyPaisa').value.trim()
    };

    const payload = {
      store_name: storeName,
      email,
      phone,
      whatsapp,
      address,
      delivery,
      bank_details: bankDetails,
      social,
      updated_at: new Date().toISOString()
    };

    const btn = document.getElementById('saveSettingsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Saving...';
    if (window.lucide) lucide.createIcons();

    try {
      if (settingsRecordId) {
        const { error } = await supabaseClient
          .from('settings')
          .update(payload)
          .eq('id', settingsRecordId);

        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient
          .from('settings')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;
        settingsRecordId = data.id;
      }

      admin.toast('Store settings updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      admin.toast('Failed to save settings: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Save Settings';
      if (window.lucide) lucide.createIcons();
    }
  });

  // Admin Password Change
  document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const newPass = document.getElementById('newAdminPassword').value;
    const confirmPass = document.getElementById('confirmAdminPassword').value;

    if (!newPass || newPass.length < 8) {
      admin.toast('Password must be at least 8 characters long', 'warning');
      return;
    }
    if (newPass !== confirmPass) {
      admin.toast('Passwords do not match', 'warning');
      return;
    }

    const btn = document.getElementById('changePasswordBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Updating password...';
    if (window.lucide) lucide.createIcons();

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPass
      });

      if (error) throw error;

      admin.toast('Admin password updated successfully!', 'success');
      document.getElementById('newAdminPassword').value = '';
      document.getElementById('confirmAdminPassword').value = '';
    } catch (err) {
      admin.toast('Failed to update password: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="key" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Update Admin Password';
      if (window.lucide) lucide.createIcons();
    }
  });
}
