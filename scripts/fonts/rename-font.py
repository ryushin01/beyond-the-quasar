#!/usr/bin/env python3
"""OFL 예약 글꼴 이름(Reserved Font Name)이 있는 글꼴을 줄였을 때 글꼴 안의 이름을 바꿉니다.

SIL OFL 1.1은 고친 글꼴(글자를 줄인 파일 포함)에 예약 이름을 쓰지 못하게 하므로,
build-fonts.mjs가 config.json에서 `rename: true`인 글꼴의 결과 파일마다 이 스크립트를 부릅니다.
저작권(0)·라이선스(13·14)·굵기(2)·버전(5)·제작자(8·9·11·12) 정보는 그대로 둡니다.

사용: python3 scripts/fonts/rename-font.py "<새 글꼴 이름>" <woff2 파일...>
필요: pip install fonttools brotli (build-fonts.mjs는 FONT_PYTHON 환경 변수로 다른 파이썬을 쓸 수 있음)
"""
import re
import sys

from fontTools.ttLib import TTFont

# 예약 이름이 들어가는 이름표: 글꼴 이름, 고유 ID, 전체 이름, PostScript 이름, 상표, 타이포그래피·WWS 이름
RENAMED_IDS = (1, 3, 4, 6, 7, 16, 17, 18, 21, 22)
WINDOWS = dict(platformID=3, platEncID=1, langID=0x409)


def rename(path: str, family: str) -> None:
    font = TTFont(path)
    names = font["name"]
    style = names.getDebugName(2) or "Regular"
    ps_family = re.sub(r"[^A-Za-z0-9]", "", family)
    ps_style = re.sub(r"[^A-Za-z0-9]", "", style)
    for name_id in RENAMED_IDS:
        names.removeNames(nameID=name_id)
    full = family if style == "Regular" else f"{family} {style}"
    names.setName(family, 1, **WINDOWS)
    names.setName(f"{ps_family}-{ps_style}", 3, **WINDOWS)
    names.setName(full, 4, **WINDOWS)
    names.setName(f"{ps_family}-{ps_style}", 6, **WINDOWS)
    names.setName("Subset of an SIL OFL 1.1 font, renamed because the original has a Reserved Font Name.", 10, **WINDOWS)
    # CFF 글꼴은 글꼴 안에도 PostScript 이름이 있습니다.
    if "CFF " in font:
        cff = font["CFF "].cff
        cff.fontNames = [f"{ps_family}-{ps_style}"]
        top = cff.topDictIndex[0]
        for key in ("FullName", "FamilyName"):
            if hasattr(top, key):
                setattr(top, key, full if key == "FullName" else family)
    font.save(path)


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit('사용: rename-font.py "<새 글꼴 이름>" <파일...>')
    family, files = sys.argv[1], sys.argv[2:]
    for path in files:
        rename(path, family)
    print(f"{len(files)}개 파일의 글꼴 이름을 '{family}'(으)로 바꿨습니다.")


if __name__ == "__main__":
    main()
