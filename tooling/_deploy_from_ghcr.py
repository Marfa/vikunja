#!/usr/bin/env python3
"""Pull a prebuilt Vikunja image from GHCR and restart the VPS stack.

Never builds on the VPS. Expects:
  /opt/vikunja/docker-compose.yml   — only the `image:` line is rewritten
  /opt/vikunja/frontend-dist/       — replaced when --frontend-tar is set

Usage (on the VPS):
  python3 tooling/_deploy_from_ghcr.py
  python3 tooling/_deploy_from_ghcr.py --image ghcr.io/marfa/vikunja:sha-abc1234
  python3 tooling/_deploy_from_ghcr.py --frontend-tar /tmp/frontend-dist.tar.gz

Env overrides:
  VIKUNJA_DIR, VIKUNJA_IMAGE, COMPOSE_FILE
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_DIR = Path(os.environ.get("VIKUNJA_DIR", "/opt/vikunja"))
DEFAULT_IMAGE = os.environ.get("VIKUNJA_IMAGE", "ghcr.io/marfa/vikunja:instance-latest")
IMAGE_LINE = re.compile(r"^(\s*image:\s*).+$", re.MULTILINE)


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def rewrite_compose_image(compose: Path, image: str) -> None:
    text = compose.read_text(encoding="utf-8")
    if not IMAGE_LINE.search(text):
        raise SystemExit(f"no image: line in {compose}")
    updated = IMAGE_LINE.sub(rf"\g<1>{image}", text, count=1)
    if updated == text:
        print(f"compose already uses {image}")
        return
    backup = compose.with_suffix(compose.suffix + f".bak.{os.getpid()}")
    shutil.copy2(compose, backup)
    compose.write_text(updated, encoding="utf-8")
    print(f"updated {compose} → {image} (backup {backup.name})")


def deploy_frontend(tar_path: Path, dest: Path) -> None:
    if not tar_path.is_file():
        raise SystemExit(f"frontend tar not found: {tar_path}")
    with tempfile.TemporaryDirectory(prefix="vikunja-fe-") as tmp:
        tmp_path = Path(tmp)
        run(["tar", "-xzf", str(tar_path), "-C", str(tmp_path)])
        # Accept either frontend-dist/ at root or a single top-level dir.
        candidates = [tmp_path / "frontend-dist"]
        children = [p for p in tmp_path.iterdir() if p.is_dir()]
        if len(children) == 1:
            candidates.append(children[0])
        src = next((c for c in candidates if c.is_dir() and (c / "index.html").exists()), None)
        if src is None:
            raise SystemExit("frontend tar has no index.html under frontend-dist/")
        staging = dest.with_name(dest.name + ".new")
        if staging.exists():
            shutil.rmtree(staging)
        shutil.copytree(src, staging)
        old = dest.with_name(dest.name + ".old")
        if old.exists():
            shutil.rmtree(old)
        if dest.exists():
            dest.rename(old)
        staging.rename(dest)
        if old.exists():
            shutil.rmtree(old)
        print(f"frontend deployed to {dest}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR)
    parser.add_argument("--image", default=DEFAULT_IMAGE)
    parser.add_argument("--compose", type=Path, default=None)
    parser.add_argument("--frontend-tar", type=Path, default=None)
    parser.add_argument("--skip-pull", action="store_true")
    args = parser.parse_args()

    vikunja_dir: Path = args.dir
    compose: Path = args.compose or Path(
        os.environ.get("COMPOSE_FILE", str(vikunja_dir / "docker-compose.yml"))
    )
    if not compose.is_file():
        raise SystemExit(f"compose file missing: {compose}")

    if not args.skip_pull:
        token = os.environ.get("GHCR_TOKEN") or os.environ.get("GITHUB_TOKEN")
        user = os.environ.get("GHCR_USER") or os.environ.get("GITHUB_ACTOR") or "x"
        if token:
            login = subprocess.run(
                ["docker", "login", "ghcr.io", "-u", user, "--password-stdin"],
                input=token.encode(),
                check=False,
            )
            if login.returncode != 0:
                print("warning: docker login ghcr.io failed; trying anonymous pull", flush=True)
        run(["docker", "pull", args.image])

    rewrite_compose_image(compose, args.image)
    run(["docker", "compose", "-f", str(compose), "up", "-d", "--force-recreate", "--remove-orphans"], cwd=vikunja_dir)

    if args.frontend_tar is not None:
        deploy_frontend(args.frontend_tar, vikunja_dir / "frontend-dist")

    run(["docker", "compose", "-f", str(compose), "ps"], cwd=vikunja_dir)
    print("deploy ok (no build on VPS)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
