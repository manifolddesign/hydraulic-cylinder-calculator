
document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('resetBtn');

  resetBtn.addEventListener('click', () => {
    // clear all input fields
    document.querySelectorAll('input, select').forEach(el => {
      if (el.type === 'checkbox') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });

    // reset all output elements
    document.querySelectorAll('.output').forEach(out => {
      out.textContent = '0.00';
    });
  });
});
