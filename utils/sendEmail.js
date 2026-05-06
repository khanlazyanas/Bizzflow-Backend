export const sendEmail = async (options) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY, // Render se aayega
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'BizFlow Workspace',
          email: process.env.EMAIL_FROM // Tumhara registered email
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API se Email fail ho gaya');
    }
    console.log("🚀 Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Email bhejte waqt API error aayi:", error);
    throw new Error('Email could not be sent');
  }
};