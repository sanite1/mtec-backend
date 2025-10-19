import { createTransport } from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

// Create a transporter using Namecheap Email Hosting SMTP settings
// const transporter = createTransport({
//   host: "mail.privateemail.com",
//   port: 465,
//   secure: true,
//   requireTLS: true,
//   auth: {
//     user: process.env.AUTH_EMAIL,
//     pass: process.env.AUTH_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// Configure Handlebars for email templates
const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("src/services/nodemailer/templates"),
    defaultLayout: "",
  },
  viewPath: path.resolve("src/services/nodemailer/templates"),
};

// Use Handlebars for template compilation
transporter.use("compile", hbs(handlebarOptions));

// Verify connection configuration
transporter.verify((error: any, success: any) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send messages");
  }
});

export default transporter;
