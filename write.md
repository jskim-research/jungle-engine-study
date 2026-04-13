---
layout: page
title: 문서 작성 도구
permalink: /write/
comments: false
page_meta: false
---

<section class="writer-intro">
  <p class="writer-kicker">In-Site Writing Flow</p>
  <h2>브라우저 안에서 초안을 작성하고 GitHub로 제출합니다.</h2>
  <p>
    이 페이지는 정적 GitHub Pages 구조에 맞춰 설계된 작성 도구입니다.
    사이트 안에서 문서 초안을 작성한 뒤 Markdown을 복사하거나, GitHub 새 파일 편집기와 제안 이슈로 바로 넘길 수 있습니다.
  </p>
</section>

<section class="writer-shell" data-writer-app>
  <div class="writer-grid">
    <div class="writer-panel">
      <div class="writer-panel-head">작성 설정</div>
      <div class="writer-form">
        <label class="writer-field">
          <span>작업 유형</span>
          <select data-writer-field="mode">
            <option value="new">새 문서 작성</option>
            <option value="edit">기존 문서 개선</option>
          </select>
        </label>

        <label class="writer-field" data-writer-new-only>
          <span>카테고리</span>
          <select data-writer-field="category">
            <option value="00_conventions">00. Conventions</option>
            <option value="01_rendering">01. Rendering</option>
            <option value="02_math">02. Math</option>
            <option value="03_engine">03. Engine</option>
            <option value="04_optimization">04. Optimization</option>
            <option value="05_misc">05. Misc</option>
          </select>
        </label>

        <label class="writer-field">
          <span>문서 제목</span>
          <input type="text" data-writer-field="title" placeholder="예: FName" />
        </label>

        <label class="writer-field" data-writer-new-only>
          <span>파일명</span>
          <input type="text" data-writer-field="slug" placeholder="예: FName 또는 fog-system" />
          <small>`.md` 확장자는 자동으로 붙습니다.</small>
        </label>

        <label class="writer-field" data-writer-edit-only hidden>
          <span>대상 문서 경로</span>
          <input type="text" data-writer-field="path" placeholder="예: 03_engine/CDO.md" />
          <small>기존 문서를 개선하는 경우 경로를 지정합니다.</small>
        </label>

        <label class="writer-field">
          <span>요약</span>
          <textarea data-writer-field="summary" rows="4" placeholder="이 문서가 다루는 핵심 내용과 의도를 적어주세요."></textarea>
        </label>
      </div>
    </div>

    <div class="writer-panel writer-panel-wide">
      <div class="writer-panel-head">Markdown 초안</div>
      <label class="writer-field writer-field-editor">
        <span>본문</span>
        <textarea data-writer-field="content" rows="22" placeholder="문서 본문 Markdown을 작성하세요."></textarea>
      </label>
      <div class="writer-actions">
        <button type="button" class="writer-button" data-writer-action="template">기본 템플릿 넣기</button>
        <button type="button" class="writer-button" data-writer-action="save">초안 저장</button>
        <button type="button" class="writer-button" data-writer-action="copy">Markdown 복사</button>
        <button type="button" class="writer-button writer-button-accent" data-writer-action="github-editor">GitHub 편집기 열기</button>
        <button type="button" class="writer-button writer-button-accent" data-writer-action="issue">제안 이슈 열기</button>
      </div>
      <p class="writer-status" data-writer-status>초안을 입력하면 제출 경로가 자동으로 준비됩니다.</p>
    </div>
  </div>

  <div class="writer-grid writer-grid-secondary">
    <section class="writer-panel">
      <div class="writer-panel-head">제출 정보</div>
      <dl class="writer-summary">
        <div>
          <dt>대상 경로</dt>
          <dd data-writer-output="path">-</dd>
        </div>
        <div>
          <dt>GitHub 저장소</dt>
          <dd data-writer-output="repo">-</dd>
        </div>
        <div>
          <dt>제안 이슈 제목</dt>
          <dd data-writer-output="issue-title">-</dd>
        </div>
      </dl>
    </section>

    <section class="writer-panel writer-panel-wide">
      <div class="writer-panel-head">생성된 Markdown</div>
      <textarea class="writer-preview" data-writer-output="markdown" rows="18" readonly></textarea>
    </section>
  </div>
</section>
