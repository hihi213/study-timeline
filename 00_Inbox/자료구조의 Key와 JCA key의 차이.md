---
type: 생각조각
status: inbox
source: 
creation_date: 2025-09-09
---


## 📜 원본 맥락
![[00_Inbox/주입받을 멤버변수선언.md#^ie6xwj]]

---
## 정리
- 자료구조 Key!=암호키!= jca key
- map의 Key: 탐색용
- 암호키:**암호 연산을 결정하는 파라미터**
- “JCA Key” = **암호키를 표현하는 객체 인터페이스**(SecretKey/PublicKey/PrivateKey)
- 짧게: JCA의 Key는 “암호키 + 메타데이터(알고리즘·형식)”를 캡슐화한 표준 인터페이스예요. 맵의 key-value가 아니라, 암호 연산용 키 핸들입니다.
	- 표준핸들: 키재료+ 메타데이터를 규격대로 담아 엔진에 건네는 객체
	- 키재료: 실제 비밀값
	- 알고리즘 메타데이터: **어떤 엔진/규칙으로 사용해야 하는지 식별하는 표식**

	JCA의 Key**는 자료구조의 key-value 쌍이 아니라 **암호 연산에 쓰는 “키 객체(핸들)”**입니다.
	- 	key-value(맵): Map<K,V>처럼 데이터를 (키, 값)으로 매핑해 두는 저장 방식.
	- 	java.security.Key: 알고리즘/형식 메타데이터를 가진 암호키 인터페이스(SecretKey, PublicKey, PrivateKey 등). 연산에 넘기는 대상이지, (키,값) 레코드가 아님.
	- 참고) Keystore에 저장할 땐 alias → entry로 인덱싱하므로 겉보기엔 key-value처럼 보일 수 있지만, 그건 저장소의 색인 방식이고, Key 객체 자체가 key-value라는 뜻이 아닙니다.

용어 매핑
	•	“key-value” = 자료구조의 (키, 값) 매핑
	•	“Key(JCA)” = 암호키 객체 (암호 알고리즘용 핸들)1) 인터페이스 수준(공통)
	•	메서드 3개: getAlgorithm() · getFormat() · getEncoded()
	•	타입 계층: Key ← SecretKey(대칭) / PublicKey / PrivateKey
	•	직렬화 가능: Serializable 구현

2) 구현체가 갖는 것(개념)
	•	키 재료: 실제 바이트(소프트웨어 키) 또는 핸들만(HSM/Keystore, 추출 불가라 바이트 없음)
	•	알고리즘 라벨: "AES", "HmacSHA256", "RSA", "EC" 등
	•	표현 형식: "RAW"(대칭키), "X.509"(공개키), "PKCS#8"(개인키)
	•	(프로바이더별) 속성: 길이, 용도(서명·암호화·MAC), 추출 가능 여부 등

3) 알고리즘별 대표 구성
	•	대칭키 SecretKey: 랜덤 바이트 + 알고리즘(예: "AES", "HmacSHA256"), 보통 getFormat()="RAW"
	•	RSA 공개키 RSAPublicKey: 모듈러스 n, 공개 지수 e
	•	RSA 개인키 RSAPrivateKey/RSAPrivateCrtKey: 개인 지수 d(+ CRT 파라미터 p, q, dP, dQ, qInv)
	•	EC 공개키 ECPublicKey: 곡선 파라미터 + 점 W(x,y)
	•	EC 개인키 ECPrivateKey: 곡선 파라미터 + 스칼라 s
	•	DSA: 파라미터 p,q,g + 공개키 y / 개인키 x

4) 인코딩/저장 관점
	•	**getFormat()**이 형식을 말해줌: "RAW" / "X.509" / "PKCS#8"
	•	**getEncoded()**는 그 형식으로 직렬화된 바이트(일부 키는 null: 추출 불가)
	•	공개키 파일은 보통 X.509(SubjectPublicKeyInfo), 개인키는 PKCS#8(PrivateKeyInfo)

5) 추출 불가(opaque) 키
	•	HSM/Android Keystore 등에 저장되면 키 원문이 절대 노출되지 않고, 연산은 저장소 내부에서만 수행 (getEncoded() == null 가능)

6) 관련 타입 관계
	•	KeySpec: 키의 “투명한 설계도”(예: PKCS8EncodedKeySpec, X509EncodedKeySpec)
	•	KeyFactory/SecretKeyFactory: KeySpec ↔ Key 변환 담당

실무 팁
	•	설정값은 Base64로 저장 → 로딩 후 **디코드 → SecretKey/Key**로 즉시 변환해 보관
	•	대칭키는 "RAW"가 정상, 공개/개인키는 각각 X.509/PKCS#8 형식인지 확인
	•	HSM/Keystore 사용 시 키 추출 불가를 전제하고 API(예: Cipher, Signature, Mac)에 직접 Key를 넘겨 사용
---
## 💭 나의 추가적 생각/질문
-