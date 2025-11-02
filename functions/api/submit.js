export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const recaptchaToken = formData.get('g-recaptcha-response');
  const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
  
  // Set your acceptable threshold for v3 (0.0 to 1.0)
  const MIN_SCORE = 0.5; 

  try {
    // 1. Verify reCAPTCHA token with Google
    const recaptchaResponse = await fetch(recaptchaVerifyUrl, { method: 'POST' });
    const recaptchaData = await recaptchaResponse.json();

    // 💡 CRITICAL DEBUG STEP: Log the Google response to Cloudflare logs
    console.log('reCAPTCHA Data:', JSON.stringify(recaptchaData));

    // 2. Check for overall success AND score threshold
    if (!recaptchaData.success || recaptchaData.score < MIN_SCORE) {
      console.error('Recaptcha failed check. Score:', recaptchaData.score, 'Errors:', recaptchaData['error-codes']);
      return new Response(
          `reCAPTCHA verification failed. Score: ${recaptchaData.score}`, 
          { status: 403 }
      );
    }
    
    // 3. FORWARD DATA TO GOOGLE SHEET
    const sheetResponse = await fetch(env.SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (sheetResponse.ok) {
      return new Response('Callback requested successfully!', { status: 200 });
    } else {
      // Log the non-200 response details from Google Apps Script
      console.error('Google Sheet Apps Script failed with status:', sheetResponse.status);
      return new Response('Form submission failed on the backend.', { status: 500 });
    }

  } catch (error) {
    console.error('Uncaught error during form processing:', error.message);
    return new Response('An internal error occurred.', { status: 500 });
  }
}