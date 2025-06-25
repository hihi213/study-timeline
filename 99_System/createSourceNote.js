module.exports = async (params) => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile || !activeFile.path.toLowerCase().endsWith('.pdf')) {
        new Notice("PDF 파일을 먼저 선택해주세요.");
        return;
    }
    const baseName = activeFile.basename;
    const newNoteName = `[S] ${baseName}`;
    const templateFile = app.vault.getAbstractFileByPath("Templates/T-소스노트.md");
    if (!templateFile) { new Notice("소스 노트 템플릿을 찾을 수 없습니다."); return; }
    const templateContent = await app.vault.read(templateFile);
    const newNotePath = `01_Sources/${newNoteName}.md`;

    const existingFile = app.vault.getAbstractFileByPath(newNotePath);
    if (existingFile) {
        new Notice("이미 같은 이름의 소스 노트가 존재합니다.");
        await app.workspace.openLinkText(newNotePath, '');
        return;
    }

    await app.vault.create(newNotePath, templateContent);
    await app.workspace.openLinkText(newNotePath, '');
    new Notice(`'${newNoteName}' 소스 노트가 생성되었습니다.`);
};