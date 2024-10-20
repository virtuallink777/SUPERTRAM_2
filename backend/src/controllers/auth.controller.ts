import { z } from "zod";
import catchErrors from "../utils/catchErrors";
import { createAccount, loginUser } from "../services/auth.services";
import { CREATED, OK } from "../constans/http";
import { setAuthCookies } from "../utils/cookies";
import { loginSchema, registerSchema } from "../controllers/auth.schemas";



export const registerHandler = catchErrors(async (req, res) => {
  // validate request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"]
  });

  // call services

  const result = await createAccount(request);

  // Check if there was an error during account creation
  if (result.error) {
    return res.status(400).json({ error: result.message });
  }

  const { user, accessToken, refreshToken } = result;

  // return response

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({...req.body, userAgent: req.headers["user-agent"]});

  const {accessToken, refreshToken} = await loginUser(request);

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(OK)
    .json({message: "Logueado correctamente"});

});
