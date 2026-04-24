# Why Use Cascaded Shadow Maps for Directional Light?

Shadow Mapping 은 결국 광원의 위치에서 바라본 Depth Buffer를 만드는 과정이다.\
로컬 라이트들의 경우, 이 방식은 아래처럼 비교적 직관적이다.

* **Spot Light:** 카메라처럼 방향을 가지므로 원뿔 형태의 Frustum을 설정한다.\
* **Point Light:** 정해진 방향이 없으니 모두 커버하기 위해 여섯 방향의 depth를 기록할 수 있는 Cube Map을 사용한다.\
(퀄리티 문제로 더는 안 쓰이지만, 2개의 hemisphere를 찍는 Dual Paraboloid를 사용할 수도 있겠다).

그렇다면 **Directional Light**는 어떻게 할까. 태양광처럼 scene 전체를 평행하게 내리쬐는 이 광원은 고정된 위치도, 구체적인 범위도 없다.\
scene 전체를 담을 정도로 충분히 큰 shadow map 을 그려야 하는데, 크기를 아무리 키워도 퀄리티가 무너진다.

### 1. 플레이어의 시야와 원근 앨리어싱 (Perspective Aliasing)

현실적으로 무한한 맵을 만들 수 없으므로, 우리는 플레이어가 현재 보고 있는 시야에 대해서만 shadow map을 저장한다.\
이건 다른 빛도 마찬가지다. 당장 보지 않는 부분에 대해서도 depth를 매번 그리는 건 이상하다. 어차피 culling 되어 나타나지 않을\
옆방 테이블에 놓인 주전자에 대해 그 위에 조명이 있다고 계속 depth를 계산할 필요가 없다.

그런데 이 방식에도 치명적인 한계가 있다. Perspective Aliasing 이다.\
directional light의 Shadow map은 orthographic projection 이기 때문에 그 밀도가 일정하다. 반면, 카메라는 보통 Perspective Projection이다.\

* 근거리 문제   : 카메라와 가까운 물체는 화면에서 크게 보이지만, 섀도우 맵 상에서는 먼 물체와 동일한 해상도를 가진다. 퀄리티가 망가진다.
* 원거리 낭비   : 반대로 멀리 있는 물체는 화면에서 아주 작게 보임에도 불구하고, 가까운 곳과 동일한 정밀도의 shadow map 을 가지니 메모리가 낭비가 심하다.

근본적인 문제는 카메라 혹은 플레이의 위치와 상관 없는 곳에서 일정한 shadow map 을 만드는 데 있다.\
화면 끄트머리 저 멀리 위치한 픽셀 몇 개를 위해 너무 정교한 작업이 들어가고 있어 지금 당장 눈앞의 테이블에 필요한 자원을 빼앗기고 있다.\
이쯤 되면 LOD 가 떠오른다.

#### LOD?  >>> [Wireframe Outline Rendering](<../04_optimization/LOD.md>)

---

### 2. CSM (Cascaded Shadow Maps)

이 해상도 불균형 문제를 해결하기 위해 도입된 기법이 바로 **CSM(Cascaded Shadow Maps)**이다. 원리는 간단하다.\
카메라가 보는 시야, View Frustum를 거리 별로 여러 구간으로 쪼개서 해상도에 차등을 둔다.

#### **작동 원리**

1. Frustum Splitting: View Frustum을 Near, Mid, Far 등의 단계(Cascade)로 나눈다.\
보통 근거리의 품질을 위해 카메라에 가까울수록 구간을 더 세밀하게 나눈다.

2. 단계별 Shadow Map 생성:
* Near Cascade: 카메라와 아주 가까운 좁은 영역만 담는다. 좁은 범위라 shadow map의 해상도가 높고 그림자도 선명하다.
* Far Cascade: 훨씬 멀리까지, 넓은 영역을 담는다. 동일한 텍스처 크기를 사용하더라도 커버하는 범위가 넓어 밀도는 낮아진다.

3. 셰이더 샘플링: 픽셀 셰이더에서 현재 픽셀의 Depth 값을 확인하여 어떤 Cascade에 속하는지 판단하고, 해당 섀도우 맵에서 값을 읽어온다. 이때 경계면이 어색하지 않도록 인접한 Cascade 간의 블렌딩 처리를 할 수 있다.

CSM을 적용하기 전까지 우리의 시야에서 shadow map의 해상도는 아래와 같았다.

<p>
  <img src="../99_resource/images/shadow map coverage.png" width="960" height ="300">
</p>

이제는 아래와 같다. 마치 폭포수가 퍼져나가며 잠잠해지는 것 같지 않은가.

<p>
  <img src="../99_resource/images/csm shadow quality.png" width="317" height ="300">
</p>

또 어떻게 directional light에서 shadow map을 그릴 지도 감이 잡혔다.\
관건은 카메라가 보는 곳만, 차등을 둬서 그린다.