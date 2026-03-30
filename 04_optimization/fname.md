FName

- String 을 ID 로 Mapping 하여 관리
- String A, B 로 FName 변수를 만들면 최초의 A, B 각각에 대한 ID 를 찾아서 저장하고, 비교 시에 ID 비교만으로 서로 같은 string 인지 확인 가능
    - String A, B 비교 연산 O(min(length(A), length(B))
    - FName A, B 비교 연산 O(1)