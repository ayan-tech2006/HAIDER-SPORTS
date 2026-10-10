// About page script: animated stats counters
document.addEventListener('DOMContentLoaded', () => {
  const statsSection = document.getElementById('statsSection');
  if (!statsSection) return;

  const statEls = statsSection.querySelectorAll('.stat-number');
  let hasAnimated = false;

  function animateCounters() {
    if (hasAnimated) return;
    hasAnimated = true;

    statEls.forEach(el => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const isPercent = target === 99;
      const suffix = isPercent ? '%' : '+';
      const duration = 1600; // ms
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quadratic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);

        el.textContent = current.toLocaleString('en-US') + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toLocaleString('en-US') + suffix;
        }
      }

      requestAnimationFrame(update);
    });
  }

  // Observe when scrolled into view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  } else {
    // Fallback
    animateCounters();
  }
});
