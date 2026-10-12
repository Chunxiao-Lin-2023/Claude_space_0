"""Side-view (横版) stages: everybody stands in one lane, running left / right and jumping between platforms.

World x is left / right as usual; height is the agent's h (z); the depth y is a fixed lane, so the house draws the
characters as always. Platforms are one-way (jump up through them, ↓ + Space drops down); solids are boxes you
cannot walk through but can stand on; the ground can have gaps (falling below KILL_Z is a fall).
"""
import math

G = 1900.0
KILL_Z = -170.0

# stage geometry per arena: lane (depth), x limits, ground segments, one-way platforms (x0, x1, z), solids
STAGES = {
    # 竞技场: a ring in the middle of a stadium, two side ledges and a high one in the middle
    9: dict(lane=36, xmin=70, xmax=1190, ground=[(70, 1190)],
            plats=[(170, 400, 135), (860, 1090, 135), (505, 755, 245)], solids=[],
            spawns=[(330, 0), (260, 0), (930, 0), (1000, 0)]),
    # 道场: wooden lofts at three heights (冒险岛-style)
    13: dict(lane=36, xmin=50, xmax=1210, ground=[(50, 1210)],
             plats=[(90, 330, 115), (930, 1170, 115), (455, 805, 170), (205, 425, 250), (835, 1055, 250)], solids=[],
             spawns=[(300, 0), (200, 115), (960, 0), (1060, 115)]),
}


def body(char):
    """(width, height) of a fighter in the side view."""
    return {"calico": (34, 50), "tabby": (40, 52), "dad": (30, 96), "mom": (28, 90), "kid": (24, 74)}.get(char, (30, 80))


class Stage:
    def __init__(self, d):
        self.d = d
        self.lane = d["lane"]
        self.xmin, self.xmax = d["xmin"], d["xmax"]
        self.ground = list(d.get("ground", []))
        self.plats = list(d.get("plats", []))
        self.solids = list(d.get("solids", []))

    def surfaces(self):
        """Every top you can stand on: (x0, x1, z, oneway)."""
        out = [(x0, x1, 0.0, False) for x0, x1 in self.ground]
        out += [(x0, x1, float(z), True) for x0, x1, z in self.plats]
        out += [(x0, x1, float(z1), False) for x0, x1, z0, z1 in self.solids]
        return out

    def ground_at(self, x, hw=0.0):
        return any(x0 - hw * 0.4 <= x <= x1 + hw * 0.4 for x0, x1 in self.ground)

    def support(self, x, z, hw, drop=False):
        """The top a body standing at (x, z) rests on, or None."""
        best = None
        for x0, x1, top, oneway in self.surfaces():
            if oneway and drop:
                continue
            if x0 - hw * 0.4 <= x <= x1 + hw * 0.4 and abs(z - top) < 2.0:
                if best is None or top > best:
                    best = top
        return best

    def on_oneway(self, x, z, hw):
        for x0, x1, top in self.plats:
            if x0 - hw * 0.4 <= x <= x1 + hw * 0.4 and abs(z - top) < 2.0:
                return True
        return False

    def move(self, m, dt, hw, hgt, drop=False, fly=False):
        """Move a body m (attributes x, z, vx, vz, ground) by its velocity with gravity and collisions.
        Returns "wall" when it ran into something sideways."""
        hit = None
        # sideways
        nx = m.x + m.vx * dt
        for x0, x1, z0, z1 in self.solids:
            if m.z < z1 - 1 and m.z + hgt > z0 + 1 and nx + hw > x0 and nx - hw < x1:
                if m.x <= x0:
                    nx = x0 - hw
                elif m.x >= x1:
                    nx = x1 + hw
                hit = "wall"
        if nx < self.xmin + hw:
            nx, hit = self.xmin + hw, "wall"
        elif nx > self.xmax - hw:
            nx, hit = self.xmax - hw, "wall"
        m.x = nx
        # up / down
        if not fly:
            if not m.ground or m.vz > 0:
                m.vz = max(-1100.0, m.vz - G * dt)
            else:
                # standing: still something under the feet?
                if self.support(m.x, m.z, hw, drop) is None:
                    m.ground = False
                    m.vz = -20.0
        nz = m.z + m.vz * dt
        if m.vz <= 0 and not fly:
            land = None
            for x0, x1, top, oneway in self.surfaces():
                if oneway and drop:
                    continue
                if x0 - hw * 0.4 <= m.x <= x1 + hw * 0.4 and m.z >= top - 1.0 and nz <= top:
                    if land is None or top > land:
                        land = top
            if land is not None:
                nz = land
                if not m.ground:
                    hit = hit or "land"
                m.ground = True
                m.vz = 0.0
            else:
                m.ground = False
        elif m.vz > 0:
            m.ground = False
            for x0, x1, z0, z1 in self.solids:
                if m.x + hw > x0 and m.x - hw < x1 and m.z + hgt <= z0 + 1 and nz + hgt > z0:
                    nz = z0 - hgt
                    m.vz = 0.0
        m.z = nz
        return hit


def boxes_overlap(a, b):
    return a[0] < b[1] and b[0] < a[1] and a[2] < b[3] and b[2] < a[3]


def sign(v):
    return 1 if v > 0 else (-1 if v < 0 else 0)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])
