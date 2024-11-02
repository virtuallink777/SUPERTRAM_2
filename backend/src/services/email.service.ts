import { transport } from "../config/nodemailer";
import { UserDocument } from "../models/user.model";
import { VerificationCodeDocument } from "../models/verificationCode.model";

export async function sendVerificationEmail(
  user: UserDocument,
  verificationCode: VerificationCodeDocument
) {
  try {
    // Construimos la URL de verificación usando la ruta del backend
    const verificationUrl = `http://localhost:4004/api/auth/email/verify/${verificationCode._id}`;

    const info = await transport.sendMail({
      from: '"SUPERTRAM" <negocios.caps@gmail.com>',
      to: user.email,
      subject: "Verifica tu correo electrónico - SUPERTRAM",
      text: `Por favor verifica tu correo electrónico haciendo clic en este enlace: ${verificationUrl}`,
      html: `
        <p>Por favor verifica tu correo electrónico haciendo clic en este enlace:</p>
        <a href="${verificationUrl}">Verificar email</a>
      `,
    });

    console.log("Email enviado exitosamente:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw error;
  }
}
