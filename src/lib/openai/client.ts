import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('Missing OPENAI_API_KEY environment variable')
        }
        openaiClient = new OpenAI({ apiKey })
    }
    return openaiClient
}

/**
 * OpenAI APIを呼び出してJSON形式の応答を取得する
 * @param systemPrompt - システムプロンプト（共通プロンプト + 個別プロンプト）
 * @param userContent - ユーザーコンテンツ（オプション）
 * @returns パースされたJSONオブジェクト
 */
export async function callOpenAIWithJSON<T>(
    systemPrompt: string,
    userContent?: string
): Promise<T> {
    const client = getOpenAIClient()

    const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
    ]

    if (userContent) {
        messages.push({ role: 'user', content: userContent })
    }

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
        throw new Error('OpenAI returned empty response')
    }

    try {
        const parsed = JSON.parse(content) as T
        return parsed
    } catch (error) {
        console.error('Failed to parse OpenAI response as JSON:', content)
        throw new Error('Failed to parse OpenAI response as JSON')
    }
}
