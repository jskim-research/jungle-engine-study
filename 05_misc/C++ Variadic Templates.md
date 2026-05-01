# C++ Variadic Templates

&nbsp;C에서는 `<stdarg.h>`와 파라미터 팩(`...`)을 이용하여 가변 길이 인자를 사용할 수 있었다. C++에서도 C-Style을 동일하게 사용할 수 있으나, C++ 11 이후로는 **가변 길이 템플릿과 파라미터 팩을 이용하여 타입에 더 강한 가변 길이 인자를 구현할 수 있다**. 가변 길이 템플릿은 아래와 같이 사용한다.

```C++
template <typename T>
void print(T arg)
{
        std::cout << arg << std::endl;
}

template <typename T, typename... Types>
void print(T arg, Types... args)
{
        std::cout << arg << std::endl;

        print(args);
}
```
<br>

&nbsp;**가변 길이 템플릿은 일반적으로 위 코드의 하나의 인자를 가진 `print`처럼 베이스 케이스 함수와 함께 사용한다**. 파라미터 팩이 없는 함수가 더 우선 순위가 높기 때문에 오버로드된다. 또한 C++은 현재 위치의 앞에 있는 내용만 정의되기 때문에 **베이스 템플릿 함수는 가변 길이 템플릿 함수보다 앞서 정의되어야 한다**. 아래에서 볼 Fold 표현을 이용하여 더 간단하게 구현할 수도 있다.


## Fold Expressions

&nbsp;가변 길이 템플릿은 일반적으로 재귀적인 형태로 이용하는데, C++ 17 이후로는 **Fold 표현을 이용하여 더 간단하게 구현할 수 있다**. Fold 표현은 아래와 같이 사용한다. **Fold 표현은 반드시 `()` 안에서 사용해야 한다**.

```C++
template <typename... Types>
int sum(Types... arg)
{
        return (arg + ...);
}
```

&nbsp;위 코드는 입력이 `a, b, c`일 때 `((a + b) + c)`와 같이 동작한다. 파라미터 팩의 위치에 따라 연산되는 순서가 다르다. 가능한 형태는 다음과 같다.

- 단항 좌측: `... op E` => `(((e[1] op e[2]) op e[3]) op ...)`

- 단항 우측: `E op ...` => `(... op (e[n - 2] op (e[n - 1] op e[n])))`

- 이항 좌측: `I op ... op E` => `(((I op e[1]) op e[2]) op ...)`

- 이항 우측: `E op ... op I` => `(... op (e[n - 1] op (e[n] op I)))`


&nbsp;`,`를 통해 각 인자에 대한 작업을 각각 수행할 수도 있다. 아래와 같이 사용한다.

```C++
template <typename... Types>
void func(Types... arg)
{
        (new_func(arg), ...);
}
```

&nbsp;위와 같은 코드는 범위 기반 for-loop처럼 모든 인자에 대해 `new_func`를 수행한다.
