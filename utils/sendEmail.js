import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // 1. Transporter banayein (Ye Gmail ka raasta banata hai)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 2. Email ka content set karein
  const mailOptions = {
    from: `BizFlow Admin <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Hum HTML bhejenge taaki mail sundar dikhe
  };

  // 3. Email bhej dein
  await transporter.sendMail(mailOptions);
};