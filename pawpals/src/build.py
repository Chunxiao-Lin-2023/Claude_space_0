"""Build 猫猫咕咕的家 (PawPals web).

    python3 build.py                  -> ../index.html (the game hall page) and artifact.html (claude.ai artifact)
    python3 build.py --local DIR      -> DIR/index.html with Pyodide / PeerJS served from DIR (tests; needs
                                         PAWPALS_NODE_MODULES pointing at node_modules with pyodide + peerjs)

The page runs the desktop app's own Python code (desktopcats/, a copy of the desktop package's house modules)
in Pyodide, through a small stand-in for PySide6 (py/PySide6) that turns QPainter calls into canvas commands.
Small web-only edits to the desktop code live in patches.py. Sounds: make_sounds.py -> sound_data.js."""
import base64
import io
import os
import re
import shutil
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PYODIDE_VER = "0.29.4"
PEERJS_VER = "1.5.5"
CDN = "https://cdn.jsdelivr.net/npm/pyodide@%s/" % PYODIDE_VER
PEER_CDN = "https://cdn.jsdelivr.net/npm/peerjs@%s/dist/peerjs.min.js" % PEERJS_VER
DESKTOP = os.environ.get("PAWPALS_DESKTOP", HERE)          # the folder holding desktopcats/
SKIP = {"host.py", "system.py", "ui.py", "app.py", "cat.py", "toys.py", "desk_link.py", "desk_visit.py", "hide_timer.py",
        "work_mode.py", "house_upnp.py"}


def bundle():
    sys.path.insert(0, HERE)
    from patches import PATCHES, PRELUDE
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        root = os.path.join(HERE, "py")
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if d != "__pycache__"]
            for f in sorted(fn):
                if f.endswith(".py"):
                    full = os.path.join(dp, f)
                    z.write(full, os.path.relpath(full, root))
        pkg = os.path.join(DESKTOP, "desktopcats")
        by_file = {}
        for f, old, new in PATCHES:
            by_file.setdefault(f, []).append((old, new))
        for f in sorted(os.listdir(pkg)):
            if f.endswith(".py") and f not in SKIP:
                src = open(os.path.join(pkg, f), encoding="utf-8").read()
                for old, new in by_file.get(f, []):
                    n = src.count(old)
                    assert n == 1, "patch for %s matches %d times: %r" % (f, n, old[:60])
                    src = src.replace(old, new)
                if f in PRELUDE:
                    i = src.index("\nimport ")
                    src = src[:i + 1] + PRELUDE[f] + src[i + 1:]
                z.writestr("desktopcats/" + f, src)
    data = buf.getvalue()
    out = os.path.join(HERE, "build_py")                # the same files unpacked (tests under CPython / Node)
    shutil.rmtree(out, ignore_errors=True)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        z.extractall(out)
    return data


def version():
    src = open(os.path.join(DESKTOP, "desktopcats", "config.py"), encoding="utf-8").read()
    return re.search(r'VERSION = "([^"]+)"', src).group(1)


def page(pyodide_url, peer_url):
    src = open(os.path.join(HERE, "index.src.html"), encoding="utf-8").read()
    z = bundle()
    p = (src.replace("__PY_BUNDLE__", base64.b64encode(z).decode())
            .replace("__PYODIDE_URL__", pyodide_url)
            .replace("__VERSION__", version()))
    for extra in ("sound_data.js", "sound.js"):
        p = p.replace("<!--%s-->" % extra, "<script>\n" + open(os.path.join(HERE, extra), encoding="utf-8").read()
                      + "\n</script>")
    std = p.replace("<!--PEERJS-->", '<script src="%s"></script>' % peer_url).replace(
        "<!--DOCTYPE-->", "<!doctype html>").replace(
        "<!--IOSMETA-->", '<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
        '<meta name="apple-mobile-web-app-title" content="猫猫咕咕">\n<meta name="theme-color" content="#f6ede2">')
    art = p.replace("<!--PEERJS-->", "").replace("<!--DOCTYPE-->", "").replace("<!--IOSMETA-->", "")
    return std, art, len(z)


def main():
    if "--local" in sys.argv:
        out = sys.argv[sys.argv.index("--local") + 1]
        os.makedirs(out, exist_ok=True)
        std, _, zn = page("pyodide/", "peerjs/peerjs.min.js")
        open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(std)
        nm = os.environ.get("PAWPALS_NODE_MODULES", "/tmp/claude-0/web/node_modules")
        for name, sub in (("pyodide", "pyodide"), ("peerjs", "peerjs/dist")):
            dst = os.path.join(out, name)
            if not os.path.exists(dst):
                shutil.copytree(os.path.join(nm, sub), dst)
    else:
        std, art, zn = page(CDN, PEER_CDN)
        open(os.path.join(HERE, "..", "index.html"), "w", encoding="utf-8").write(std)
        open(os.path.join(HERE, "artifact.html"), "w", encoding="utf-8").write(art)
    print("python bundle %d KB, page %d KB" % (zn // 1024, len(std.encode()) // 1024))


if __name__ == "__main__":
    main()
