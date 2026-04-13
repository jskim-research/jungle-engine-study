# Jungle Engine Tech Lab

게임테크랩에서 학습한 그래픽스, 렌더링, 엔진 구조를 정리한 협업 기술 아카이브

🌐 사이트

[https://jskim-research.github.io/jungle-engine-study/](https://jskim-research.github.io/jungle-engine-study/)

📌 소개

이 레포지토리는 그래픽스 파이프라인, 수학적 개념, 엔진 구조를 중심으로
게임 엔진의 내부 동작을 이해하고 정리하기 위한 협업 문서 저장소입니다.

📂 문서 구조

00. [Conventions](./00_conventions/)
프로젝트 전반에서 사용하는 공통 규칙 (좌표계, 행렬, 회전 등)
01. [Rendering](./01_rendering/)
렌더링 파이프라인 및 GPU 관련 개념
02. [Math](./02_math/)
Ray, Intersection, Bounding Volume 등 기하/수학
03. [Engine](./03_engine/)
UUID, RTTI 등 엔진 시스템
04. [Optimization](./04_optimization/)
Batch Rendering, Texture Atlas, FName 등 성능 최적화
05. [Misc](./05_misc/)
기타 개념

## 깃허브 페이지 관련 가이드

- 깃허브 페이지 테스트 프로그램 설치
```
cmd
winget install RubyInstallerTeam.RubyWithDevKit.3.3
터미널 닫고 다시 열기
ruby -v, gem -v 가 정상적으로 작동하면 됨
gem install bundler
bundle -v 가 정상적으로 작동하면 됨
```

- 테스트 프로그램 실행
```
cd C:\jungle-engine-study  (jungle-engine-study 폴더로 이동)
bundle install
bundle exec jekyll clean
bundle exec jekyll build

bundle exec jekyll serve --livereload

홈페이지 => http://127.0.0.1:4000/jungle-engine-study/
```

## 작성자 레벨 산정 기준 (공정성 v3)

`README.md`, `index.md`, 각 카테고리 `README.md`는 제외하고 실제 개념 문서 `*.md`만 집계합니다.

핵심 원칙:
- 커밋 횟수보다 `최종 남아있는 내용`을 더 크게 반영
- 각 문서의 현재 내용 기준으로 `git blame` 라인 소유 비율을 계산
- 품질 점수도 문서 내 라인 점유율 비율로 작성자에게 분배

총점 계산식:
`총점 = 콘텐츠 점수 + 품질 점수 + 리드 보너스 + 협업 보너스`

세부 기준:
- 콘텐츠 점수: `sqrt(보유 콘텐츠 라인 수) * 12`
- 품질 점수(문서당 최대 40):
  - 분량, 헤딩 구조, 이미지, 코드 블록, 수식, 외부 링크 포함 여부 반영
  - 문서 내 라인 점유율 비율로 각 작성자에게 배분
- 리드 보너스: 문서 내 최다 라인 기여자(동률 포함) 1건당 `+10`
- 협업 보너스(타인 문서 보강 문서 수):
  - 1개 이상: `+5`
  - 4개 이상: `+12`
  - 8개 이상: `+25`

EXP:
- `EXP = 총점 * 25`

레벨/몬스터:
- 점수 `76`당 레벨 `+1` (최대 Lv.50)
- Lv.1~10: Slime Apprentice (Slime)
- Lv.11~20: Wolf Vanguard (Wolf)
- Lv.21~30: Golem Strategist (Golem)
- Lv.31~40: Wyvern Marshal (Wyvern)
- Lv.41~50: Dragon Sovereign (Dragon)

실행 커맨드(한 번에 전체 업데이트):
```
powershell -ExecutionPolicy Bypass -File .\update-metadata.ps1
```
