import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
    title: 'プライバシーポリシー | ECHO',
    description: 'ECHO - 人格が成長するAI Twitter運用アプリのプライバシーポリシー',
}

export default function PrivacyPage() {
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
                    プライバシーポリシー
                </h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    最終更新日: 2025年1月1日
                </p>
            </div>

            <div className="prose prose-sm max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        1. 収集する情報
                    </h2>
                    <p className="leading-relaxed">
                        当サービスでは、以下の情報を収集します：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>メールアドレス（アカウント登録時）</li>
                        <li>思考ログ（ユーザーが入力する内容）</li>
                        <li>X（Twitter）アカウント情報（連携時）</li>
                        <li>投稿したツイートとその反応データ</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        2. 情報の利用目的
                    </h2>
                    <p className="leading-relaxed">
                        収集した情報は以下の目的で利用します：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>本サービスの提供・運営</li>
                        <li>AIによる人格成長機能の提供</li>
                        <li>ツイート生成と投稿機能の提供</li>
                        <li>サービス改善のための分析</li>
                        <li>ユーザーサポート対応</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        3. 思考ログデータの取り扱い
                    </h2>
                    <p className="leading-relaxed">
                        ユーザーが入力する思考ログは、AIによる人格形成と成長の機能を提供するために使用されます。
                        これらのデータはユーザーアカウントに紐づいて安全に保管され、他のユーザーやサービス外部に公開されることはありません。
                    </p>
                    <p className="leading-relaxed mt-2">
                        ただし、AIモデルの改善目的で匿名化された形でデータを分析に使用する場合があります。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        4. 第三者への提供
                    </h2>
                    <p className="leading-relaxed">
                        当サービスは、以下の場合を除き、個人情報を第三者に提供しません：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>ユーザーの同意がある場合</li>
                        <li>法令に基づく開示請求があった場合</li>
                        <li>サービス運営に必要な業務委託先への提供（この場合も適切な契約により保護されます）</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        5. 外部サービスとの連携
                    </h2>
                    <p className="leading-relaxed">
                        本サービスでは、以下の外部サービスと連携します：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>X（Twitter）</strong>: ツイートの投稿と反応データの取得</li>
                        <li><strong>OpenAI</strong>: AIによるテキスト生成と分析</li>
                        <li><strong>Supabase</strong>: データベース管理と認証</li>
                    </ul>
                    <p className="leading-relaxed mt-2">
                        各サービスは、それぞれのプライバシーポリシーに基づいてデータを取り扱います。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        6. データの保持期間
                    </h2>
                    <p className="leading-relaxed">
                        ユーザーデータは、アカウントが有効な間は保持されます。
                        アカウント削除時には、関連するすべてのデータ（思考ログ、生成された人格データ、ツイート履歴等）が削除されます。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        7. セキュリティ
                    </h2>
                    <p className="leading-relaxed">
                        当サービスは、個人情報の漏洩、紛失、改ざんを防ぐため、適切なセキュリティ対策を講じています。
                        通信はSSL/TLSで暗号化され、データは安全なクラウドインフラストラクチャに保管されます。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        8. ユーザーの権利
                    </h2>
                    <p className="leading-relaxed">
                        ユーザーは、自己の個人情報について以下の権利を有します：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>情報へのアクセス権</li>
                        <li>情報の訂正権</li>
                        <li>情報の削除権（アカウント削除時）</li>
                        <li>データポータビリティの権利</li>
                    </ul>
                    <p className="leading-relaxed mt-2">
                        これらの権利行使については、お問い合わせページからご連絡ください。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        9. ポリシーの変更
                    </h2>
                    <p className="leading-relaxed">
                        当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
                        重要な変更がある場合は、サービス内で通知いたします。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                        10. お問い合わせ
                    </h2>
                    <p className="leading-relaxed">
                        本プライバシーポリシーに関するお問い合わせは、
                        <Link href="/contact" className="underline" style={{ color: 'var(--accent)' }}>
                            お問い合わせページ
                        </Link>
                        よりご連絡ください。
                    </p>
                </section>
            </div>
        </article>
    )
}
