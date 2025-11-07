import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import axios from 'axios'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/auth/google/callback'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/integrations?error=access_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_request`)
  }

  try {
    // Decodificar state para obter userId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId } = stateData

    // Trocar código por tokens
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      throw new Error('Token de acesso não recebido')
    }

    // Salvar tokens no banco via API de integrações
    const response = await axios.post(`${process.env.NEXTAUTH_URL}/api/integrations`, {
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope,
    }, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    })

    if (response.data.status === 'ok') {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/integrations?success=connected`)
    } else {
      throw new Error('Erro ao salvar integração')
    }

  } catch (error) {
    console.error('Erro no callback OAuth:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/integrations?error=integration_failed`)
  }
} 