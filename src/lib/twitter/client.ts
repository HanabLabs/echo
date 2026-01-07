/**
 * Twitter v2 API クライアント
 * OAuth 2.0 User Context を使用
 */

const TWITTER_API_BASE = 'https://api.twitter.com/2'

interface TwitterTokens {
    accessToken: string
    refreshToken: string
}

interface TweetResponse {
    data: {
        id: string
        text: string
    }
}

interface TweetMetrics {
    public_metrics: {
        retweet_count: number
        reply_count: number
        like_count: number
        quote_count: number
        impression_count?: number
    }
}

interface TokenRefreshResponse {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    scope: string
}

/**
 * ツイートを投稿
 */
export async function postTweet(
    text: string,
    tokens: TwitterTokens
): Promise<{ tweetId: string; text: string }> {
    const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Twitter API error:', response.status, errorData)

        if (response.status === 401) {
            throw new TwitterAuthError('X認証が無効です。再度X連携を行ってください。')
        }

        throw new TwitterAPIError(
            `ツイートの投稿に失敗しました: ${errorData.detail || errorData.title || 'Unknown error'}`,
            response.status
        )
    }

    const data: TweetResponse = await response.json()
    return {
        tweetId: data.data.id,
        text: data.data.text,
    }
}

/**
 * ツイートのメトリクスを取得
 */
export async function getTweetMetrics(
    tweetId: string,
    tokens: TwitterTokens
): Promise<TweetMetrics | null> {
    const response = await fetch(
        `${TWITTER_API_BASE}/tweets/${tweetId}?tweet.fields=public_metrics`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
            },
        }
    )

    if (!response.ok) {
        if (response.status === 404) {
            return null
        }

        const errorData = await response.json().catch(() => ({}))
        console.error('Twitter API error:', response.status, errorData)
        throw new TwitterAPIError(
            `メトリクスの取得に失敗しました`,
            response.status
        )
    }

    const data = await response.json()
    return data.data
}

/**
 * アクセストークンをリフレッシュ
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<TokenRefreshResponse> {
    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('Twitter OAuth credentials not configured')
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Token refresh error:', response.status, errorData)
        throw new TwitterAuthError('トークンのリフレッシュに失敗しました')
    }

    return response.json()
}

/**
 * OAuth 2.0 PKCE 認証URL生成
 */
export function generateAuthUrl(state: string, codeChallenge: string): string {
    const clientId = process.env.TWITTER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`

    if (!clientId) {
        throw new Error('Twitter OAuth credentials not configured')
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'tweet.read tweet.write users.read offline.access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    })

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
}

/**
 * 認証コードをトークンに交換
 */
export async function exchangeCodeForToken(
    code: string,
    codeVerifier: string
): Promise<TokenRefreshResponse> {
    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/twitter`

    if (!clientId || !clientSecret) {
        throw new Error('Twitter OAuth credentials not configured')
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Token exchange error:', response.status, errorData)
        throw new TwitterAuthError('認証トークンの取得に失敗しました')
    }

    return response.json()
}

/**
 * 現在のユーザー情報を取得
 */
export async function getMe(accessToken: string): Promise<{ id: string; username: string; name: string }> {
    const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Get user error:', response.status, errorData)
        throw new TwitterAuthError('ユーザー情報の取得に失敗しました')
    }

    const data = await response.json()
    return data.data
}

// カスタムエラークラス
export class TwitterAPIError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.name = 'TwitterAPIError'
        this.statusCode = statusCode
    }
}

export class TwitterAuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TwitterAuthError'
    }
}
