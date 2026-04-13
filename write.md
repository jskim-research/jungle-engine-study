---
layout: page
title: Writer Studio
permalink: /write/
comments: false
page_meta: false
---

<section class="writer-intro">
  <div class="writer-intro-copy">
    <p class="writer-kicker">Writer Studio</p>
    <h2>사이트 안에서 문서를 불러오고, 쓰고, 미리보고, GitHub로 넘깁니다.</h2>
    <p>
      이 작업실은 정적 GitHub Pages 사이트에 맞춘 브라우저 기반 문서 작성 공간입니다.
      새 문서를 시작하거나 기존 문서를 불러와 편집 초안을 만들고, 로컬 초안 저장, 실시간 미리보기,
      GitHub 편집기와 제안 이슈 연결까지 한 화면에서 이어서 처리할 수 있습니다.
    </p>
  </div>
  <div class="writer-intro-status">
    <span class="writer-status-chip">Live Preview</span>
    <span class="writer-status-chip">Doc Library</span>
    <span class="writer-status-chip">Draft Memory</span>
    <span class="writer-status-chip">GitHub Handoff</span>
  </div>
</section>

<section class="writer-shell" data-writer-app>
  <aside class="writer-sidebar">
    <section class="writer-panel">
      <div class="writer-panel-head">작업 모드</div>
      <div class="writer-mode-switch" role="tablist" aria-label="문서 작업 모드">
        <button type="button" class="writer-mode-button" data-writer-mode="new">새 문서</button>
        <button type="button" class="writer-mode-button" data-writer-mode="edit">기존 문서 편집</button>
      </div>
      <input type="hidden" data-writer-field="mode" value="new" />

      <div class="writer-form">
        <label class="writer-field">
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
          <input type="text" data-writer-field="slug" placeholder="예: fog-system" />
          <small>`.md`는 자동으로 붙습니다.</small>
        </label>

        <label class="writer-field" data-writer-edit-only hidden>
          <span>대상 문서 경로</span>
          <input type="text" data-writer-field="path" placeholder="예: 03_engine/CDO.md" />
          <small>라이브러리에서 문서를 불러오면 자동으로 채워집니다.</small>
        </label>

        <label class="writer-field">
          <span>문서 요약</span>
          <textarea data-writer-field="summary" rows="4" placeholder="문서의 핵심 목적과 범위를 적어주세요."></textarea>
        </label>
      </div>
    </section>

    <section class="writer-panel">
      <div class="writer-panel-head">빠른 템플릿</div>
      <div class="writer-template-list">
        <button type="button" class="writer-template-button" data-writer-template="concept">개념 설명</button>
        <button type="button" class="writer-template-button" data-writer-template="comparison">비교 정리</button>
        <button type="button" class="writer-template-button" data-writer-template="walkthrough">구현 흐름</button>
        <button type="button" class="writer-template-button" data-writer-template="review">문서 개선 제안</button>
      </div>
      <p class="writer-helper-copy">본문이 비어 있을 때는 템플릿이 바로 채워지고, 이미 작성 중이면 맨 앞에 삽입됩니다.</p>
    </section>

    <section class="writer-panel">
      <div class="writer-panel-head">문서 라이브러리</div>
      <div class="writer-panel-body">
        <label class="writer-field">
          <span>문서 찾기</span>
          <input type="search" data-writer-search placeholder="제목이나 경로로 검색" />
        </label>
        <div class="writer-doc-list" data-writer-doc-list>
          <p class="writer-empty">문서 목록을 불러오는 중입니다.</p>
        </div>
      </div>
    </section>

    <section class="writer-panel">
      <div class="writer-panel-head">저장한 초안</div>
      <div class="writer-panel-body">
        <div class="writer-draft-list" data-writer-draft-list>
          <p class="writer-empty">아직 저장한 초안이 없습니다.</p>
        </div>
      </div>
    </section>
  </aside>

  <div class="writer-main">
    <section class="writer-panel writer-toolbar-panel">
      <div class="writer-toolbar">
        <div class="writer-toolbar-meta">
          <span class="writer-toolbar-label">대상 경로</span>
          <strong data-writer-output="path">-</strong>
          <span class="writer-toolbar-divider"></span>
          <span data-writer-output="stats">0자 · 0단어</span>
        </div>
        <div class="writer-toolbar-actions">
          <button type="button" class="writer-button" data-writer-action="save">초안 저장</button>
          <button type="button" class="writer-button" data-writer-action="copy">Markdown 복사</button>
          <button type="button" class="writer-button" data-writer-action="download">파일 다운로드</button>
        </div>
      </div>
      <p class="writer-status" data-writer-status>문서를 선택하거나 바로 새 초안을 시작하세요.</p>
    </section>

    <div class="writer-workspace">
      <section class="writer-panel writer-editor-panel">
        <div class="writer-panel-head">Markdown Editor</div>
        <label class="writer-field writer-field-editor">
          <span>본문</span>
          <textarea data-writer-field="content" rows="26" placeholder="문서 본문 Markdown을 작성하세요."></textarea>
        </label>
        <p class="writer-editor-note">
          코드 블록, 제목, 목록, 인용문, 표, 링크 정도는 오른쪽 미리보기에서 바로 반영됩니다.
        </p>
      </section>

      <section class="writer-panel writer-preview-panel">
        <div class="writer-panel-head">Live Preview</div>
        <div class="writer-preview-shell">
          <div class="writer-preview-meta">
            <div>
              <span class="writer-preview-label">저장소</span>
              <strong data-writer-output="repo">-</strong>
            </div>
            <div>
              <span class="writer-preview-label">제안 이슈 제목</span>
              <strong data-writer-output="issue-title">-</strong>
            </div>
          </div>
          <div class="writer-rendered" data-writer-output="preview"></div>
        </div>
      </section>
    </div>

    <section class="writer-panel writer-publish-panel">
      <div class="writer-panel-head">GitHub 제출</div>
      <div class="writer-publish-grid">
        <div class="writer-publish-copy">
          <p>
            이 작업실은 브라우저에서 문서를 완성한 뒤 GitHub 저장소로 자연스럽게 넘기는 흐름입니다.
            새 문서는 GitHub 새 파일 편집기로, 기존 문서는 해당 파일 편집기로 열 수 있고,
            문서 제안은 이슈 형태로도 남길 수 있습니다.
          </p>
          <ul class="writer-publish-list">
            <li>새 문서: `new/main?filename=...` 흐름으로 연결</li>
            <li>기존 문서: 대상 `.md` 파일의 웹 편집기로 연결</li>
            <li>제안 이슈: 제목, 경로, 요약, 초안 Markdown을 자동 포함</li>
          </ul>
        </div>
        <div class="writer-publish-actions">
          <button type="button" class="writer-button writer-button-accent" data-writer-action="github-editor">GitHub 편집기 열기</button>
          <button type="button" class="writer-button writer-button-accent" data-writer-action="issue">제안 이슈 열기</button>
        </div>
      </div>
    </section>
  </div>
</section>
