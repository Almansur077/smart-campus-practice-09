#!/bin/sh
# Mutation check: break one rule at a time in src/domain/availability.ts,
# run the full suite, record how many tests fail, then restore the file.
F=src/domain/availability.ts
run() {
  id="$1"; desc="$2"; from="$3"; to="$4"
  cp "$F" /tmp/_avail_backup.ts
  python3 -I -c "import sys;p=sys.argv[1];s=open(p).read();a,b=sys.argv[2],sys.argv[3];assert a in s,a;open(p,'w').write(s.replace(a,b,1))" "$F" "$from" "$to"
  out=$(npx vitest run 2>&1)
  failed=$(printf '%s\n' "$out" | grep -E '^ +Tests ' | sed 's/^ *//')
  names=$(printf '%s\n' "$out" | grep -E '^ +(×|FAIL)' | grep -oE '(U|D|R|F|X)[0-9]{2}' | sort -u | tr '\n' ' ')
  echo "$id | $desc | $failed | caught by: $names"
  cp /tmp/_avail_backup.ts "$F"
}
run M1 "AC4 touching endpoints treated as overlap (< -> <=)" "return start < booking.end && end > booking.start" "return start <= booking.end && end >= booking.start"
run M2 "AC2 exactly 120 min rejected (> -> >=)" "if (duration > MAX_MINUTES)" "if (duration >= MAX_MINUTES)"
run M3 "AC3 blocked check removed" "if (room.blocked) {" "if (false) {"
run M4 "AC1 start == now accepted (<= -> <)" "if (start <= room.now)" "if (start < room.now)"
run M5 "AC1 zero-length accepted (>= -> >)" "if (start >= end) {" "if (start > end) {"
run M6 "AC5 rule mutates bookings (push before success)" "  return { available: true, message: 'Room B-204 is available for this time.' };" "  room.bookings.push({ start, end });
  return { available: true, message: 'Room B-204 is available for this time.' };"
echo "--- restored file check:"; git diff --stat -- "$F"; npx vitest run 2>&1 | grep -E '^ +Tests '
