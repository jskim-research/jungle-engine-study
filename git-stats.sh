#!/bin/bash
if [ ! -d .git ]; then
    echo "오류: 현재 디렉토리는 Git 저장소가 아닙니다."
    exit 1
fi

echo "데이터 분석 중... (저장소 크기에 따라 시간이 걸릴 수 있습니다)"
echo "----------------------------------------------------------------"

TEMP_DATA=$(mktemp)

git log --format='%aN' | sort -u | while read -r name; do
    stats=$(git log --author="$name" --pretty=tformat: --numstat 2>/dev/null | \
            awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "%d|%d|%d", add, subs, loc }')
    
    IFS='|' read -r added subs total <<< "$stats"
    added=${added:-0}
    subs=${subs:-0}
    total=${total:-0}
    
    echo "$total|$added|$subs|$name" >> "$TEMP_DATA"
done

SORTED_DATA=$(sort -rn -t'|' -k1 "$TEMP_DATA")
MAX_VAL=$(echo "$SORTED_DATA" | head -n1 | cut -d'|' -f1)

if [ -z "$MAX_VAL" ] || [ "$MAX_VAL" -le 0 ]; then
    echo "표시할 데이터가 없습니다."
    rm "$TEMP_DATA"
    exit 0
fi

printf "%-20s | %-30s | %s\n" "사용자 이름" "기여도 그래프 (Total Lines)" "통계(Add/Sub/Total)"
echo "------------------------------------------------------------------------------------------"

while IFS='|' read -r total added subs name; do
    # 그래프 막대 길이 계산 (최대 30칸)
    if [ "$MAX_VAL" -gt 0 ]; then
        bar_len=$(( total * 30 / MAX_VAL ))
    else
        bar_len=0
    fi
    
    bar=$(printf "%${bar_len}s" | tr ' ' '-')
    
    # 결과 출력 (이름 20자 제한, 그래프, 상세 수치)
    printf "%-20.20s | %-30s | (+%d, -%d, Σ %d)\n" "$name" "$bar" "$added" "$subs" "$total"
done <<< "$SORTED_DATA"

# 임시 파일 삭제
rm "$TEMP_DATA"
