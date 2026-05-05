import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    // 1. Transporter setup with EXPLICIT Host and Port for Render
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // 465 ke liye true hota hai
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Cloud deployment me timeout se bachne ke liye extra settings:
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 sec tak wait karega connection ke liye
    });

    // 2. Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: options.html, 
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Email Error Detail:", error);
    throw new Error(error.message || 'Email could not be sent');
  }
};