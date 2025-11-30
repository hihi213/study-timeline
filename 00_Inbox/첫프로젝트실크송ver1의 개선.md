---
type: 생각조각
status: inbox
source: 
creation_date: 2025-11-30
---


## 📜 원본 맥락
![[03_Outputs/취업-회사/지원서 작성전 경험 정리.md#^91pxil]]

---
## 정리

- html 요소자체를 const로 바꾸자
	- **`let`**: 값이 변할 수 있는 변수 (예: 점수, 좌표 `x`, `y`)
	- **`const`**: 한 번 선언되면 값이 변하지 않는 상수 (예: HTML 요소 자체, 고정된 설정값


interval에서 promise와 async/await
- **현재 상황:** 시간 순서대로 일어나는 일(눈 뜨기 -> 팔 들기 -> 공 떨어지기)을 표현하기 위해 `setTimeout` 안에 `setTimeout`을 계속 넣었습니다. 이렇게 되면 나중에 "2초 뒤가 아니라 3초 뒤로 바꾸고 싶은데?"라고 할 때 괄호 짝을 찾느라 고생하게 됩니다.


## 기존 ver1
~~~html
하단은 자바스크립트를 배운지 얼마안됐을때 최대한 아는것만 넣은 코드야 이걸 이제 개선하려는데 어떤 문법이나 학습을 못해서 이렇게 코드를 짠걸까? 나에게 리펙토링을 위한 공부할것들을 추천해줘

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>실크송발매기원</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Diphylleia&display=swap');
    </style>

    <!--첫배경정하기-->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Diphylleia', serif;
        }

        body {
            background-image: url('패배화면.webp');
            overflow: hidden;
            width: 100%;
            height: 100vh;
            background-repeat: no-repeat;
            background-size: cover;
            /*z-index: -1; 영상앞에 위치하도록 넣었는데..*/
        }

        #footer {
            width: 100%;
            height: 20%;
            position: relative;
        }

        #wellcome {
            width: 80%;
            height: 20%;
        }

        #section {
            border-bottom: 10vw;
            margin: 0 auto;
            width: 100vw;
            height: auto;
            text-align: center;
        }

        #footer>#picbox {
            display: flex;
            flex-direction: column;
            position: relative;
            height: auto;
            text-align: center;
            width: 20vw;
            height: 40vw;
            margin: 0 auto;
        }

        #textbox {
            position: relative;
            margin-right: 10vw;
            float: right;
        }

        #button {
            margin-left: 2vw;
            aspect-ratio: 2 / 1;
            /*가로 세로 비율*/
            width: 10vw;
            font-size: 2vw;
            /*5vw로 한 경우 웹브라우저 너비의 5%를 의미합니다. 여기서 v는 viewport를 의미합니다.*/
        }

        #text {
            width: 20vw;
            aspect-ratio: 5/ 1;
            font-size: 2vW;
            /*5vw로 한 경우 웹브라우저 너비의 5%를 의미합니다. 여기서 v는 viewport를 의미합니다.*/
            text-align: center;
            text-size-adjust: auto;
            /*화면의 폭에 맞게 텍스트의 크기를 자동으로 조절한다.*/
        }

        #footer>#picbox>#nickname {
            flex-shrink: 1;
            text-size-adjust: auto;
            font-size: 2vw;

        }


        #footer>#picbox>#knight {
            max-width: 90%;
            max-height: 90%;
            flex-shrink: 1;
        }

        .ball {
            max-width: 6vw;
            max-height: 6vw;
            position: absolute;
        }


        #video {
            height: 100%;
            width: 100%;
            object-fit: cover;
            margin: 0px auto;
        }

        #videobox {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: -1;
        }

        #main_aside {
            width: 30%;
            position: relative;
            float: right;
        }

        .textaside {
            font-size: 2vW;
            /*5vw로 한 경우 웹브라우저 너비의 5%를 의미합니다. 여기서 v는 viewport를 의미합니다.*/
            text-align: center;
            text-size-adjust: auto;
            /*화면의 폭에 맞게 텍스트의 크기를 자동으로 조절한다.*/
            background-color: aliceblue;
            border-bottom: 1px black;
        }
    </style>
</head>

