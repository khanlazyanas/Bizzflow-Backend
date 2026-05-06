// utils/sendEmail.js
export const sendEmail = async (options) => {
  try {
    
    const senderEmail = "anaskhan995620@gmail.com"; 

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY, 
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'BizFlow Workspace',
          email: senderEmail 
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: options.html
      })
    });

    const data = await response.json();

    // 2. Agar koi dikkat aati hai toh ab exact error samajh aayegi
    if (!response.ok) {
      console.error("❌ BREVO NE EMAIL REJECT KIYA. REASON:", JSON.stringify(data));
      throw new Error(data.message || 'API se Email fail ho gaya');
    }
    
    console.log("✅ EMAIL BHEJ DIYA GAYA! TO:", options.email);
  } catch (error) {
    console.error("🔥 EMAIL FUNCTION CRASH HUA:", error);
    throw new Error('Email nahi bheja ja saka');
  }
};