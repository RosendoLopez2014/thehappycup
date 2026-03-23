import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.warn('RESEND_API_KEY not set — emails will not be sent')
}

export const resend = apiKey ? new Resend(apiKey) : null
