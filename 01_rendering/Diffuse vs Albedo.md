## Diffuse vs Albedo

### 1. 둘에 대한 정리

Albedo 는 재질 그 자체의 색(정확히는 파장별반사율이라고 하는데, 반사된 게 우리 눈에 들어오니까)을 나타낸다.\
빛이 없어도 존재하는 순수한 값이며 언리얼에서는 Base Color 라는 말을 쓴다.

Diffuse 란 Lighting 의 결과 중 난반사를 의미한다.\
Intensity, Attenuation 을 무시하면 둘의 관계는 아래와 같다.\
Lambert 난반사를 의미하므로 카메라의 위치와는 상관 없다.

$$
Diffuse = Albedo × max(N·L, 0)
$$

### 2. 둘이 같아지는 순간

따라서 조명의 영향이 1일 때 둘은 같아진다.\
이게 어떤 경우인가? 정면으로 빛이 들어오고, 감쇠 등의 영향이 없을 때다.

### 3. 사실 예전이랑 다르게 쓰이고 있다.

Diffuse 라는 말 자체가 가끔 모호한데 Blinn-Phong 시대의 유물 때문이다.\
당시에는 색 텍스처를 Diffuse texture라고 불렀는데, 이는 Diffuse term에 사용되는 입력 텍스처라는 의미였다.\
그래서 Albedo 와 Diffuse 가 자주 혼용되었다.

```
FinalColor = DiffuseTexture × (N·L) + Specular
```

Phong에서도 이런 식으로 계산했으니 오늘날 PBR에서와는 전혀 다른 단어가 된 것이다.