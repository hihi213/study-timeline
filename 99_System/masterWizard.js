module.exports = async (params) => {

    // 이제 우리는 도구 상자의 정확한 이름이 'quickAddApi'인 것을 압니다.

    const { quickAddApi } = params;
const clipboard = await navigator.clipboard.readText();


    const noteType = await quickAddApi.suggester(

        ["개념노트 생성", "(pdf)소스노트 생성","(web/youtube)소스노트 생성" ,"MOC노트 생성"],

         ["concept", "source_pdf", "source_web", "moc"]

    );



    if (!noteType) return;



    switch (noteType) {

        case "concept":

            await quickAddApi.executeChoice("개념노트 생성");

            break;

        case "source-pdf":

            await quickAddApi.executeChoice("소스노트 생성");

            break;
        case "source_web":
     		await quickAddApi.executeChoice("웹뷰열기");
            break;

        case "moc":

            await quickAddApi.executeChoice("MOC노트 생성");

            break;

    }

};