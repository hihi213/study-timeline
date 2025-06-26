module.exports = async (params) => {
    const { quickAddApi, app } = params;

    // 1. 01_Sources 폴더에 있는 모든 PDF 파일 목록을 가져옵니다.
    const pdfs = app.vault.getFiles().filter(f => f.path.startsWith("01_Sources/") && f.extension === 'pdf');

    if (pdfs.length === 0) {
        new Notice("01_Sources 폴더에 PDF 파일이 없습니다.");
        return;
    }

    // 2. 사용자에게 PDF 목록을 보여주고, 그 중 하나를 선택하게 합니다.
    const selectedPdf = await quickAddApi.suggester(
        pdfs.map(f => f.basename), // 사용자에게는 파일 이름만 보여줌
        pdfs  // 선택 시에는 파일 객체 전체를 반환
    );

    if (!selectedPdf) {
        // 사용자가 선택을 취소한 경우
        return;
    }

 // 3. 선택된 PDF를 기반으로 소스 노트의 제목과 경로를 결정합니다.
    const baseName = selectedPdf.basename;
    const newNoteName = `[S] ${baseName}`;
    const newNotePath = `01_Sources/${newNoteName}.md`;

    let fileToOpen = app.vault.getAbstractFileByPath(newNotePath);

    // 4. 이미 같은 이름의 소스 노트가 존재하는지 확인하고, 없으면 새로 생성합니다.
    if (!fileToOpen) {
        const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/T-소스노트.md");
        if (!templateFile) {
            new Notice("소스 노트 템플릿을 찾을 수 없습니다.");
            return;
        }
        const templateContent = await app.vault.read(templateFile);
        fileToOpen = await app.vault.create(newNotePath, templateContent);
        new Notice(`'${newNoteName}' 소스 노트가 생성되었습니다.`);
    } else {
        new Notice("알림: 이미 소스 노트가 존재하여 해당 파일을 엽니다.");
    }

    // 5. [✨ 새로운 기능!] 클립보드 내용을 확인합니다.
    const clipboard = await navigator.clipboard.readText();
    if (clipboard && clipboard.startsWith("> [!quote")) {
        // 클립보드에 PDF++ 하이라이트가 있다면, 노트 맨 아래에 추가합니다.
        await app.vault.append(fileToOpen, `\n\n${clipboard}`);
        new Notice(`클립보드의 하이라이트를 '${fileToOpen.basename}'에 추가했습니다.`);
    }

    // 6. 생성되었거나 이미 존재하던 노트를 새 창에서 엽니다.
    await app.workspace.openLinkText(fileToOpen.path, '', 'split');
};

