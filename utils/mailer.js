import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // WAPAS PURANA WALA SIMPLE TARIQA
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: options.html, 
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
  } catch (error) {
    console.error("Email bhejte waqt error aayi:", error);
    throw new Error('Email could not be sent');
  }
};