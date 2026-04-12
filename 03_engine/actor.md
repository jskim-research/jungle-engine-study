해당 문서는 자동 생성되었습니다. 추후 수정 예정입니다.

## Actor

언리얼에서 Actor는 월드에 배치될 수 있는 객체를 가리킨다.\
씬에 존재하는 하나의 단위 라고 보면 된다.

예를 들면 다음과 같다.
- 카메라
- 조명
- 캐릭터
- 총알
- 문

이들은 제각기 역할은 다르지만 공통적으로 월드에 존재하고,\
Tick, Transform, Collision, Replication 같은 엔진 시스템과 연결될 수 있다는 공통점이 있다.

### 1. Actor와 Component

Actor 하나만으로도 객체는 성립하지만, 실제 기능은 대개 Component를 붙여서 만든다.

즉 Actor는 그 자체가 모든 기능을 직접 들고 있는 거대한 덩어리라기보다\
여러 Component를 소유하고 관리하는 컨테이너에 가깝다.

예를 들어 어떤 문(Door) Actor를 만든다고 해보자.

- 위치와 회전을 가지는 Component
- 문짝 메쉬를 보여주는 Component
- 충돌을 검사하는 Component
- 사운드를 재생하는 Component

이런 식으로 역할을 나눠 붙이는 편이 자연스럽다.

정리하면 다음과 같다.

- Actor
  - 월드에 존재하는 객체 단위
  - Component들을 소유하고 관리함
- Component
  - 실제 기능을 쪼개 담는 단위
  - 필요에 따라 Actor에 부착되어 동작함

### 2. ActorComponent와 다른 Component의 관계

언리얼의 Component는 크게 보면 `UActorComponent`에서 시작한다.

```cpp
UActorComponent
 └─ USceneComponent
     └─ UPrimitiveComponent
```

이 계층을 기준으로 생각하면 이해가 편하다.

#### UActorComponent

가장 기본이 되는 컴포넌트다.\
Actor에 붙어서 어떤 기능을 제공하지만, 공간상의 위치나 회전이나 스케일을 직접 갖지는 않는다.

예를 들면 다음과 같은 것들이 여기에 가깝다.

- 이동 로직
- 상태 관리
- 인벤토리
- 어빌리티
- 오디오 재생 제어

즉 "기능은 있지만 씬에서 자기 자리가 없는 컴포넌트" 라고 보면 된다.

#### USceneComponent

`UActorComponent`를 상속받아 Transform을 가지게 된 컴포넌트다.\
위치(Location), 회전(Rotation), 스케일(Scale)을 가지며,\
다른 `USceneComponent`에 붙어서 부모-자식 계층을 만들 수 있다.

즉 씬에서 자리를 차지하는 컴포넌트는 대개 여기에 속한다.

#### UPrimitiveComponent

`USceneComponent`를 상속받고, 여기에 더해 렌더링이나 충돌과 더 직접적으로 연결되는 컴포넌트다.

예를 들면 다음과 같다.

- `UStaticMeshComponent`
- `USkeletalMeshComponent`
- `UBoxComponent`
- `USphereComponent`
- `UCapsuleComponent`

즉 눈에 보이거나, 충돌을 만들거나, 둘 다 하는 컴포넌트들이 주로 여기에 들어간다.

### 3. Actor와 Root Component

Actor를 이해할 때 가장 중요한 것 중 하나가 Root Component다.

`AActor`는 여러 Component를 가질 수 있지만, 그중 하나를 `RootComponent`로 삼을 수 있다.\
이 Root Component가 Actor의 기준 Transform 역할을 한다.

쉽게 말하면 다음과 같다.

- Actor의 위치를 옮긴다
- 사실상 Root Component의 Transform이 기준이 된다
- 루트에 붙은 Scene Component들은 그 변화를 함께 따라간다

즉 Actor 자신의 Transform이 따로 독립적으로 존재한다기보다,\
대개 Root Component의 Transform을 통해 Actor의 위치와 회전을 표현한다고 이해하는 편이 맞다.

그래서 Actor가 월드에 존재하려면 보통 최소한 하나의 `USceneComponent`가 필요하고,\
그중 하나가 Root가 된다.

### 4. 대표 Component

여기서 말하는 대표 Component는 언리얼의 공식 클래스 이름은 아니다.\
실무적으로 "이 Actor가 무슨 역할을 하는지 가장 잘 보여주는 핵심 컴포넌트" 라는 뜻으로 쓰겠다.

예를 들면 다음과 같다.

- `AStaticMeshActor`의 경우 `UStaticMeshComponent`
- `ASkeletalMeshActor`의 경우 `USkeletalMeshComponent`
- `ACameraActor`의 경우 `UCameraComponent`
- 어떤 트리거 Actor의 경우 `UBoxComponent`

