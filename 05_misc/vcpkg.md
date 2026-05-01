# vcpkg

&nbsp;Python의 `pip`, Node.js의 `npm`, Rust의 `cargo` 등 최근 좀 잘나간다는 언어들은 언어 자체에 패키지 매니저를 포함하고 있지만, 할아버지 언어인 C++에는 언어 자체에 포함된 패키지 매니저가 없어서 라이브러리를 따로 설치하거나 CMake의 `FetchContent` 모듈을 사용하거나 해야한다.


&nbsp;이를 위해 C++ 생태계에 많은 영향을 주고 있는 Microsoft에서 사내에 사용하던 패키지 매니저를 MIT 라이선스로 공개했는데, 그것이 바로 [vcpkg](https://vcpkg.io/en/)다. 정확한 약자를 소개하지는 않지만 Microsoft에서 공개한 물건인 만큼 Visual C/C++ Package의 약자로 생각된다. **vcpkg는 크로스 플랫폼을 지원하는 오픈 소스 C/C++ 패키지 매니저**다. 단일로 사용도 가능하고, MSBuild 및 CMake와도 매끄럽게 연동된다.


&nbsp;Microsoft 소유인 GitHub에 꽤 의존적으로 동작하며, [vcpkg 설치 및 업데이트](https://github.com/microsoft/vcpkg) 또한 `git clone`과 `git pull`을 통해 이루어진다.


## Installing & Using Packages

&nbsp;설치하고자 하는 패키지를 vcpkg에서 설치할 수 있는지 확인하려면 터미널에 `vcpkg search <패키지 이름>`을 입력한다. 검색 전 `vcpkg update`를 통해 패키지 정보를 업데이트하는 것이 좋다.


&nbsp;라이브러리를 설치하는 방법에는 클래식 모드와 매니페스트 모드가 있다.


### Classic Mode

&nbsp;클래식 모드는 시스템 상 모든 프로젝트에서 이용 가능하도록 전역으로 설치하는 방법이다. 간단하게 터미널을 통해 설치한다.

```Shell
vcpkg install <패키지 이름>[:<Triplet>]
```

&nbsp;`<Triplet>`은 실행 환경을 추가로 넘겨주는 옵션이다. 명시하지 않으면 기본적으로 `x86-windows`로 지정된다. 64비트로 설치하고자 하면 `x64-windows`를 사용하면 되는데, 만약 이 값을 디폴트로 설정하고자 하면 환경 변수 `VCPKG_DEFAULT_TRIPLET`를 추가하여 값을 `x64-windows`로 설정한다. 그 외 가능한 값은 `x64-linux`, `arm64-osx` 등 명령어 세트와 운영 체제 종류에 따라 선택하면 된다. 예를 들어 Boost C++ Libraries의 핵심 라이브러리들은 `vcpkg install boost:x64-windows`로 설치한다.


&nbsp;패키지는 vcpkg 설치 디렉토리 밑 `installed/<Triplet>/` 아래에 설치된다. 따로 빌드 시스템을 사용하지 않는다면 그냥 컴파일 시 해당 폴더를 포함(`-L`, `-I`)하도록 넘겨주면 된다. 패키지를 업데이트 할 때는 `vcpkg upgrade`를 사용한다.


&nbsp;쉬운 방법이기는 하지만 **프로젝트 별로 의존성을 관리할 수 없기 때문에 vcpkg 공식 문서에서도 매니페스트 모드 사용을 권장**한다.


### Manifest Mode

&nbsp;매니페스트 모드는 **프로젝트의 의존성을 `vcpkg.json` 파일에 명시**하여 빌드할 때 패키지가 프로젝트의 디렉토리에 설치되도록 한다. `vcpkg.json` 파일은 아래와 같은 형식을 가진다.

```JSON
{
        "name": "test",
        "version": "1.0.0",
        "dependencies": [
                "fmt",
                "boost",
                {
                        "name": "zlib",
                        "version>=": "1.3.1",
                        "build": "static"
                }
        ]
}
```

&nbsp;기본적으로 프로젝트의 이름(`name`)과 버전(`version`)이 포함되어야 하고, `dependencies` 아래에 필요한 패키지 이름들을 명시하면 된다. 패키지를 명시할 때는 옵션들을 추가할 수 있는데, 패키지의 버전(`version`)에는 `>=`, `<=`, `==`등의 옵션을 사용할 수 있으며, 빌드 방식(`build`)에는 `static`과 `shared` 중 원하는 것을 선택할 수 있다. 디폴트는 `shared`로 보인다. 또한 `triplet`도 지정할 수 있다.


### Integrate with Build Systems

#### MSBuild

&nbsp;Microsoft에서 시작한 프로젝트인 만큼, Visual Studio와는 매우 쉽게 통합된다. 단순히 터미널에 `vcpkg integrate install`만 입력하여 MSBuild와 연동할 수 있다. MSBuild 기반 프로젝트에서는 따로 설정해주지 않아도 자동으로 헤더를 포함하여 라이브러리를 사용할 수 있으며, 툴체인 파일도 따로 명시하지 않아도 된다.


#### CMake

&nbsp;CMake 기반 프로젝트에서 사용하는 것도 매우 간단하다. 프로젝트 단위 `CMakeLists.txt` 파일을 `vcpkg.json` 파일과 같은 위치에 두고, 로컬에 설치된 라이브러리를 사용하듯이 `find_package`를 사용하면 된다.

```Text
find_package(ZLIB REQUIRED)
target_link_libraries(my_lib PRIVATE ZLIB::ZLIB)
```
<br>

&nbsp;대신 CMake를 실행할 때 `CMAKE_TOOLCHAIN_FILE`을 추가로 명시해 주어야한다(`CMakeLists.txt`에 변수로 추가해두어도 되지만 권장하지는 않는다).

```Shell
cmake -DCMAKE_TOOLCHAIN_FILE=<vcpkg 설치 주소>/scripts/buildsystems/vcpkg.cmake
```
