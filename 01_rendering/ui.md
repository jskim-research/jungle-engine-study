Screen-Aligned Quad
- Clip space 좌표를 CPU 에서 만들어서 VS 에 넣어줌 (MVP 적용 X)

SubUV
- NxM 으로 하나의 Texture 에서 UV 영역들을 나누고
- Index 에 따라서 각각의 UV 영역에 대한 Texture 를 보여줄 수 있음

Texture Atlasing
- 다양한 텍스처들을 하나의 이미지에 모아놓고 로드함으로써 효율적으로 활용
- Texture cache hit 증가 (spatial locality)