// auth/microsoft.js (หรือไฟล์ที่เก็บ loginWithMicrosoft)

const TENANT_ID = import.meta.env.VITE_TENANT_ID
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID
const REDIRECT = import.meta.env.VITE_REDIRECT_URI || import.meta.env.VITE_REDIRECT_LOCAL
const SCOPES    = 'openid profile email User.Read'

async function generatePKCE() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  )
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return { verifier, challenge }
}

export async function loginWithMicrosoft() {
  const { verifier, challenge } = await generatePKCE()
  sessionStorage.setItem('pkce_verifier', verifier)  // เก็บไว้ใช้ตอน callback

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT,
    scope:                 SCOPES,
    response_mode:         'query',
    state:                 crypto.randomUUID(),
    nonce:                 crypto.randomUUID(),
    code_challenge:        challenge,        
    code_challenge_method: 'S256',         
  })

  window.location.href =
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`
} 