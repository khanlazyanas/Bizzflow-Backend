import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    // 1. Transporter banao (Jo email bhejega)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // service: 'gmail' ki jagah seedha host diya
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 🔥 ASLI FIX YAHAN HAI: Render ko force karega purana IPv4 network use karne ke liye
      family: 4 
    });

    // 2. Email ke options set karo
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: options.html, // HTML format use karenge taaki email sundar dikhe
    };

    // 3. Email bhej do
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Email bhejte waqt error aayi:", error);
    throw new Error('Email could not be sent');
  }
};