<body>
    <div id="ballbox">
        <img class="ball" src="" alt="1">
        <img class="ball" src="" alt="2">
        <img class="ball" src="" alt="3">
        <img class="ball" src="" alt="4">
    </div>

    <section id="section">
        <img id="wellcome" src="wellcome.png" alt="w">
    </section>
    <footer id="footer">
        <article id="textbox">
            <input id="text" type="text" value="닉네임입력">
            <button id="button" type="button">start!</button>
        </article>
        <div id="picbox">
            <img id="knight" src="하찮공허.png" alt="g">
            <p id="nickname"></p>
        </div>
    </footer>
    <div id="videobox">
        <video id="video" src="" loop muted autoplay playsinline></video>
    </div>
    <div>
        <audio id="audio" autoplay="autoplay" src=""></audio>
    </div>
    <aside id="main_aside">

    </aside>
    <script>
        /*TypeError: drops.forEach is not a function 오류는 drops가 배열이 아닌 다른 유형의 객체일 때 발생합니다.
가능한 원인 중 하나는 drops가 실제로 배열이 아닌 HTMLCollection 또는 NodeList와 같은 유사 배열 객체일 수 있습니다. 이 경우에는 forEach가 직접 사용되지 않습니다.
        Array.from() 메서드를 사용하여 유사 배열 객체를 배열로 변환하는 것입니다. 아래와 같이 수정할 수 있습니다:*/
        let real = false;
        let counttime = 0;
        let video = document.getElementById("video")
        let videobox = document.getElementById("videobox")
        let textbox = document.getElementById("textbox")
        let text = document.getElementById("text");
        let button = document.getElementById("button");
        let nickname = document.getElementById("nickname");
        let wellcome = document.getElementById("wellcome");
        let knight = document.getElementById("knight");
        let picbox = document.getElementById("picbox")
        let section = document.getElementById("section")
        let drops = document.getElementsByClassName("ball")
        let Audio = document.getElementById("audio")
        let aside = document.getElementById("main_aside")
        let x = 0;
        let y = 0;

 

        window.addEventListener('online', () => {
            if (confirm("인터넷 연결 감지 다시 로드하시겠습니까?")) {
                window.reload();
                }
            });

        // 오프라인 상태가 되면 실행되는 이벤트
        window.addEventListener('offline', () => {
            //console.log('오프라인상태');
            document.body.style.backgroundImage = "url('바탕.jpg')";
            Array.from(drops).forEach(
                element => element.style.visibility = "hidden");//공이 처음에 안보이게
            wellcome.style.visibility = "hidden"//wellcome이 안보이게
            picbox.style.left = `${x}%`;
            picbox.style.top = `${y}%`;//기사에게 처음 위치 부여
            text.onclick = () => {
                text.value = ""; //입력창 클릭시 입력창 초기화
            }  
        });



        button.onclick = function () {//시작버튼을 눌렀을때
            if (text.value === "닉네임입력" || text.value === "") {
                nickname.innerHTML = "noname";
            }//지정안할시 노네임
            else {
                nickname.innerHTML = text.value;
            }//값 닉네임에 저장
            audio.src = "노래.mp3"
            text.style.display = "none";
            button.style.display = "none"

            setTimeout(() => {
                knight.src = "하찮공허눈.png"
            }, 1000);//1초뒤에 눈뜨게하기

            setTimeout(() => {
                knight.src = "팔든공허.png"//눈뜬 2초뒤에 팔든공허로 바꾸기!!
                wellcome.style.visibility = "visible"//wellcome문구 뛰우기
            }, 2000);

            setTimeout(() => {
                wellcome.style.visibility = "hidden"
                picbox.style.width = "9.5vw";  // 너비 조절 
                // picbox.style.height = "20vw";  // 높이 조절
                y = 230;
                picbox.style.left = `${x}%`;
                picbox.style.top = `${y}%`;
                //사이즈 줄이고 아래로 내리기
            }, 5000);

            setTimeout(() => {
                setInterval(() => { ++counttime; }, 1000);//시간재기

                [0, 1, 2, 3].forEach(makeball);//공만들기
                Array.from(drops).slice(0, 3).forEach(drop => {
                    drop.style.visibility = "visible";//공 3개만 보이게
                });

                setInterval(() => { moveball(0); }, 10)//6초뒤 0.01초마다 공 움직임
                setTimeout(() => {
                    setInterval(() => { moveball(1); }, 10)
                }, 3000)//9초뒤 0.01초마다 공움직임
                setTimeout(() => {
                    setInterval(() => { moveball(2); }, 10)
                }, 5000)//12초뒤 0.01초마다 공움직임
                setTimeout(() => {
                    setInterval(() => { moveball(3); }, 10)
                }, 8000)//14초뒤 0.01초마다 공움직임

                setTimeout(() => {
                    changedrops();//14초뒤에 화면 전환
                    setInterval(() => { if (t < 1.5) { t += 0.05 } }, 1500)// 화면이 바뀌고 1.5초마다0.6까지 더빨라짐  
                }, 8000)

            }, 6000)
        }
        firstclick = 1; //단 한번만 시작버튼이 눌리게
        const [left, up, right, down, enter] = [37, 38, 39, 40, 13]
        const ifkeydown = (event) => {
            switch (event.keyCode) {
                case left:
                    if (x < -40) { x = -45 }
                    else { x -= 3.5 }
                    picbox.style.left = `${x}%`;
                    picbox.style.top = `${y}%`;
                    break
                case right:
                    if (x > 43) { x = 45 }
                    else { x += 3.5 }
                    picbox.style.left = `${x}%`;
                    picbox.style.top = `${y}%`;
                    break
                case enter://enter를 눌렀을때 단 한번 시작버튼이 눌리게
                    if (firstclick > 0) {
                        button.onclick()
                        --firstclick;
                    }
            }
        }
        document.body.addEventListener('keydown', ifkeydown);
        function changedrops() {
            drops[3].style.visibility = "visible"//4번째 drop이 추가된다.
            real = true;//앞으로 공 몬스터로 바꾸기
            [0, 1, 2, 3].forEach(element =>
                drops[element].src = monster[element]); //공몬스터로바꾸기
            knight.src = "찐이야.png"//기사 이미지 바꾸기
            picbox.style.width = "7vw";//크기조절
            t = 0.25;//속도 더 빠르게
            //document.body.style.backgroundColor = "transparent"
            document.body.style.backgroundImage = ""//배경지우고 동영상배경으로 전환
            video.src = "배경.mp4"
            audio.src = "노래긴박.mp3"
        }
        //공 움직이기:처음에 x위치와 공색깔을 랜덤으로 주고
        //[y1]으로 위치를 1초마다 부여를 한다 
        let t = 0.15;//처음 공 속도
        count = [5, 5, 5, 5];//ball 만든 10초후 초기화
        ball = ["redball.png", "blackball.png", "blueball.png"]
        monster = ["굼벵이.webp", "맹독충사냥꾼.webp", "복수파리.webp", "붕붕파리.webp", "틱틱.webp"
            , "어리석음.webp", "버섯전사.webp", "우오마.webp", "포복이끼.webp", "발더.webp", "생명씨앗.webp", "구더기.webp"]

        function makeball(a) {
            let num;
            num = Math.random();
            //Real이 true일때(화면이 반전될때) 떨어지는걸 monster로 변경 
            if (real) { drops[a].src = monster[Math.floor(num * 12)] }
            //그외의 경우 ball사진이 떨어진다
            else { drops[a].src = ball[Math.floor(num * 3)] }
            //랜덤 x위치 부여
            drops[a].style.left = `${(num * 95)}%`;
            //랜덤 크기부여
            drops[a].style.maxWidth = `${(num * 3 + 5)}vw`;
            drops[a].style.maxHeight = `${(num * 3 + 5)}vw`;
        }
        
        function moveball(b) {
            drops[b].style.top = `${countf(b)}%`;
        }

        function countf(c) {
            if (count[c] > 80) { count[c] = 0; makeball(c); }
            else { count[c] += t; }
            return count[c]
        }

        /*이제 벌레와 knight가 만날때,
        화면을 붉게 만들고 life를 -1
        life가 0이 될때 노래가 멈추고,게임오버창이 뜬다*/

        //벌레와 knight가 만날때
        //옵저버를 이용한다
        let times = [];
        var observers = [];
        let kposition = knight.getBoundingClientRect()
        //knight.target.getBoundingClientRect()은 안됨
