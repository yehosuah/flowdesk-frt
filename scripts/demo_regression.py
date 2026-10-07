"""Introduce or correct a controlled discount regression on a work branch."""
import argparse
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("action", choices=["apply", "restore"])
action = parser.parse_args().action
root = Path(__file__).resolve().parents[1]
branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=root, text=True).strip()
if action == "apply" and (not branch or branch in {"main", "master"}):
    raise SystemExit("Use a work branch to introduce the demonstration regression.")
path = root / "src/app/components/TaxBreakdown.vue"
correct = "props.subtotal - props.descuento + impuesto.value"
broken = "props.subtotal + props.descuento + impuesto.value"
source, target = (correct, broken) if action == "apply" else (broken, correct)
content = path.read_text()
if content.count(source) != 1:
    raise SystemExit("Expected expression not found exactly once; no file was changed.")
path.write_text(content.replace(source, target))
print(f"{action}: {path.relative_to(root)}")
print("Run npm run test:regression:ci. Commit and push to demonstrate the result in CI.")
