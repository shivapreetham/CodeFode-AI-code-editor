import nodemailer from "nodemailer";

interface mailOptions {
  receiver: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async ({
  receiver,
  subject,
  text,
  html,
}: mailOptions) => {
  try {
    const sender = process.env.EMAIL_USER;
    const passkey = process.env.EMAIL_PASS;
    const transportOptions = {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: sender,
        pass: passkey,
      },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const mailOptions = {
      from: `CodeFode <${sender}>`,
      to: receiver,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    if (info.response && info.response.startsWith("250")) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
