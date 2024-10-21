
import { SignOptions, VerifyOptions } from "jsonwebtoken"
import { SessionDocument } from "../models/sessionModel"
import { UserDocument } from "../models/user.model"

import jwt from "jsonwebtoken"
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env"



export type RefreshTokenPayload = {

    sessionId: SessionDocument["_id"],
}


export type AccessTokenPayload = {
    sessionId: SessionDocument["_id"],
    userId: UserDocument["_id"],
}


type SignOptionsAndSecret = SignOptions & {
    secret: string
}

const defaults : SignOptions = {
    audience: ["user"],

}

const accessTokenSignOptions: SignOptionsAndSecret = {

    expiresIn: "15m",
    secret: JWT_SECRET,
}

export const refreshTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "7d",
    secret: JWT_REFRESH_SECRET, 
}



export const signToken = (
    payload: AccessTokenPayload | RefreshTokenPayload,
    options?: SignOptionsAndSecret
    
) => {
    const { secret, ...signOpts } = options || accessTokenSignOptions
    return jwt.sign(payload, secret, {
        ...defaults,
        ...signOpts
    })
}


export const verifyToken = <TPayload extends object = AccessTokenPayload>(
    token: string,
    options?: VerifyOptions & { secret: string }


) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options || {}
    try {
        const payload = jwt.verify
        (token, secret, {
            ...defaults,
            ...verifyOpts
        }) as TPayload

            return {
                payload,
            }


    } catch (error: any) {
        return { error: error.message }
    }
}