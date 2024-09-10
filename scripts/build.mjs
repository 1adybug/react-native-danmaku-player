import { readFile, rm, writeFile } from "fs/promises"
import { spawnAsync } from "soda-nodejs"

// @ts-check
async function main() {
    await rm("dist", { recursive: true, force: true })
    await spawnAsync("npx tsc -p .", { shell: true, stdio: "inherit" })
    const content = await readFile("README.md", "utf-8")
    const index = content.indexOf(`<!-- 类型开始 -->`)
    const end = content.indexOf(`<!-- 类型结束 -->`)
    const typeContent = await readFile("dist/index.d.ts", "utf-8")
    const newContent = content.slice(0, index + 13) + "\n```TypeScript\n" + typeContent.replace(/^( *\/\*\*)/mg, "\n$1") + "```\n" + content.slice(end)
    await writeFile("README.md", newContent, "utf-8")
}

main()