이런 컴포넌트는 보통 그 Actor의 성격을 가장 직접적으로 드러낸다.\
그래서 에디터에서 보거나 코드를 읽을 때도 "이 Actor는 사실상 이 컴포넌트를 중심으로 동작하겠구나" 하고 이해하게 된다.

다만 대표 Component와 Root Component는 같은 경우도 있고, 다른 경우도 있다.

예를 들어

- 메쉬 컴포넌트가 곧 Root인 경우도 있고
- 빈 `USceneComponent`를 Root로 두고 메쉬 컴포넌트를 그 아래 붙이는 경우도 있다

즉 Root는 계층의 기준점이고,\
대표 Component는 그 Actor의 기능을 가장 잘 드러내는 핵심 컴포넌트라고 보면 된다.

### 5. Root에 딸리는 Component와 그렇지 않은 Component

이 부분은 `USceneComponent`인지 아닌지를 기준으로 나누면 깔끔하다.

### Root에 딸리는 Component

`USceneComponent` 계열 컴포넌트는 다른 Scene Component에 Attach될 수 있다.\
그래서 Root 아래로 트리 구조를 만들 수 있다.

예를 들면 다음과 같다.

- Root : `USceneComponent`
- Child : `UStaticMeshComponent`
- Child : `USpringArmComponent`
- GrandChild : `UCameraComponent`

이 경우 Root를 움직이면 그 아래에 붙은 Scene Component들도 함께 움직인다.\
즉 부모-자식 Transform 관계가 성립한다.

이런 구조는 총구 위치, 카메라 붐, 무기 장착 위치 같은 것을 만들 때 매우 자연스럽다.

#### Root에 딸리지 않는 Component

반면 `UActorComponent`는 Transform이 없으므로 Root에 Attach된다고 표현하지 않는다.

예를 들면 다음과 같다.

- `UHealthComponent`
- `UInventoryComponent`
- `UAbilitySystemComponent`
- 커스텀 로직 컴포넌트

이들은 Actor에 소속되지만, Scene 계층에는 들어가지 않는다.\
즉 Actor의 일부이기는 하지만 Root의 자식은 아니다.

정리하면 다음과 같다.

- `USceneComponent`
  - Root가 될 수 있음
  - 다른 Scene Component에 붙을 수 있음
  - Transform 계층에 참여함
- `UActorComponent`
  - Root가 될 수 없음
  - Attach 개념이 없음
  - Transform 계층에 참여하지 않음

### 6. 왜 굳이 이렇게 나눌까

이렇게 나누는 이유는 객체의 책임을 분리하기 위해서다.

- Actor
  - 월드에 놓이는 객체 단위
- Root Component
  - Transform의 기준점
- Scene Component
  - 위치를 가진 하위 구조
- Primitive Component
  - 렌더링/충돌처럼 씬과 직접 맞닿는 요소
- ActorComponent
  - 위치 없이 기능만 담당하는 요소

결국 언리얼의 Actor는 "하나의 오브젝트" 이면서도,\
내부적으로는 여러 컴포넌트를 조합해 만들어진 조립식 구조에 가깝다.

이 관점을 잡아두면

- 왜 어떤 컴포넌트는 Attach가 되고
- 왜 어떤 컴포넌트는 Root가 될 수 있고
- 왜 어떤 컴포넌트는 기능만 있고 위치는 없는지

같은 점들이 자연스럽게 이해된다.

### 7. 생성과 소멸: Actor의 라이프사이클 (Lifecycle)

Actor와 Component가 월드에 존재하기 위해서는 특정한 생명 주기를 따릅니다. 이를 이해하면 "언제 기능을 초기화해야 하는지" 명확해집니다.

SpawnActor: 월드(UWorld)에 Actor를 생성하는 함수입니다. 이때 Actor에 포함된 모든 Component도 함께 생성됩니다.

BeginPlay: Actor와 모든 Component가 준비되어 게임이 시작될 때 호출됩니다. 변수 초기화나 다른 객체와의 참조를 연결하기 가장 좋은 시점입니다.

Tick: 매 프레임마다 실행되는 로직입니다. Actor에도 Tick이 있고, 각 Component에도 Tick이 있습니다. 성능 최적화를 위해 필요 없는 경우 반드시 PrimaryActorTick.bCanEverTick = false로 꺼두는 것이 좋습니다.

EndPlay / Destroy: Actor가 제거될 때 호출됩니다. 이때 Actor가 소유한 모든 Component도 메모리에서 함께 해제(Garbage Collection)됩니다.