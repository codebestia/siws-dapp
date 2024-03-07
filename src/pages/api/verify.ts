import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import { verifySIWS } from "@talismn/siws"

type Data = {
  error?: string
  jwtToken?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const nonce = req.cookies["nonce"]
    if (!nonce) return res.status(401).json({ error: " Invalid session." })
    const { signature, message, address } = JSON.parse(req.body)
    const siwsMessage = await verifySIWS(message, signature, address)
    if (nonce !== siwsMessage.nonce)
      res.status(401).json({ error: "Unknown nonce" })
    const jwtPayload = {
      address: siwsMessage.address,
    }

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, {
      algorithm: "HS256",
    })
    res.status(200).json({ jwtToken })
  } catch (e: any) {
    res.status(401).json({ error: e.message ?? "Invalid SIWS signature!" })
  }
}