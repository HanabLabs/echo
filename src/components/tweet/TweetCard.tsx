'use client'

import { useState } from 'react'
import { Edit2, Check, X, Loader2, Send } from 'lucide-react'

interface Tweet {
    id: string
    type: 'reflective' | 'positive' | 'honest'
    content: string
}

interface TweetCardProps {
    tweet: Tweet
    onPosted: () => void
    onUpdated: (newContent: string) => void
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    reflective: { label: '内省的', color: '#6b8e6b' },
    positive: { label: '前向き', color: '#c2a873' },
    honest: { label: '率直', color: '#7289da' },
}

export default function TweetCard({ tweet, onPosted, onUpdated }: TweetCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(tweet.content)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const typeInfo = TYPE_LABELS[tweet.type] || { label: tweet.type, color: 'var(--accent)' }

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/tweets/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tweetId: tweet.id,
                    content: editContent.trim()
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || '更新に失敗しました')
            }

            onUpdated(editContent.trim())
            setIsEditing(false)
        } catch (err) {
            console.error('Update error:', err)
            setError(err instanceof Error ? err.message : '更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handlePost = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/tweets/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generatedTweetId: tweet.id }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '投稿に失敗しました')
            }

            onPosted()
        } catch (err) {
            console.error('Post error:', err)
            setError(err instanceof Error ? err.message : '投稿に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelEdit = () => {
        setEditContent(tweet.content)
        setIsEditing(false)
        setError(null)
    }

    return (
        <div
            className="rounded-xl p-4 animate-fade-in"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                        backgroundColor: typeInfo.color,
                        color: 'white',
                    }}
                >
                    {typeInfo.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tweet.content.length}/140
                </span>
            </div>

            {/* Content */}
            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="input min-h-[80px] resize-none text-sm"
                        maxLength={140}
                        disabled={loading}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancelEdit}
                            className="btn btn-secondary flex-1 text-sm py-2"
                            disabled={loading}
                        >
                            <X className="w-4 h-4" />
                            キャンセル
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="btn btn-primary flex-1 text-sm py-2"
                            disabled={!editContent.trim() || loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    保存
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <p
                        className="text-sm mb-4 whitespace-pre-wrap leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {tweet.content}
                    </p>

                    {error && (
                        <div
                            className="text-xs p-2 rounded-lg mb-3"
                            style={{ backgroundColor: 'var(--error)', color: 'white' }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn btn-secondary flex-1 text-sm py-2"
                            disabled={loading}
                        >
                            <Edit2 className="w-4 h-4" />
                            編集
                        </button>
                        <button
                            onClick={handlePost}
                            className="btn btn-primary flex-1 text-sm py-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    投稿
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
