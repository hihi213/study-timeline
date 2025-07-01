---
date created: 수요일, 6월 25일 2025, 3:39:33 오후
date modified: 수요일, 6월 25일 2025, 3:54:54 오후
---


```dataviewjs
/* ========================
🔥 처리해야 할 INBOX
"00_Inbox" 폴더에 있는 모든 노트를 보여줍니다.
가장 먼저 확인하고 비워야 할 공간입니다.
======================== */
dv.header(2, "🔥 처리해야 할 INBOX");
const inboxFiles = dv.pages('"00_Inbox"').sort(p => p.file.mtime, 'desc');
if (inboxFiles.length > 0) {
    dv.list(inboxFiles.map(p => p.file.link));
} else {
    dv.paragraph("👍 인박스가 깨끗합니다!");
}

/* ========================
🌱 가공이 필요한 소스 노트
"01_Sources" 폴더의 소스 노트 중 YAML 속성의 status가 "unprocessed"인
노트 목록을 보여줍니다. '지식 제련'의 시작점입니다.
======================== */
dv.header(2, "🌱 가공이 필요한 소스 노트");
const unprocessedSources = dv.pages('"01_Sources" AND #source')
    .where(p => p.status == "unprocessed")
    .sort(p => p.file.ctime, 'desc');
if (unprocessedSources.length > 0) {
    dv.table(
        ["노트 제목", "생성일"],
        unprocessedSources.map(p => [
            p.file.link,
            p.file.ctime.toFormat("yyyy-MM-dd")
        ])
    );
} else {
    dv.paragraph("🎉 모든 소스 노트를 처리했습니다!");
}

/* ========================
🔗 연결이 필요한 외로운 노트
다른 어떤 노트와도 연결되지 않은 '고아 노트'를 찾아줍니다.
새로운 연결을 만들어 지식 네트워크를 성장시킬 기회입니다.
======================== */
dv.header(2, "🔗 연결이 필요한 외로운 노트");
const lonelyNotes = dv.pages('"02_Notes" AND !#moc') // MOC는 제외
    .where(p => p.file.inlinks.length === 0 && p.file.outlinks.length === 0)
    .sort(p => p.file.ctime, 'desc')
    .limit(10);
if (lonelyNotes.length > 0) {
    dv.list(lonelyNotes.map(p => p.file.link));
} else {
    dv.paragraph("🕸️ 모든 노트가 잘 연결되어 있습니다!");
}

/* ========================
💎 최근에 만든 개념 노트
최근 7일 동안 만들거나 수정한 '개념 노트' 목록을 보여주어
성취감을 느끼게 하고, 쉽게 다시 찾아볼 수 있도록 돕습니다.
======================== */
dv.header(2, "💎 최근 작업한 개념 노트");
dv.list(dv.pages('#concept AND !"_Templates"')
    .where(p => p.file.mtime > (dv.date('now') - dv.duration('7 days')))
    .sort(p => p.file.mtime, 'desc')
    .limit(15)
    .map(p => p.file.link)
);

/* ========================
🗺️ 나의 모든 지식 지도 (MOCs)
MOC 태그가 붙은 모든 노트를 보여줍니다.
언제든 주제별 탐색을 시작할 수 있는 게이트웨이입니다.
======================== */
dv.header(2, "🗺️ 나의 모든 지식 지도 (MOCs)");
dv.list(dv.pages('#moc and !"_Templates"').sort(p => p.file.name, 'asc').map(p => p.file.link));

```


## 📥 처리 대기열 (Processing Queue)

_아직 가공되지 않은 원재료들입니다. 이 노트들을 'seeding' 상태의 개념 노트로 만들어보세요._

**TABLE WITHOUT ID file.link AS "노트", creation_date AS "생성일"** **FROM ""** **WHERE status = "inbox"** **SORT creation_date ASC**

---

## 🌱 씨앗 키우기 (Concepts to Nurture)

_'seeding' 상태의 노트들입니다. 내용을 보강하고 다른 노트와 연결하여 'growing' 상태로 발전시키세요._

**TABLE WITHOUT ID file.link AS "개념", join(topics) AS "주제"** **FROM #개념노트** **WHERE status = "seeding"** **SORT file.mtime ASC**

---

## 🌳 성장 중인 아이디어 (Ideas in Progress)

_일주일 이상 업데이트되지 않은 'growing' 상태의 노트들입니다. 잊지 말고 계속 발전시켜 나가세요._

**TABLE WITHOUT ID file.link AS "개념", file.mtime AS "마지막 수정일"** **FROM #개념노트** **WHERE status = "growing" AND file.mtime < date(today) - dur(7 days)** **SORT file.mtime ASC**

---

## 🔗 연결이 필요한 노트 (Connection Opportunities)

_다른 노트로의 연결(Outgoing Links)이 하나도 없는 '고아 노트'들입니다. 기존 지식 네트워크와 연결해주세요._

**TABLE WITHOUT ID file.link AS "고아 노트", length(file.outlinks) as "연결 수"** **FROM #개념노트** **WHERE length(file.outlinks) = 0**

---

## ✅ 완료된 할 일 (Recent Accomplishments)

_최근 7일간 완료된 할 일 목록입니다._

**TASK** **WHERE done AND done > date(today) - dur(7 days)** **GROUP BY dateformat(done, "yyyy-MM-dd")**

