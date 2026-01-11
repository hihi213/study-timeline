---
type: 생각조각
status: inbox
source:
creation_date: 2026-01-11
---
- GET /fridge/slots — 칸 목록 조회(필터: floor, view, page, size)
- GET /fridge/bundles — 포장 목록 조회(필터: slotId, owner, status, search, page, size)
- POST /fridge/bundles — 포장 생성(허용량 초과 시 422 CAPACITY_EXCEEDED)
- GET /fridge/bundles/{bundleId} — 포장 상세 조회
- PATCH /fridge/bundles/{bundleId} — 포장 수정
- DELETE /fridge/bundles/{bundleId} — 포장 삭제
- POST /fridge/bundles/{bundleId}/items — 포장에 물품 추가
- PATCH /fridge/items/{itemId} — 물품 수정
- DELETE /fridge/items/{itemId} — 물품 삭제