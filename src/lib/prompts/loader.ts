import fs from 'fs'
import path from 'path'

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

/**
 * 共通プロンプト（common.txt）を先頭に付加してプロンプトファイルを読み込む
 * @param filename - 読み込むプロンプトファイル名（例: 'thought-log.txt'）
 * @returns 共通プロンプト + 個別プロンプトの結合文字列
 */
export function loadPrompt(filename: string): string {
    const commonPath = path.join(PROMPTS_DIR, 'common.txt')
    const promptPath = path.join(PROMPTS_DIR, filename)

    const commonContent = fs.readFileSync(commonPath, 'utf-8')
    const promptContent = fs.readFileSync(promptPath, 'utf-8')

    return `${commonContent}\n\n${promptContent}`
}

/**
 * プロンプト内の変数を置換する
 * @param prompt - プロンプト文字列
 * @param variables - 置換する変数のマップ（例: { thought_log: '...' }）
 * @returns 変数置換後のプロンプト
 */
export function fillPromptVariables(
    prompt: string,
    variables: Record<string, string>
): string {
    let result = prompt
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return result
}

/**
 * プロンプトを読み込んで変数を置換する
 * @param filename - 読み込むプロンプトファイル名
 * @param variables - 置換する変数のマップ
 * @returns 変数置換後のプロンプト
 */
export function loadAndFillPrompt(
    filename: string,
    variables: Record<string, string>
): string {
    const prompt = loadPrompt(filename)
    return fillPromptVariables(prompt, variables)
}
