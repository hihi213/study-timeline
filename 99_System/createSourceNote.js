module.exports = async (params) => {
    const { app } = params;

    // 1. 현재 활성화된 창(Pane)의 파일을 가져옵니다. 이 방식이 더 안정적입니다.
    const activeFile = app.workspace.activeLeaf?.view.file;

    // 2. 해당 파일이 유효한 PDF인지 확인합니다.
    if (!activeFile || activeFile.extension !== 'pdf') {
        new Notice("오류: 먼저 파일 탐색기에서 PDF 파일을 클릭하여 열어주세요.", 5000);
        return;
    }

    // --- (여기서부터는 이전 로직과 거의 동일하지만, 변수 이름과 경로를 표준에 맞게 수정합니다) ---

    // 3. 선택된 PDF를 기반으로 소스 노트의 제목과 경로를 결정합니다.
    const baseName = activeFile.basename;
    const newNoteName = `{S} ${baseName}`; // 명명 규칙을 [S]로 수정
    const newNotePath = `01_Sources/${newNoteName}.md`;

    let fileToOpen = app.vault.getAbstractFileByPath(newNotePath);

    // 4. 이미 같은 이름의 소스 노트가 존재하는지 확인하고, 없으면 새로 생성합니다.
    if (!fileToOpen) {
        // 템플릿 경로를 표준 경로로 수정
        const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/T-소스노트.md"); 
        if (!templateFile) {
            new Notice("오류: '_Templates/T - 소스 노트.md' 템플릿을 찾을 수 없습니다.");
            return;
        }
        const templateContent = await app.vault.read(templateFile);
        fileToOpen = await app.vault.create(newNotePath, templateContent);
        new Notice(`'${newNoteName}' 소스 노트가 생성되었습니다.`);
    } else {
        new Notice("알림: 이미 소스 노트가 존재하여 해당 파일을 엽니다.");
    }

    // 5. 클립보드 내용을 확인하여, PDF++ 하이라이트가 있다면 노트 맨 아래에 추가합니다.
    const clipboard = await navigator.clipboard.readText();
    if (clipboard && clipboard.startsWith("> [!quote")) {
        await app.vault.append(fileToOpen, `\n\n${clipboard}`);
        new Notice(`클립보드의 하이라이트를 '${fileToOpen.basename}'에 추가했습니다.`);
    }
    
    // 6. 생성되었거나 이미 존재하던 노트를 새 창에서 엽니다.
    await app.workspace.openLinkText(fileToOpen.path, '', 'split');
};