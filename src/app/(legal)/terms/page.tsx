import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: '利用規約 | ECHO',
    description: 'ECHO - 人格が成長するAIとのX運用アプリの利用規約',
}

export default function TermsPage() {
    return (
        <article>
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm hover:underline mb-4"
                    style={{ color: 'var(--accent)' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    トップに戻る
                </Link>
                <h1
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    利用規約
                </h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    最終更新日: 2025年1月1日
                </p>
            </div>

            <div className="prose prose-sm max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第1条（適用）
                    </h2>
                    <p className="leading-relaxed">
                        本利用規約（以下「本規約」）は、ECHO（以下「本サービス」）の利用条件を定めるものです。
                        登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第2条（利用登録）
                    </h2>
                    <p className="leading-relaxed">
                        本サービスにおいて、利用登録の申請者が以下の事由に該当する場合、当社は利用登録を拒否することがあり、その理由について一切の開示義務を負わないものとします。
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>虚偽の事項を届け出た場合</li>
                        <li>本規約に違反したことがある者からの申請である場合</li>
                        <li>その他、当社が利用登録を相当でないと判断した場合</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第3条（禁止事項）
                    </h2>
                    <p className="leading-relaxed">
                        ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>本サービスの他のユーザー、または第三者の知的財産権を侵害する行為</li>
                        <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                        <li>不正アクセス、またはこれを試みる行為</li>
                        <li>その他、当社が不適切と判断する行為</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第4条（本サービスの提供の停止等）
                    </h2>
                    <p className="leading-relaxed">
                        当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
                        <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                        <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第5条（免責事項）
                    </h2>
                    <p className="leading-relaxed">
                        当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。
                        また、本サービスに関してユーザーと第三者との間において生じた取引、連絡または紛争等について、当社は一切責任を負いません。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第6条（AIコンテンツについて）
                    </h2>
                    <p className="leading-relaxed">
                        本サービスで生成されるコンテンツはAIによって作成されます。生成されたコンテンツの正確性、適切性について、当社は保証いたしません。
                        ユーザーは、AIが生成したコンテンツを投稿する前に内容を確認し、自己責任において投稿してください。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第7条（利用規約の変更）
                    </h2>
                    <p className="leading-relaxed">
                        当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。
                        なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        第8条（準拠法・裁判管轄）
                    </h2>
                    <p className="leading-relaxed">
                        本規約の解釈にあたっては、日本法を準拠法とします。
                        本サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。
                    </p>
                </section>
            </div>
        </article>
    )
}
