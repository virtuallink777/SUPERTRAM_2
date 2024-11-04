import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../constans/http";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/sessionModel";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import {
  fiveMinutesAgo,
  ONE_DAY_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import jwt from "jsonwebtoken";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendVerificationEmail } from "../services/email.service";
import SendmailTransport from "nodemailer/lib/sendmail-transport";
import { getPasswordResetTemplate } from "../utils/emailTemplates";
import { transport } from "../config/nodemailer";
import { hashValue } from "../utils/bcrypt";

export type createAccountparams = {
  email: string;
  password: string;

  userAgent?: string;
};

// CREATE ACCOUNT

export const createAccount = async (data: createAccountparams) => {
  try {
    // verify existing user doesnt exist

    const existingUser = await UserModel.exists({ email: data.email });

    appAssert(!existingUser, CONFLICT, "El usuario ya existe");

    if (existingUser) {
      return {
        error: true,
        message: "El usuario ya existe",
      };
    }

    // create user

    const user = await UserModel.create({
      email: data.email,
      password: data.password,
    });

    // create verification code

    const userId = user._id;

    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerificationCodeType.EmailVerification,
      expiresAt: oneYearFromNow(),
    });
    console.log("Código de verificación creado:", verificationCode);

    // send verificaction email

    try {
      await sendVerificationEmail(user, verificationCode);
      console.log("Email de verificacion enviado exitosamente");
    } catch (emailError) {
      console.error("Error al enviar email de verificación:", emailError);
      // Continuamos con el proceso aunque falle el envío del email
    }

    // create session

    const session = await SessionModel.create({
      userId,
      userAgent: data.userAgent,
    });

    console.log("Sesión creada:", session);

    // sign access token & refresh token

    const sessionInfo = {
      sessionId: session._id,
    };

    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

    const accessToken = signToken({ ...sessionInfo, userId });

    console.log("Tokens creados:", { accessToken, refreshToken });

    // return user & tokens

    return {
      user: user.omitPassword(),

      accessToken,
      refreshToken,
    };
  } catch (error) {
    // En caso de que ocurra un error inesperado
    return {
      error: true,
      message: "Error en la creación de la cuenta",
    };
  }
};

type LoginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

// LOGUEO

export const loginUser = async ({
  email,
  password,
  userAgent,
}: LoginParams) => {
  // get user by email

  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Credenciales incorrectas");

  // validate password from the request

  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Credenciales incorrectas");

  const userId = user._id;

  // create a session

  const session = await SessionModel.create({
    userId,
    userAgent,
    expiresAt: thirtyDaysFromNow(),
  });

  const sessionInfo = {
    sessionId: session._id,
  };
  // sign access token & refresh token

  const refreshToken = jwt.sign({ sessionInfo }, JWT_REFRESH_SECRET, {
    audience: ["user"],
    expiresIn: "30d",
  });
  const accessToken = jwt.sign(
    { userId: user._id, ...sessionInfo },
    JWT_SECRET,
    {
      audience: ["user"],
      expiresIn: "15m",
    }
  );

  // return user & tokens

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

const EXPIRATION_BUFFER_MS = 60000; // 1 minute

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();

  // Add a buffer to the session expiration check
  appAssert(
    session && session.expiresAt.getTime() > now - EXPIRATION_BUFFER_MS,
    UNAUTHORIZED,
    "Session expired"
  );

  // Agregamos logs para debugging
  console.log("Tiempos de sesión:", {
    sessionExpiresAt: session?.expiresAt,
    sessionExpiresAtTimestamp: session?.expiresAt?.getTime(),
    currentTime: now,
    currentTimeDate: new Date(now),
    diferencia: session?.expiresAt?.getTime() - now,
  });

  // Primero verificamos si la sesión existe
  if (!session) {
    throw new Error("Session not found");
  }

  console.log("Tiempo actual:", new Date(now));
  console.log("Tiempo de expiración:", session.expiresAt);

  // Luego verificamos la expiración
  if (session.expiresAt.getTime() <= now) {
    throw new Error(
      `Session expired. Expires: ${session.expiresAt}, Current: ${new Date(
        now
      )}`
    );
  }

  // Si llegamos aquí, la sesión es válida
  console.log("Sesión válida, continuando...");

  // refresh the session if it expires in the next 24 hours
  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  // get verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });

  appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

  // update user to verified true
  const UpdateUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );
  appAssert(UpdateUser, INTERNAL_SERVER_ERROR, "faild to verify email");

  // delete verification code
  await validCode.deleteOne();
  // return user
  return {
    user: UpdateUser.omitPassword(),
  };
};

