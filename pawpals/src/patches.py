"""Small edits to the desktop source for the web build (each must match exactly once)."""
PATCHES = [
    # (web) family members are drawn through the cached picture too (unless holding a cat or a toy)
    ("house.py", """        else:
            H.draw_person(p, pr.P, pr.pose, pr.t, prop=prop, seat=pr.seat,
                          blink=now < pr.blink_until, view=view, talk=talk, held=held, rig=rig)""",
     """        elif held is None:
            self.cached_body(p, pr, QRectF(-95, -175, 190, 205), lambda qq: H.draw_person(
                qq, pr.P, pr.pose, pr.t, prop=prop, seat=pr.seat, blink=now < pr.blink_until, view=view, talk=talk,
                held=None, rig=rig), (pr.pose, view, prop, talk, now < pr.blink_until, pr.seat))
        else:
            H.draw_person(p, pr.P, pr.pose, pr.t, prop=prop, seat=pr.seat,
                          blink=now < pr.blink_until, view=view, talk=talk, held=held, rig=rig)"""),
    # 访客图鉴: grey silhouettes of the cats that have not come yet, without reading pixels back
    ("house_cats.py", """            img = pm.toImage()
            for yy in range(img.height()):
                for xx in range(img.width()):
                    c = img.pixelColor(xx, yy)
                    if c.alpha() > 0:
                        img.setPixelColor(xx, yy, QColor(120, 120, 130, c.alpha()))
            pm = QPixmap.fromImage(img)""", """            q_ = QPainter(pm)
            q_.setCompositionMode(QPainter.CompositionMode_SourceIn)
            q_.fillRect(QRectF(0, 0, pm.width(), pm.height()), QColor(120, 120, 130))
            q_.end()"""),
    # the toolbar's ⌂ button goes back to the game hall
    ("house.py", '"home": "⌂ 回桌面"', '"home": WEB_HOME_LABEL'),
]
PRELUDE = {
    # names the patched code uses
    "house.py": "WEB_HOME_LABEL = \"⌂ 游戏厅\"\n",
}
