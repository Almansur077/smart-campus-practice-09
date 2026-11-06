"""Extract final text, tool calls and metadata from a claude stream-json log."""
import json, sys
src, dst = sys.argv[1], sys.argv[2]
out, final = [], None
for line in open(src):
    d = json.loads(line)
    if d.get("type") == "system" and d.get("subtype") == "init":
        out.append(f"<!-- session {d['session_id']} | model {d['model']} | tools {d['tools']} -->")
    if d.get("type") == "assistant":
        for c in d["message"]["content"]:
            if c["type"] == "tool_use":
                out.append(f"<!-- TOOL CALL: {c['name']} {json.dumps(c['input'])[:200]} -->")
    if d.get("type") == "result":
        final = d.get("result")
        out.append(f"<!-- result: {d.get('subtype')} | turns {d.get('num_turns')} | {d.get('duration_ms')} ms -->")
open(dst, "w").write("\n".join(out) + "\n\n" + (final or "") + "\n")
