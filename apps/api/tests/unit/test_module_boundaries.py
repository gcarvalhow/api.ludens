import ast
from pathlib import Path

import pytest

# N3 fitness functions for the modular monolith rule (README, "Monólito modular"):
# no module imports another module's internals; cross-module calls go through the
# public `app.modules.<module>.dependencies`. The N1 precedent of an `api/` router
# typing `Depends(get_current_user)` with identity's `User` stays allowed.

MODULES_ROOT = Path(__file__).resolve().parents[2] / "src" / "app" / "modules"
PUBLIC_ENTRYPOINT = "dependencies"
ROUTER_ALLOWED = {"app.modules.identity.domain.aggregates"}

def _imports(path: Path) -> list[str]:
    names = []
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.ImportFrom) and node.module:
            names.append(node.module)
        elif isinstance(node, ast.Import):
            names.extend(alias.name for alias in node.names)

    return names

def _module_of(path: Path) -> str:
    return path.relative_to(MODULES_ROOT).parts[0]

def _is_router(path: Path) -> bool:
    parts = path.relative_to(MODULES_ROOT).parts

    return parts[1] == "api" or parts[-1] == "router.py"

def _cross_module_imports():
    for path in sorted(MODULES_ROOT.rglob("*.py")):
        owner = _module_of(path)
        for name in _imports(path):
            parts = name.split(".")
            if parts[:2] == ["app", "modules"] and len(parts) > 2 and parts[2] != owner:
                yield path, owner, parts[2], name

def _violations(modules: set[str] | None = None) -> list[str]:
    found = []
    for path, owner, target, name in _cross_module_imports():
        if modules is not None and owner not in modules:
            continue
        if name == f"app.modules.{target}.{PUBLIC_ENTRYPOINT}":
            continue
        if name in ROUTER_ALLOWED and _is_router(path):
            continue
        found.append(f"{path.relative_to(MODULES_ROOT)} -> {name}")

    return found

def _dependency_graph() -> dict[str, set[str]]:
    graph: dict[str, set[str]] = {}
    for _, owner, target, _ in _cross_module_imports():
        graph.setdefault(owner, set()).add(target)

    return graph

def test_modules_from_n1_do_not_import_other_modules_internals():
    assert _violations({"identity", "catalog", "notification"}) == []

@pytest.mark.xfail(strict=True, reason="Débito N3: booking importa domain/aggregates de catalog e identity (ver relatório N3, DT-01).")
def test_booking_does_not_import_other_modules_internals():
    assert _violations({"booking"}) == []

@pytest.mark.xfail(strict=True, reason="Débito N3: dependência circular catalog <-> booking contornada com import tardio (ver relatório N3, DT-01).")
def test_module_dependency_graph_has_no_cycles():
    graph = _dependency_graph()
    cycles = sorted(f"{a} <-> {b}" for a, targets in graph.items() for b in targets if a < b and a in graph.get(b, set()))

    assert cycles == []
