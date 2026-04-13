---
layout: default
title: Jungle Game Tech Lab 3기
---

<section class="hero">
  <p class="hero-kicker">Jungle Engine Study Archive</p>
  <h1>Jungle Game Tech Lab 3기</h1>
  <p class="hero-desc">게임테크랩에서 학습한 그래픽스, 렌더링, 수학, 엔진 구조 문서를 카테고리별로 정리한 기술 아카이브입니다.</p>
</section>

<section class="category-grid">
  <article class="category-card">
    <h2>00. Conventions</h2>
    <p>좌표계, 행렬, 회전 규칙 등 공통 약속.</p>
    <ul>
      <li><a href="./00_conventions/graphics_conventions">Graphics Conventions</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>01. Rendering</h2>
    <p>렌더링 파이프라인과 GPU 동작 개념.</p>
    {% assign rendering_docs = site.static_files | where: "extname", ".md" | sort: "path" %}
    <ul>
      {% for doc in rendering_docs %}
      {% if doc.path contains '/01_rendering/' %}
      {% unless doc.name == 'README.md' %}
      <li><a href="{{ doc.path | replace: '.md', '' | relative_url }}">{{ doc.name | replace: '.md', '' }}</a></li>
      {% endunless %}
      {% endif %}
      {% endfor %}
    </ul>
  </article>

  <article class="category-card">
    <h2>02. Math</h2>
    <p>기하, 교차 판정, 보간 등 그래픽스 수학.</p>
    {% assign math_docs = site.static_files | where: "extname", ".md" | sort: "path" %}
    <ul>
      {% for doc in math_docs %}
      {% if doc.path contains '/02_math/' %}
      {% unless doc.name == 'README.md' %}
      <li><a href="{{ doc.path | replace: '.md', '' | relative_url }}">{{ doc.name | replace: '.md', '' }}</a></li>
      {% endunless %}
      {% endif %}
      {% endfor %}
    </ul>
  </article>

  <article class="category-card">
    <h2>03. Engine</h2>
    <p>런타임 타입 시스템과 직렬화, 식별 체계.</p>
    {% assign engine_docs = site.static_files | where: "extname", ".md" | sort: "path" %}
    <ul>
      {% for doc in engine_docs %}
      {% if doc.path contains '/03_engine/' %}
      {% unless doc.name == 'README.md' %}
      <li><a href="{{ doc.path | replace: '.md', '' | relative_url }}">{{ doc.name | replace: '.md', '' }}</a></li>
      {% endunless %}
      {% endif %}
      {% endfor %}
    </ul>
  </article>

  <article class="category-card">
    <h2>04. Optimization</h2>
    <p>배치 처리, 계층화, 벡터화 기반 최적화.</p>
    {% assign optimization_docs = site.static_files | where: "extname", ".md" | sort: "path" %}
    <ul>
      {% for doc in optimization_docs %}
      {% if doc.path contains '/04_optimization/' %}
      {% unless doc.name == 'README.md' %}
      <li><a href="{{ doc.path | replace: '.md', '' | relative_url }}">{{ doc.name | replace: '.md', '' }}</a></li>
      {% endunless %}
      {% endif %}
      {% endfor %}
    </ul>
  </article>

  <article class="category-card">
    <h2>05. Misc</h2>
    <p>파일 포맷, 텍스트 렌더링 등 기타 주제.</p>
    {% assign misc_docs = site.static_files | where: "extname", ".md" | sort: "path" %}
    <ul>
      {% for doc in misc_docs %}
      {% if doc.path contains '/05_misc/' %}
      {% unless doc.name == 'README.md' %}
      <li><a href="{{ doc.path | replace: '.md', '' | relative_url }}">{{ doc.name | replace: '.md', '' }}</a></li>
      {% endunless %}
      {% endif %}
      {% endfor %}
    </ul>
  </article>
</section>
