module.exports = async (params) => {
    const { quickAddApi: qa, app } = params;
    


    // 방법 2: getActiveFile() 사용 (더 간단)
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("활성화된 파일이 없습니다.");
        return;
    }

    const filePath = activeFile.path;
    const fileBasename = activeFile.name;

    // 1. 01_Sources 폴더의 PDF 파일일 경우
    if (filePath.startsWith("01_Sources/") && activeFile.extension === "pdf") {
        const newNotePath = `01_Sources/{S} ${fileBasename}.md`;
        if (app.vault.getAbstractFileByPath(newNotePath)) {
            new Notice("이미 해당 소스 노트가 존재합니다.");
            await app.workspace.openLinkText(newNotePath, '', false);
        } else {
            const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/소스노트.md");
            if (!templateFile) {
                new Notice("소스노트 템플릿을 찾을 수 없습니다.");
                return;
            }
            
            let templateContent = await app.vault.read(templateFile);
            
            // 템플릿의 Source 필드에 현재 PDF 파일 링크 삽입
            const pdfLink = `[[${filePath}|${fileBasename}]]`;
            templateContent = templateContent.replace(/{{SOURCE}}/g, pdfLink);
            // 또는 다른 플레이스홀더 사용
            templateContent = templateContent.replace(/Source:.*$/m, `Source: ${pdfLink}`);
            
            await app.vault.create(newNotePath, templateContent);
            new Notice("소스 노트를 생성했습니다.");
            await app.workspace.openLinkText(newNotePath, '', 'split');
        }
    }
    

    // 2. 02_Notes 폴더의 파일일 경우 (개념 노트 생성)
    else if (filePath.startsWith("02_Notes/")) {
        const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/개념노트.md");
        if (!templateFile) {
            new Notice("개념노트 템플릿을 찾을 수 없습니다.");
            return;
        }
        
        // 고유한 파일명 생성 (중복 방지)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newNotePath = `02_Notes/개념노트-${timestamp}.md`;
        
        const templateContent = await app.vault.read(templateFile);
        await app.vault.create(newNotePath, templateContent);
        // 현재 커서 위치에 새 파일 링크 삽입
        const activeLeaf = app.workspace.activeLeaf;
        const editor = activeLeaf?.view?.editor;
        
        if (editor) {
            const cursor = editor.getCursor();
            const newFileLink = `[[${newNotePath}|개념노트-${timestamp}]]`;
            editor.replaceRange(newFileLink, cursor);
        }
        new Notice("개념 노트를 생성했습니다.");
        //창열기
        //await app.workspace.openLinkText(newNotePath, '', 'split');
    }

    // 3. 그 외의 경우 (생각 조각 생성)

    else {

        const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/생각조각.md");

        if (!templateFile) {

            new Notice("생각조각 템플릿을 찾을 수 없습니다.");

            return;

        }

        

        const activeLeaf = app.workspace.activeLeaf;

        const editor = activeLeaf?.view?.editor;

        

        let blockReference = "";

        

        if (editor) {

            const cursor = editor.getCursor();

            const currentBlock = getCurrentBlock(editor, cursor.line);

            

            if (currentBlock.blockId) {

                // 이미 블록ID가 있는 경우

                blockReference = `![[${filePath}#^${currentBlock.blockId}]]`;

            } else {

                // 블록ID가 없는 경우 새로 생성

                const newBlockId = generateRandomId();

                

                // 블록 끝에 블록ID 추가

                const blockEndPos = { line: currentBlock.endLine, ch: editor.getLine(currentBlock.endLine).length };

                editor.replaceRange(` ^${newBlockId}`, blockEndPos);

                

                blockReference = `![[${filePath}#^${newBlockId}]]`;

            }

        }

        

        const noteTitle = await qa.inputPrompt("✨ 생각 조각의 제목을 입력하세요:");

        if (noteTitle) {

            const newNotePath = `00_Inbox/${noteTitle}.md`;

            let templateContent = await app.vault.read(templateFile);

            

            // 템플릿에 블록 참조 삽입

            templateContent = templateContent.replace(/{{BLOCK_REFERENCE}}/g, blockReference);

            

            await app.vault.create(newNotePath, templateContent);
            // 현재 커서 위치에 새 파일 링크 삽입
            if (editor) {
                const cursor = editor.getCursor();
                const newFileLink = `[[${newNotePath}|${noteTitle}]]`;
                editor.replaceRange(newFileLink, cursor);
            }
            new Notice("생각 조각을 생성했습니다.");
            //창열기
            //await app.workspace.openLinkText(newNotePath, '', 'split');

        }

    }

};



// 현재 블록 정보를 가져오는 함수

function getCurrentBlock(editor, currentLine) {

    const totalLines = editor.lineCount();

    let startLine = currentLine;

    let endLine = currentLine;

    

    // 블록 시작점 찾기 (빈 줄까지 올라가기)

    while (startLine > 0) {

        const line = editor.getLine(startLine - 1).trim();

        if (line === '') {

            break;

        }

        startLine--;

    }

    

    // 블록 끝점 찾기 (빈 줄까지 내려가기)

    while (endLine < totalLines - 1) {

        const line = editor.getLine(endLine + 1).trim();

        if (line === '') {

            break;

        }

        endLine++;

    }

    

    // 블록 전체에서 블록ID 찾기

    let blockId = null;

    for (let i = startLine; i <= endLine; i++) {

        const line = editor.getLine(i);

        const blockIdMatch = line.match(/\^([a-zA-Z0-9-]+)$/);

        if (blockIdMatch) {

            blockId = blockIdMatch[1];

            break;

        }

    }

    

    return {

        startLine,

        endLine,

        blockId,

        content: editor.getRange({ line: startLine, ch: 0 }, { line: endLine, ch: editor.getLine(endLine).length })

    };

}



// 랜덤 블록ID 생성 함수

function generateRandomId(length = 6) {

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';

    for (let i = 0; i < length; i++) {

        result += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    return result;

}

