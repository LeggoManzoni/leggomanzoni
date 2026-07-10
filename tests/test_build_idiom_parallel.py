import pytest

from build_idiom_parallel import toknum


@pytest.mark.parametrize(
    "xid,expected",
    [
        ("intro_10736", 10736),
        ("c24_10102", 10102),
        ("c8_10005", 10005),
        # split-suffix ids: the token number is the SECOND field, not the last.
        # A regex anchored on trailing digits would return 1 and 2 here.
        ("intro_10736_1", 10736),
        ("c12_10345_2", 10345),
    ],
)
def test_toknum_ignores_split_suffix(xid, expected):
    assert toknum(xid) == expected


from build_idiom_parallel import load_edition


@pytest.fixture(scope="session")
def edition_1972():
    return load_edition("English_1972")


def test_load_edition_reads_all_39_chapters(edition_1972):
    segments, _translator, _date = edition_1972
    assert len(segments) == 39
    assert "intro" in segments and "cap38" in segments


def test_load_edition_extracts_translator_and_date(edition_1972):
    _segments, translator, date = edition_1972
    assert translator == "Bruce Penman"
    assert date == "1972"


def test_load_edition_segments_are_sorted_and_well_formed(edition_1972):
    segments, _t, _d = edition_1972
    cap8 = segments["cap8"]
    assert cap8 == sorted(cap8)
    start, end, note_id, text = cap8[0]
    assert start == 10001 and end == 10002
    assert note_id == "english_1972_cap8-n3"
    assert text == "‘Carneades!"


def test_load_edition_note_text_has_no_markup_and_is_stripped(edition_1972):
    segments, _t, _d = edition_1972
    for chapter_segments in segments.values():
        for _s, _e, _n, text in chapter_segments:
            assert "<" not in text
            assert text == text.strip()
