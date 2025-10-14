module.exports = async (params) => {
    const { quickAddApi: qa, app } = params;

    // --- 설정 (이곳에서 경로 및 템플릿을 수정하세요) ---
    const CONFIG = {
        sourceDir: "01_Sources/",
        notesDir: "02_Notes/",
        inboxDir: "00_Inbox/",
        templateDir: "99_System/Templates/",

        // 템플릿 파일명
        sourceNoteTemplate: "소스노트.md",
        conceptNoteTemplate: "개념노트.md",
        fleetingNoteTemplate: "생각조각.md",

        // 템플릿 내 플레이스홀더
        sourcePlaceholder: /{{SOURCE}}/g,
        blockRefPlaceholder: /{{BLOCK_REFERENCE}}/g,
    };
    // ----------------------------------------------------

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("활성화된 파일이 없습니다.");
        return;
    }

    const filePath = activeFile.path;

    // 1. 소스 폴더의 PDF 파일인 경우 -> 소스 노트 생성
    if (filePath.startsWith(CONFIG.sourceDir) && activeFile.extension === "pdf") {
        await createSourceNote(app, activeFile, CONFIG);
    }
    // 2. 노트 폴더의 파일인 경우 -> 개념 노트 생성
    else if (filePath.startsWith(CONFIG.notesDir)) {
        await createConceptNote(app, activeFile, CONFIG);
    }
    // 3. 그 외의 모든 경우 -> 생각 조각 생성
    else {
        await createFleetingNote(app, qa, activeFile, CONFIG);
    }
};

/**
 * PDF 파일에 대한 소스 노트를 생성합니다.
 */
async function createSourceNote(app, pdfFile, config) {
    const fileBasename = pdfFile.basename;
    const newNotePath = `${config.sourceDir}{S} ${fileBasename}.md`;

    // 이미 노트가 존재하는지 확인
    if (app.vault.getAbstractFileByPath(newNotePath)) {
        new Notice("이미 해당 소스 노트가 존재합니다.");
        await app.workspace.openLinkText(newNotePath, '', false);
        return;
    }

    const templatePath = `${config.templateDir}${config.sourceNoteTemplate}`;
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    if (!templateFile) {
        new Notice("소스노트 템플릿을 찾을 수 없습니다.");
        return;
    }

    let templateContent = await app.vault.read(templateFile);
    const pdfLink = `[[${pdfFile.path}]]`;
    // 'Source:' 라인 전체를 교체하는 것이 더 안정적일 수 있습니다.
    //templateContent = templateContent.replace(/Source:.*$/m, `Source: ${pdfLink}`);
    // 또는 {{SOURCE}} 플레이스홀더 사용
     templateContent = templateContent.replace(config.sourcePlaceholder, pdfLink);

    await app.vault.create(newNotePath, templateContent);
    new Notice(`"${fileBasename}"에 대한 소스 노트를 생성했습니다.`);
    await app.workspace.openLinkText(newNotePath, '', 'split');
}

/**
 * 새로운 개념 노트를 생성하고 현재 커서 위치에 링크를 삽입합니다.
 */
async function createConceptNote(app, activeFile, config) {
    const templatePath = `${config.templateDir}${config.conceptNoteTemplate}`;
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    if (!templateFile) {
        new Notice("개념노트 템플릿을 찾을 수 없습니다.");
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newNotePath = `${config.notesDir}개념노트-${timestamp}.md`;

    const templateContent = await app.vault.read(templateFile);
    await app.vault.create(newNotePath, templateContent);
    new Notice("개념 노트를 생성했습니다.");

    // 현재 에디터에 새 노트 링크 삽입
    const editor = app.workspace.activeLeaf?.view?.editor;
    if (editor) {
        const newFileLink = `[[${newNotePath}]]`;
        editor.replaceSelection(newFileLink);
    }
    
    // 필요 시 새 노트를 분할 창에서 열기
    // await app.workspace.openLinkText(newNotePath, '', 'split');
}

/**
 * 현재 커서 위치의 블록을 참조하는 생각 조각 노트를 생성합니다.
 */
async function createFleetingNote(app, qa, activeFile, config) {
    const editor = app.workspace.activeLeaf?.view?.editor;
    if (!editor) {
        new Notice("에디터가 활성화되어 있지 않습니다.");
        return;
    }

    const cursor = editor.getCursor();
    const currentBlock = getCurrentBlock(editor, cursor.line);
    const blockId = await getOrCreateBlockId(editor, currentBlock);
    const blockReference = `![[${activeFile.path}#^${blockId}]]`;

    const noteTitle = await qa.inputPrompt("✨ 생각 조각의 제목을 입력하세요:");
    if (!noteTitle) return; // 사용자가 입력을 취소한 경우

    const newNotePath = `${config.inboxDir}${noteTitle}.md`;
    if (app.vault.getAbstractFileByPath(newNotePath)) {
        new Notice("같은 이름의 파일이 이미 존재합니다.");
        return;
    }

    const templatePath = `${config.templateDir}${config.fleetingNoteTemplate}`;
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    if (!templateFile) {
        new Notice("생각조각 템플릿을 찾을 수 없습니다.");
        return;
    }

    let templateContent = await app.vault.read(templateFile);
    templateContent = templateContent.replace(config.blockRefPlaceholder, blockReference);

    await app.vault.create(newNotePath, templateContent);
    new Notice("생각 조각을 생성했습니다.");
    
    // 현재 커서 위치에 새 파일 링크 삽입
    const newFileLink = `[[${newNotePath}|${noteTitle}]]`;
    editor.replaceRange(newFileLink, cursor);
    
    // 필요 시 새 노트를 분할 창에서 열기
    // await app.workspace.openLinkText(newNotePath, '', 'split');
}


// --- Helper Functions ---

/**
 * 커서 위치를 기반으로 현재 텍스트 블록의 정보를 가져옵니다.
 * (빈 줄을 기준으로 블록을 구분합니다.)
 */
function getCurrentBlock(editor, currentLine) {
    const totalLines = editor.lineCount();
    let startLine = currentLine;
    let endLine = currentLine;

    while (startLine > 0 && editor.getLine(startLine - 1).trim() !== '') {
        startLine--;
    }
    while (endLine < totalLines - 1 && editor.getLine(endLine + 1).trim() !== '') {
        endLine++;
    }

    let blockId = null;
    for (let i = startLine; i <= endLine; i++) {
        const line = editor.getLine(i);
        const match = line.match(/\s\^([a-zA-Z0-9-]+)$/);
        if (match) {
            blockId = match[1];
            break;
        }
    }
    return { startLine, endLine, blockId };
}

/**
 * 블록 ID가 없으면 새로 생성하여 추가하고, ID를 반환합니다.
 */
async function getOrCreateBlockId(editor, block) {
    if (block.blockId) {
        return block.blockId;
    }
    
    const newBlockId = generateRandomId();
    const blockEndPos = { line: block.endLine, ch: editor.getLine(block.endLine).length };
    
    // ID 앞에 공백을 추가하여 일반 텍스트와 구분
    editor.replaceRange(` ^${newBlockId}`, blockEndPos);
    
    return newBlockId;
}

/**
 * 랜덤한 6자리 ID를 생성합니다.
 */
function generateRandomId(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}