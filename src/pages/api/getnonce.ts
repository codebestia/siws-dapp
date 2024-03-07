import { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const nonce = crypto.randomUUID()
  
  res.setHeader("Set-Cookie", `nonce=${nonce}; Path=/; HttpOnly; Secure; SameSite=Strict`)
  res.status(200).json({ nonce })
}