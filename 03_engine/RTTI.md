## RTTI (Run-Time Type Identification)

RTTI 는 런타임에 객체의 실제 타입 정보를 확인할 수 있는 기능이다.\
이를 위해 타입 정보는 런타임에 접근 가능한 형태로 저장된다.\
이 글에서는 이러한 런타임에 접근 가능한 타입 관련 정보를 Run-Time Meta Data 라고 칭하겠다.

## Run-Time Meta Data

우리에게 익숙한 형태의 **런타임 클래스 메타 데이터**는 다음과 같다.

```cpp
class ENGINE_API UClass
{
public:
    ...
	UClass(FString InName, UClass* InSuperClass, CreateFunc InCreateFunc);
	
	const FString& GetName() const;
	UClass* GetSuperClass() const;

	bool IsChildOf(const UClass* Other) const;
    ...
private:
	FString Name;
	UClass* SuperClass = nullptr;
    ...
};
```

**런타임에 위와 같은 메타 데이터를 기록하기에** SuperClass 를 기반으로 한 IsA 등의 RTTI 기능을 제공할 수 있다.

메타 데이터는 단순히 **클래스에 국한되지 않는다.**\
클래스 멤버 함수에 대해서도 다음과 같이 메타 데이터를 정의할 수 있다.

```cpp
class ENGINE_API UFunction
{
public:
    ...
    const FString& GetName() const;
    int32 GetParamsSize() const;
    ...
    
private:
    FString Name;
    UClass* OwnerClass;
    ...
};
```

## UE Run-Time Meta Data

언리얼에선 UClass, UFunction, FProperty, UStruct, UEnum 등의 다양한 런타임 메타데이터를 관리한다. \
그런데 왜 타입을 식별하는 RTTI 를 넘어서 이렇게 많은 메타데이터를 관리하는 걸까?

모 코치님의 의견을 빌리면 그 답의 일부는 블루프린트에 있다.\
C++ 과 블루프린트는 서로 다른 컴파일 시스템이기에 컴파일 타임에 서로의 정보를 알 수 없다.\
그럼에도 블루프린트에서 C++ 의 함수를 호출할 수 있는 이유는 UFunction 이라는 런타임 메타데이터를 통해 함수 정보를 찾고, 이를 기반으로 런타임에 함수를 호출할 수 있기 때문이다.

이외에도 메타데이터는 객체 생성, 직렬화, 가비지 컬렉션, 네트워크 동기화 등 엔진이 객체를 일반화하여 관리하는 데 필요한 다양한 정보를 포함하고 있다. 

필요한 경우 향후 추가로 작성하도록 하겠다.
