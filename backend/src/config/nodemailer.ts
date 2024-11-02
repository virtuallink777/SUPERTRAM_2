import nodemailer from "nodemailer";
import { GMAIL_SECRET } from "../constans/env";

export const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: "negocios.caps@gmail.com",
    pass: GMAIL_SECRET,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
