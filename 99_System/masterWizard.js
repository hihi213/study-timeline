module.exports = async (params) => {
    const noteType = await params.suggester(
        ["개념노트 생성", "소스노트 생성", "MOC노트 생성)"],
        ["concept", "source", "moc"]
    );

    if (!noteType) return;

    switch (noteType) {
        case "concept":
           await params.runChoice("개념노트 생성");
            break;
        case "source":
            await params.runChoice("소스노트 생성");
            break;
        case "moc":
            await params.runChoice("MOC노트 생성");
            break;
    }
};