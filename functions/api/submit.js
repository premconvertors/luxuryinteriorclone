// /functions/api/submit.js

export async function onRequestPost({ request }) {
  // 1. Get Form and reCAPTCHA Data
  const formData = await request.formData();
  const recaptchaToken = formData.get('g-recaptcha-response');

  // --- RECAPCTHA VERIFICATION ---
  const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;

  try {
    const recaptchaResponse = await fetch(recaptchaVerifyUrl, { method: 'POST' });
    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      // reCAPTCHA failed validation
      return new Response('reCAPTCHA verification failed.', { status: 403 });
    }

    // --- FORWARD DATA TO GOOGLE SHEET ---
    // The form data is already in the correct format for the Apps Script URL
    const sheetResponse = await fetch(env.SCRIPT_URL, {
      method: 'POST',
      body: formData, // Pass the entire FormData object
    });

    if (sheetResponse.ok) {
      // Success response to the user
      return new Response('Callback requested successfully!', { status: 200 });
    } else {
      // Failed to communicate with Google Sheet
      return new Response('Form submission failed on the backend.', { status: 500 });
    }

  } catch (error) {
    console.error(error);
    return new Response('An internal error occurred.', { status: 500 });
  }
}