// reset password

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log(`[Password Reset] Iniciando proceso para email: ${email}`);

    // get user by email
    const user = await UserModel.findOne({ email });
    appAssert(user, NOT_FOUND, "Usuario no encontrado");
    console.log(`[Password Reset] Usuario encontrado con ID: ${user._id}`);

    // check mail rate limit
    const fiveMinAgo = fiveMinutesAgo();
    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      createdAt: { $gt: fiveMinAgo },
    });

    console.log(`[Password Reset] Intentos en los últimos 5 minutos: ${count}`);
    appAssert(
      count <= 1,
      TOO_MANY_REQUESTS,
      "Demasiadas solicitudes, por favor intente más tarde"
    );

    // create verification code
    const expiresAt = oneHourFromNow();
    const verificationCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      expiresAt,
    });
    console.log(
      `[Password Reset] Código de verificación creado: ${verificationCode._id}`
    );

    // generate reset URL
    const url = `${APP_ORIGIN}/password/reset?code=${
      verificationCode._id
    }&exp=${expiresAt.getTime()}`;

    // get email template
    const emailTemplate = getPasswordResetTemplate(url);

    try {
      // send verification email
      await transport.sendMail({
        from: '"Tu Aplicación" <negocios.caps@gmail.com>',
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      console.log(
        `[Password Reset] Email enviado exitosamente a: ${user.email}`
      );

      // Limpiar códigos antiguos
      const deleteResult = await VerificationCodeModel.deleteMany({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        _id: { $ne: verificationCode._id },
      });
      console.log(
        `[Password Reset] Códigos antiguos eliminados: ${deleteResult.deletedCount}`
      );
    } catch (emailError) {
      console.error("[Password Reset] Error al enviar email:", emailError);

      // Eliminar el código de verificación si falla el envío
      await verificationCode.deleteOne();

      throw new Error(
        `Error al enviar el email de recuperación: ${
          (emailError as Error).message
        }`
      );
    }

    return {
      success: true,
      message: "Email de recuperación enviado exitosamente",
    };
  } catch (error) {
    console.error("[Password Reset] Error en el proceso:", error);

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      if (error.message.includes("TOO_MANY_REQUESTS")) {
        throw new Error(
          "Has solicitado demasiados resets. Por favor espera 5 minutos."
        );
      }
      if (error.message.includes("Usuario no encontrado")) {
        // Por seguridad, no revelamos si el usuario existe o no
        return {
          success: true,
          message:
            "Si el email existe, recibirás un enlace para restablecer tu contraseña",
        };
      }
      if (error.message.includes("Error al enviar el email")) {
        throw new Error(
          "No se pudo enviar el email. Por favor intenta más tarde."
        );
      }
    }

    // Error genérico
    throw new Error("Ocurrió un error al procesar tu solicitud");
  }
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  // get verificaction code
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });

  appAssert(validCode, NOT_FOUND, "Codigo invalido o ya expiro");

  // update the user password
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,

    {
      password: await hashValue(password),
    }
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Fallo el reset del password");

  // delete the verification code
  await validCode.deleteOne();

  // delete all sessions
  await SessionModel.deleteMany({
    userId: updatedUser._id,
  });

  return {
    user: updatedUser.omitPassword(),
  };
};
