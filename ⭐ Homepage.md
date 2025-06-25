---
date created: 수요일, 6월 25일 2025, 3:39:33 오후
date modified: 수요일, 6월 25일 2025, 3:54:54 오후
---
/* ========================
🔥 처리해야 할 INBOX
"00_Inbox" 폴더에 있는 모든 노트를 보여줍니다.
======================== */
dv.header(2, "🔥 처리해야 할 INBOX");
dv.list(dv.pages('"00_Inbox"').sort(p => p.file.mtime, 'desc').map(p => p.file.link));

/* ========================
🌱 가공이 필요한 소스 노트
"01_Sources" 폴더의 소스 노트 중 "status"가 "unprocessed"인 목록을 보여줍니다.
======================== */
dv.header(2, "🌱 가공이 필요한 소스 노트");
dv.table(
    ["노트 제목", "생성일"],
    dv.pages('"01_Sources" AND #source')
        .where(p => p.status == "unprocessed")
        .sort(p => p.file.ctime, 'desc')
        .map(p => [
            p.file.link,
            p.file.ctime.toFormat("yyyy-MM-dd")
        ])
);

/* ========================
💎 최근에 만든 개념 노트
최근 7일 동안 만든 개념 노트 목록을 보여줍니다.
======================== */
dv.header(2, "💎 최근에 만든 개념 노트");
dv.list(dv.pages('#concept AND !"_Templates"')
    .where(p => p.file.ctime > (dv.date('now') - dv.duration('7 days')))
    .sort(p => p.file.ctime, 'desc')
    .map(p => p.file.link)
);

/* ========================
🗺️ 나의 모든 지식 지도 (MOCs)
MOC 태그가 붙은 모든 노트를 보여줍니다.
======================== */
dv.header(2, "🗺️ 나의 모든 지식 지도 (MOCs)");
dv.list(dv.pages('#moc and !"_Templates"').sort(p => p.file.name, 'asc').map(p => p.file.link));