//debugger
        for (let i = 0; i < drops.length; i++) {
            var observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {//foreach 각각적용
                    //변경을 감지했을때 실행할 부분 // console.log(mutation.target);
                    //parseInt(으로 문자열비교가 아닌 숫자로 변환
                    if (parseInt(mutation.target.style.top) > 65) {//좀더 좁은 범위부여
                        let n = mutation.target.getBoundingClientRect()//공의 위치정보 받기
                        kposition = knight.getBoundingClientRect()//기사의 x좌표 재기
                        if (n.bottom >= kposition.top && n.top <= (kposition.top + kposition.height)) {// 기사의 머리까지의 길이보다 낙하바닥의 길이가 커질때
                            if (kposition.left < (n.left+n.width) && (n.left < (kposition.left + kposition.width))) {//x좌표 사이에 있을때
                                theymet();
                                console.log("부딪침")
                                //닿은 모든순간이 count된다. 한 객체에 부딪친 횟수만 재려면 어떻게 해야하지?
                                //일단 목숨을 한개로 코딩해보고 생각해보자
                            }
                        }
                        //if(mutation.target.getBoundingClientRect().top===knight)
                        //{}
                    }
                    //else{console.log("no")}
                })
            })

            observers.push(observer);
            var config = {
                //감지설정
                childList: false,//자식노드에 발생하는 변경사항
                attributes: true,//타겟의 속성변경을 감지
                attributeFilter: ["style"],//위치속성만 감지
                CharacterData: false,
                subtree: false,
                attributesOldValue: false,//변경전 데이터는 필요x
                CharacterDataOldValue: false//이하동문
            };
            observer.observe(drops[i], config)
            console.log("감시시작")
        }
        function theymet() {
            audio.src = "엔딩.mp3"//노래바꾸기
            observers.forEach(obs => obs.disconnect());//observer.disconnect();//감시그만
            Array.from(drops).forEach(function (element) {
                element.style.display = "none";
                //이벤트제거 대신에 그냥 공을 안보이게 하자 감시가 안되므로 부딪침 이벤트 안일어남
            });
            audio.src = ""//노래멈추기
            document.body.removeEventListener('keydown', ifkeydown)

            //흔들기
            for (let i = 0; i < 20; i++) {
                if (i < 20) {
                    setTimeout(() => { x -= 0.3;             picbox.style.left = `${x}%`;
            picbox.style.top = `${y}%`;}, 100)
                    setTimeout(() => { x += 0.3;             picbox.style.left = `${x}%`;
            picbox.style.top = `${y}%`; }, 200)
                }
            }


            setTimeout(() => {
                knight.src = "친족.webp"//충격받은 기사 이미지 전환
                picbox.style.width = "9vw"//크기조절
            }, 2000)

            setTimeout(() => {
                picbox.style.visibility = "hidden"//1초뒤 picbox 안보이게 하기
                //그리고 두개골기사 배경화면으로 전환
                document.body.style.backgroundImage = "url('패배화면.webp')";//url('패배화면.webp');
                document.body.style.backgroundSize = "70% 100%"
                videobox.style.visibility = "hidden"


                // 플레이어 기록 담기
                var userInfo = { nickname: nickname.innerHTML, time: counttime };

                var existingData1 = loadData();

                existingData1.push(userInfo);
                console.log("기존 데이터에 추가:", existingData1);

                existingData1.sort((a, b) => b.time - a.time);
                console.log("데이터 정렬:", existingData1);

                const top5Data = existingData1.slice(0, 5);
                console.log("상위 5개 데이터:", top5Data);

                saveData(top5Data);
                console.log("로컬 스토리지에 데이터 저장:", top5Data);

                newad = makelist(userInfo, -1)
                newad.style.marginBottom = "20%"

                for (let i = 0; i < top5Data.length; i++) {
                    oldadress = makelist(top5Data[i], i)
                }
                //기록들[n]번에= 기록을 순서대로 저장
                //그러면 순서대로 저장이 된다
                //그 아래에 박스형 현재플레이어 기록 나열

                //닉네임,버틴시간 저장한 로컬스토리지에서 데이터 가져와
                //탭닫을떄 지워지는 세션스토리지보단 로컬 스토리지로 가자
                //비디오보기 누르면 비내리는 동영상이 배경화면으로 전환됨
                //retry 버튼누르면 새로고침
                새버튼 = document.createElement("button");
                새버튼.setAttribute("id", "button");
                textbox.appendChild(새버튼);
                새버튼.textContent = "retry?"
                새버튼.onclick = () => { location.reload(true); 
                }
            }, 3700)
            // 로컬 스토리지에서 데이터 불러오기
            const loadData = () => {
                // 로컬 스토리지에 기존 데이터가 있는지 확인
                const existingData = localStorage.getItem('playerData');

                // 기존 데이터가 있으면 JSON으로 파싱
                if (existingData) {
                    return JSON.parse(existingData);
                } else {
                    // 기존 데이터가 없으면 빈 배열 반환
                    return [];
                }
            };
            
            // 로컬 스토리지에 데이터 저장하기
            const saveData = (data) => {
                // 배열을 JSON으로 변환하고 로컬 스토리지에 저장
                localStorage.setItem('playerData', JSON.stringify(data));
            };
        }
    </script>
</body>

</html>
~~~
## 💭 나의 추가적 생각/질문
