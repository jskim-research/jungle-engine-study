## From Vertices to Pixels, The Journey of Interpolation

그래픽스에서 주요하게 다루어지는 보간(interpolation)을 정리한다.\
보간이란 기본적으로 이산적인 데이터의 사이를 채워넣는 걸 가리킨다.\
또 그래픽스에서 vertex 데이터를 pixel로 전달하는 유일한 방법이며, rasterization의 핵심 수학 구조이며,\
vertex 사이의 소수점 너머 무한히 확장되는 공간을 화면의 픽셀로 채워넣는 기술이다.

### Linear Interpolation + affine combination
가장 먼저 선형 보간을 이야기해보자.\
수직선 위 점의 위치를 가리키는 좌표계다.

### barycentric coordinate + triangle rasterization
선형 보간이 2차원으로 확장하면 barycentric이 된다.\
삼각형 내부 점의 위치를 가리키는 좌표계다.