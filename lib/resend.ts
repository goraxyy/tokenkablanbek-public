import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

// resend will be null when the API key is missing so callers can guard safely
export const resend = apiKey ? new Resend(apiKey) : null

// Set RESEND_FROM_EMAIL to an address on a domain verified in the Resend
// dashboard.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
