Ray casting
- R(t) = O + t * D 와 삼각형 P(u, v) = V0 + u * (V1- V0) + v * (V2 - V0)  가 있을 때
- R(t) = P(u, v) 를 만족하는 u, v, t 를 구한다
- u ≥ 0, v ≥ 0, u+v ≤ 1 일 때, R(t) 는 삼각형 내의 점이라고 판별할 수 있다.

Picking
- Sphere → AABB → Ray-Triangle test 를 순차적으로 수행 (연산 비용 순)