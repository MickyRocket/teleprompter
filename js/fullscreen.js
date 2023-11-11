const closeButton = document.getElementById('close-button');

closeButton.addEventListener('click', closeKiosk);

function closeKiosk() {
  // Close the current window (Chrome in kiosk mode)
  window.close();
}