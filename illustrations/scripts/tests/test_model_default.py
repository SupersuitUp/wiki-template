"""The door renders on the current image model.

A vendored copy of generate.py does not hear about a model upgrade, so every wiki forked
from this template kept rendering on gpt-image-2 after Freedom's create-image moved to
gpt-image-2.5 (found 2026-09-16). This pins the default so a stale copy is a red test.
Read by AST so the test needs no openai install.
"""
import ast, pathlib, unittest

SRC = pathlib.Path(__file__).resolve().parents[1] / "generate.py"


def model_default() -> str:
    tree = ast.parse(SRC.read_text())
    consts = {t.id: n.value.value for n in tree.body if isinstance(n, ast.Assign)
              for t in n.targets if isinstance(t, ast.Name) and isinstance(n.value, ast.Constant)}
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, "attr", "") == "add_argument" \
                and node.args and getattr(node.args[0], "value", None) == "--model":
            for kw in node.keywords:
                if kw.arg == "default":
                    return kw.value.value if isinstance(kw.value, ast.Constant) else consts[kw.value.id]
    raise AssertionError("no --model argument found")


class ModelDefault(unittest.TestCase):
    def test_default_is_gpt_image_2_5(self):
        self.assertTrue(model_default().startswith("gpt-image-2.5"), model_default())


if __name__ == "__main__":
    unittest.main()
