AABB

- Axis Aligned (Standard basis vector 에 Bounding Box 각 축 평행)
    - 계산 쉬워짐
    - 다만, 축이 고정이다 보니 축을 바꾸면 더 범위를 줄일 수 있음에도 못 함
        - 이를 해결하기 위한 OBB 등의 방법 들이 존재
- Sphere 등에 대해선 구체 방정식을 고려하면 더욱 정확함