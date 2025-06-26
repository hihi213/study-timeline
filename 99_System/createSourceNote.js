module.exports = async (params) => {
    const { quickAddApi, app } = params;
    const pdfs = app.vault.getFiles().filter(f => f.path.startsWith("01_Sources/") && f.extension === 'pdf');
    if (pdfs.length === 0) {
        new Notice("01_Sources 폴더에 PDF 파일이 없습니다.");
        return;
    }
    const selectedPdf = await quickAddApi.suggester(pdfs.map(f => f.basename), pdfs);
    if (!selectedPdf) return;
    const baseName = selectedPdf.basename;
    const newNoteName = `[S] ${baseName}`;
    const newNotePath = `01_Sources/${newNoteName}.md`;
    const existingFile = app.vault.getAbstractFileByPath(newNotePath);
    if (existingFile) {
        new Notice("알림: 이미 소스 노트가 존재하여 해당 파일을 엽니다.");
        await app.workspace.openLinkText(newNotePath, '', 'split');
        return;
    }
    const templateFile = app.vault.getAbstractFileByPath("99_System/Templates/T-소스노트.md
");
    if (!templateFile) {
        new Notice("소스 노트 템플릿을 찾을 수 없습니다.");
        return;
    }
    const templateContent = await app.vault.read(templateFile);
    await app.vault.create(newNotePath, templateContent);
    await app.workspace.openLinkText(newNotePath, '', 'split');
    new Notice(`'${newNoteName}' 소스 노트가 생성되었습니다.`);
};

