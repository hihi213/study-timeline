module.exports = async (params) => {

    // 이제 우리는 도구 상자의 정확한 이름이 'quickAddApi'인 것을 압니다.

    const { quickAddApi } = params;


    const noteType = await quickAddApi.suggester(

        [(pdf)소스노트 생성,"(web/youtube)소스노트 생성","개념노트 생성","MOC노트 생성"],

         ["source_pdf", "source_web", "concept", "moc"]

    );



    if (!noteType) return;



    switch (noteType) {
	case "source-pdf":
            await quickAddApi.executeChoice("소스노트 생성");
            break;
        case "source_web":
     		await quickAddApi.executeChoice("웹뷰열기");
            break;

        case "concept":

            await quickAddApi.executeChoice("개념노트 생성");

            break;
        

        case "moc":
            await quickAddApi.executeChoice("MOC노트 생성");
            break;

    }

};