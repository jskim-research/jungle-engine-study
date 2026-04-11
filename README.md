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
- 필요 프로그램 설치
```
cmd
winget install RubyInstallerTeam.RubyWithDevKit.3.3
터미널 닫고 다시 열기
ruby -v, gem -v 가 정상적으로 작동하면 됨
gem install bundler
bundle -v 가 정상적으로 작동하면 됨
```

- 테스트 환경 실행
```
cd C:\jungle-engine-study  (jungle-engine-study 폴더로 이동)
bundle install
bundle exec jekyll clean
bundle exec jekyll build

bundle exec jekyll serve --livereload

홈페이지 => http://127.0.0.1:4000/jungle-engine-study/
```

- 작성자 레벨 업데이트
```
// 해당 프로젝트 폴더 내에서
powershell -ExecutionPolicy Bypass -File .\scripts\update-author-stats.ps1
```
