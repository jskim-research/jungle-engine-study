---
layout: default
title: Jungle Engine Tech Lab
---

<section class="hero">
  <p class="hero-kicker">Jungle Engine Study Archive</p>
  <h1>Jungle Engine Tech Lab</h1>
  <p class="hero-desc">게임테크랩에서 학습한 그래픽스, 렌더링, 수학, 엔진 구조 문서를 카테고리별로 정리한 기술 아카이브입니다.</p>
  <a class="hero-link" href="https://jskim-research.github.io/jungle-engine-study/">사이트 바로가기</a>
</section>

<section class="category-grid">
  <article class="category-card">
    <h2>00. Conventions</h2>
    <p>좌표계, 행렬, 회전 규칙 등 공통 약속.</p>
    <ul>
      <li><a href="./00_conventions/README">카테고리 소개</a></li>
      <li><a href="./00_conventions/graphics_conventions">Graphics Conventions</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>01. Rendering</h2>
    <p>렌더링 파이프라인과 GPU 동작 개념.</p>
    <ul>
      <li><a href="./01_rendering/README">카테고리 소개</a></li>
      <li><a href="./01_rendering/Decal">Decal</a></li>
      <li><a href="./01_rendering/pipeline">Pipeline</a></li>
      <li><a href="./01_rendering/ui">UI</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>02. Math</h2>
    <p>기하, 교차 판정, 보간 등 그래픽스 수학.</p>
    <ul>
      <li><a href="./02_math/README">카테고리 소개</a></li>
      <li><a href="./02_math/bounding_volume">Bounding Volume</a></li>
      <li><a href="./02_math/ray_casting">Ray Casting</a></li>
      <li><a href="./02_math/From%20Vertices%20to%20Pixels,%20The%20Journey%20of%20Interpolation">From Vertices to Pixels, The Journey of Interpolation</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>03. Engine</h2>
    <p>런타임 타입 시스템과 직렬화, 식별 체계.</p>
    <ul>
      <li><a href="./03_engine/README">카테고리 소개</a></li>
      <li><a href="./03_engine/RTTI">RTTI</a></li>
      <li><a href="./03_engine/uuid">UUID</a></li>
      <li><a href="./03_engine/reflection">Reflection</a></li>
      <li><a href="./03_engine/serialization">Serialization</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>04. Optimization</h2>
    <p>배치 처리, 계층화, 벡터화 기반 최적화.</p>
    <ul>
      <li><a href="./04_optimization/README">카테고리 소개</a></li>
      <li><a href="./04_optimization/batch_rendering">Batch Rendering</a></li>
      <li><a href="./04_optimization/fname">FName</a></li>
      <li><a href="./04_optimization/texture_atlas">Texture Atlasing</a></li>
      <li><a href="./04_optimization/LOD">LOD</a></li>
      <li><a href="./04_optimization/Scene%20BVH">Scene BVH</a></li>
      <li><a href="./04_optimization/Mesh%20BVH">Mesh BVH</a></li>
      <li><a href="./04_optimization/SIMD">SIMD</a></li>
    </ul>
  </article>

  <article class="category-card">
    <h2>05. Misc</h2>
    <p>파일 포맷, 텍스트 렌더링 등 기타 주제.</p>
    <ul>
      <li><a href="./05_misc/README">카테고리 소개</a></li>
      <li><a href="./05_misc/obj">OBJ</a></li>
      <li><a href="./05_misc/Dynamic%20Glyph%20Atlas%20for%20Korean%20Text%20Rendering">Dynamic Glyph Atlas for Korean Text Rendering</a></li>
      <li><a href="./05_misc/Texture%20is%20Data,%20Material%20is%20Behavior">Texture is Data, Material is Behavior</a></li>
      <li><a href="./05_misc/Wireframe%20Outline%20Rendering">Wireframe Outline Rendering</a></li>
    </ul>
  </article>
</section>
