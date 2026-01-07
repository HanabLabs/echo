'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Cat, Dog, Rabbit, Bird, PawPrint, MessageCircle, Send, Loader2, Twitter } from 'lucide-react'
import TweetCard from '@/components/tweet/TweetCard'

interface Message {
    id: string
    type: 'user' | 'partner'
    content: string
    timestamp: Date
}

interface UserProfile {
    partner_name: string
    partner_icon: string
    thought_log_count_short: number
    thought_log_count_long: number
}

interface GeneratedTweet {
    id: string
    type: 'reflective' | 'positive' | 'honest'
    content: string
}

const ICON_MAP: Record<string, typeof Cat> = {
    cat: Cat,
    dog: Dog,
    rabbit: Rabbit,
    bird: Bird,
    bear: PawPrint,
}

export default function HomePage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [mode, setMode] = useState<'idle' | 'thought' | 'tweet'>('idle')
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweet[]>([])
    const [totalThoughtLogs, setTotalThoughtLogs] = useState(0)
    const [isDiscardConfirming, setIsDiscardConfirming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // localStorageからチャット履歴を復元
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem('chat_messages')
            if (savedMessages) {
                const parsed = JSON.parse(savedMessages)
                // timestampをDate型に変換
                const restored = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }))
                setMessages(restored)
            }
        } catch (error) {
            console.error('Failed to restore chat messages:', error)
        }
    }, [])

    // メッセージが更新されたらlocalStorageに保存
    useEffect(() => {
        if (messages.length > 0) {
            try {
                localStorage.setItem('chat_messages', JSON.stringify(messages))
            } catch (error) {
                console.error('Failed to save chat messages:', error)
            }
        }
    }, [messages])

    useEffect(() => {
        scrollToBottom()
    }, [messages, generatedTweets])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('partner_name, partner_icon, thought_log_count_short, thought_log_count_long')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setProfile(profileData)
            }

            // 総思考ログ数を取得
            const { count } = await supabase
                .from('thought_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            setTotalThoughtLogs(count || 0)

            // 既存の生成済みツイートを取得
            const { data: tweets } = await supabase
                .from('tweets_generated')
                .select('id, type, content')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3)

            if (tweets && tweets.length > 0) {
                setGeneratedTweets(tweets as GeneratedTweet[])
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        // 初期メッセージ（履歴がない場合のみ）
        if (profile && messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                type: 'partner',
                content: `こんにちは！${profile.partner_name}です。\n今日はどんなことを考えていますか？\n\n「思考ログを入力」ボタンからあなたの考えを教えてください。`,
                timestamp: new Date(),
            }
            setMessages([greeting])
        }
    }, [profile])

    const IconComponent = profile ? ICON_MAP[profile.partner_icon] || Cat : Cat

    const handleThoughtLogSubmit = async () => {
        if (!inputValue.trim() || loading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setLoading(true)

        try {
            const response = await fetch('/api/thought-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inputValue }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'エラーが発生しました')
            }

            const partnerMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'partner',
                content: data.message || 'ありがとう。あなたの思いを受け取りました。',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, partnerMessage])
            setTotalThoughtLogs(prev => prev + 1)
            setLoading(false) // ローディングを先に解除

            // プロファイルを更新（バックグラウンドで実行）
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: updatedProfile } = await supabase
                    .from('user_profiles')
                    .select('thought_log_count_short, thought_log_count_long')
                    .eq('id', user.id)
                    .single()

                if (updatedProfile && profile) {
                    setProfile({ ...profile, ...updatedProfile })
                }
            }
        } catch (error) {
            console.error('Thought log error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'partner',
                content: 'ごめんなさい、エラーが発生しました。もう一度試してください。',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
            setLoading(false) // エラー時もローディング解除
        } finally {
            setMode('idle')
        }
    }

    const handleGenerateTweets = async () => {
        if (loading) return
        setLoading(true)

        const requestMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: 'ツイートを生成して',
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, requestMessage])

        try {
            const response = await fetch('/api/tweets/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'エラーが発生しました')
            }

            const partnerMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'partner',
                content: '3つのツイート案を作成しました。気に入ったものを選んで編集・投稿してください。',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, partnerMessage])
            setGeneratedTweets(data.tweets)
        } catch (error) {
            console.error('Generate tweets error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'partner',
                content: 'ごめんなさい、ツイートの生成中にエラーが発生しました。',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
            setMode('idle')
        }
    }

    const handleTweetPosted = (tweetId: string) => {
        // 投稿成功後、全てのツイートカードを削除
        setGeneratedTweets([])
        const successMessage: Message = {
            id: Date.now().toString(),
            type: 'partner',
            content: '投稿が完了しました！🎉\n新しいツイートを作成する場合は、また「投稿する」ボタンを押してくださいね。',
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, successMessage])
    }

    const handleTweetUpdated = (tweetId: string, newContent: string) => {
        setGeneratedTweets(prev =>
            prev.map(t => (t.id === tweetId ? { ...t, content: newContent } : t))
        )
    }

    const canGenerateTweets = totalThoughtLogs >= 5
    const remainingLogs = Math.max(0, 5 - totalThoughtLogs)

    return (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {message.type === 'partner' && (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'var(--accent)' }}
                            >
                                <IconComponent className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div
                            className="max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap"
                            style={{
                                backgroundColor: message.type === 'user' ? 'var(--chat-user)' : 'var(--chat-partner)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}


                {/* Generated Tweets */}
                {generatedTweets.length > 0 && (
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                生成されたツイート案
                            </p>
                            {!isDiscardConfirming ? (
                                <button
                                    onClick={() => setIsDiscardConfirming(true)}
                                    className="text-sm px-3 py-1 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        color: 'var(--text-muted)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    すべて破棄
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsDiscardConfirming(false)}
                                        className="text-sm px-3 py-1 rounded-lg transition-all hover:opacity-80"
                                        style={{
                                            color: 'var(--text-primary)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('/api/tweets/discard', {
                                                    method: 'POST',
                                                })
                                                if (response.ok) {
                                                    setGeneratedTweets([])
                                                    setIsDiscardConfirming(false)
                                                    const discardMessage: Message = {
                                                        id: Date.now().toString(),
                                                        type: 'partner',
                                                        content: 'ツイート案を破棄しました。また新しく作成できますよ。',
                                                        timestamp: new Date(),
                                                    }
                                                    setMessages(prev => [...prev, discardMessage])
                                                }
                                            } catch (error) {
                                                console.error('Discard error:', error)
                                                setIsDiscardConfirming(false)
                                            }
                                        }}
                                        className="text-sm px-3 py-1 rounded-lg transition-all hover:opacity-90"
                                        style={{
                                            color: 'white',
                                            backgroundColor: '#e94560',
                                            border: '1px solid #e94560',
                                        }}
                                    >
                                        破棄する
                                    </button>
                                </div>
                            )}
                        </div>
                        {generatedTweets.map((tweet) => (
                            <TweetCard
                                key={tweet.id}
                                tweet={tweet}
                                onPosted={() => handleTweetPosted(tweet.id)}
                                onUpdated={(newContent) => handleTweetUpdated(tweet.id, newContent)}
                            />
                        ))}
                    </div>
                )}


                {loading && (
                    <div className="flex gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'var(--accent)' }}
                        >
                            <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div
                            className="rounded-2xl px-4 py-3 flex items-center gap-1"
                            style={{ backgroundColor: 'var(--chat-partner)' }}
                        >
                            <span style={{ color: 'var(--text-primary)' }}>入力中</span>
                            <span className="flex gap-0.5">
                                <span className="animate-bounce" style={{ animationDelay: '0ms', color: 'var(--text-primary)' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '150ms', color: 'var(--text-primary)' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '300ms', color: 'var(--text-primary)' }}>.</span>
                            </span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="sticky bottom-0 p-4 pb-6"
                style={{
                    background: 'linear-gradient(to top, var(--bg-primary), var(--bg-primary) 80%, transparent)',
                }}
            >
                {mode === 'thought' ? (
                    <div className="space-y-3">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="今考えていることを自由に書いてください..."
                            className="input min-h-[100px] resize-none"
                            disabled={loading}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('idle')}
                                className="btn btn-secondary flex-1"
                                disabled={loading}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleThoughtLogSubmit}
                                disabled={!inputValue.trim() || loading}
                                className="btn btn-primary flex-1"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        送信
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMode('thought')}
                            className="btn btn-secondary flex-1"
                            disabled={loading}
                        >
                            <MessageCircle className="w-4 h-4" />
                            思考ログを入力
                        </button>
                        <button
                            onClick={handleGenerateTweets}
                            disabled={!canGenerateTweets || loading}
                            className="btn btn-primary flex-1"
                            title={!canGenerateTweets ? `あと${remainingLogs}件の思考ログが必要です` : ''}
                        >
                            <Twitter className="w-4 h-4" />
                            投稿する
                            {!canGenerateTweets && (
                                <span
                                    className="text-xs ml-1 px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                >
                                    残り{remainingLogs}件
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
