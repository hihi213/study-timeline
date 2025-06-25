module.exports = async (params) => {
    // PDF++ 플러그인의 API에 접근합니다.
    const pdfPlusAPI = app.plugins.plugins['pdf-plus-plus']?.api;
    if (!pdfPlusAPI) {
        new Notice("PDF++ API를 찾을 수 없습니다.");
        return;
    }
    // 마지막으로 하이라이트하고 복사된 정보를 가져옵니다.
    const lastHighlight = pdfPlusAPI.getLastCopiedHighlight();
    if (!lastHighlight) {
        new Notice("복사된 PDF++ 하이라이트가 없습니다.");
        return;
    }
    // 하이라이트 텍스트를 QuickAdd 변수에 저장합니다.
    params.quickadd.variables.highlightedText = lastHighlight.text;
};