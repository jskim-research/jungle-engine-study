## WireframeOutlineRendering

윈도우 3D viewer를 모방해 obj 파일을 띄울 수 있는 viewer를 만들었고 그 결과는 아래와 같았다.\
좌측이 윈도우의 것, 우측이 모방한 결과이다.

<p>
  <img src="../99_resource/images/mario_win3D_viewer.png" width="300" height ="240">
  <img src="../99_resource/images/mario_simple_viewer.png" width="300" height ="240">
</p>

모방의 과정에서 와이어프레임을 별도의 패스로 다시 그리는 방식을 채택했으며 결국 동일한 geometry를\
두 번 렌더링하게 된다. 우선 solid pass에서 채워진 폴리곤이 깊이 버퍼를 기록하고, 이후 wireframe\
pass에서 같은 위치의 edge를 다시 그리게 되는데, 이때 거의 같은 depth를 가지게 된다. 따라서 픽셀의\
선후 관계가 불분명해지는 z-fighting이 발생한다.

### 왜 depth bias로는 부족한가?
depth bias는 이 같은 문제를 완화하기 위해 depth를 미세하게 앞으로 밀어내는 기법인데(여기서는 \
wireframe을) bias 값은 화면 해상도, 깊이 분포, 투영 행렬에 상관 없이 동일하게 depth 값에\
offset을 더하기 때문에 모든 상황에서 안정적인 결과를 보장하지 못한다. 특히 곡면의 경우에는 내부\
edge가 드러나거나 외곽선이 끊어지는 문제가 발생한다.

### 그렇다면 무엇이 더 필요한가?
이 문제를 해결하는 접근은 목적에 따라 두 가지로 나뉜다.\
하나는 화면에서 보이는 경계를 강조하는 방식이고,\
다른 하나는 삼각형의 실제 edge를 표현하는 방식이다.\
 각각 먼저 screen-space edge detection이고, 그 다음은 barycentric coordinate 기반의 edge 구분이다.\
 이 기법은 geometry를 다시 그리지 않고, 이미 렌더링이 완료된 화면 정보를 기반으로 경계를 추출한다.

### screen-space edge detection - 일단 그려보고 edge를 찾아내겠다
최종 color buffer나 그 이전 단계에서 생성된 depth buffer와 normal buffer를 입력으로 사용하여,\
각 픽셀 주변과의 차이를 분석함으로써 edge를 판단한다. 예를 들어 어떤 픽셀의 depth 값이 인접 픽셀과\
급격히 달라진다면 이는 물체의 앞뒤 관계가 바뀌는 지점, 즉 실루엣이나 겹침 경계일 가능성이 높다.\
또한 normal 값이 크게 변화하는 경우는 표면의 방향이 급격히 꺾이는 지점으로, 면과 면 사이의 경계로\
해석할 수 있다. 이러한 기준을 바탕으로 픽셀 단위에서 임계값을 적용해 edge 여부를 판별하고, 해당 픽셀에\
별도의 색을 덧입혀 선처럼 표현한다.

그러나 screen-space edge detection은 geometry의 실제 topology를 그대로 보여주는 방식은 아니다.\
삼각형의 모든 edge를 정확히 표현하는 것이 아니라, 화면상에서 시각적으로 의미 있는 경계만을 추출한다.\
따라서 내부 삼각형 구조를 모두 드러내는 디버깅 목적의 wireframe과는 성격이 다르다.

### barycentric coordinate - 그러면 그건 실제 edge는 아니지 않은가?
그렇다. 위의 방식은 렌더링 결과를 두고 edge를 찾아내는 것이므로 실제 버텍스들이 연결되어 만들어 내는 face와는\
일치하지 않을 수 있다. 와이어프레임에서 바깥 프레임만 안정적으로 보여주기 위해서는 barycentric coordinate을\
사용해야 한다. 이 경우에는 픽셀 셰이더에서 edge 근처인 걸 파악하고 그 주변에서만 색을 바꾼다. 이 방식은 삼각형\
내부에서 보간된 barycentric 좌표를 이용해 픽셀 단위에서 edge 근처를 판별한다. 따라서 geometry를 다시 그릴\
필요가 없으며, 동일한 depth 값을 공유하기 때문에 z-fighting이 발생하지 않는다.

### 정리하자면
둘 다 geometry를 추가로 렌더링하지 않기 때문에 z-fighting 자체가 발생하지 않는다. 모든 처리가 screen space에서\
이루어지므로 depth bias에 의존할 필요가 없고, 시점 변화나 모델 복잡도와 관계없이 안정적인 결과를 얻을 수 있다.\
또한 동일한 버퍼를 기반으로 하기 때문에 일관된 외곽선 표현이 가능하다.

결론적으로, 단순히 외곽선이나 형태를 강조하는 것이 목적이라면\
screen-space edge detection이 충분하다.\
반면, 실제 mesh의 삼각형 구조를 정확히 표현해야 하는 경우에는\
barycentric 기반의 wireframe 방식이 필요하다.