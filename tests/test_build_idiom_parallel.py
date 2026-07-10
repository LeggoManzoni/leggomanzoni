import collections
import os

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


from build_idiom_parallel import find_segments, merge_segments

SEGS = [
    (10, 19, "n1", "First segment."),
    (20, 29, "n2", "Second segment."),
    (30, 39, "n3", "Third segment."),
]


def test_find_segments_returns_single_covering_segment():
    assert find_segments(SEGS, 22, 25) == [SEGS[1]]


def test_find_segments_flush_against_boundary_is_still_contained():
    # 925 real rows sit flush on a boundary; touching must not count as crossing.
    assert find_segments(SEGS, 20, 29) == [SEGS[1]]
    assert find_segments(SEGS, 29, 29) == [SEGS[1]]


def test_find_segments_returns_both_when_span_crosses_boundary():
    assert find_segments(SEGS, 19, 20) == [SEGS[0], SEGS[1]]


def test_find_segments_returns_empty_on_alignment_hole():
    assert find_segments(SEGS, 40, 45) == []


def test_merge_segments_single():
    assert merge_segments([SEGS[1]]) == ("Second segment.", "n2", "ok")


def test_merge_segments_straddle_joins_in_document_order():
    text, note_id, status = merge_segments([SEGS[1], SEGS[0]])
    assert text == "First segment. Second segment."
    assert note_id == "n1+n2"
    assert status == "straddle"


def test_merge_segments_empty():
    assert merge_segments([]) == ("", "", "no_segment")


from build_idiom_parallel import COLUMNS, EXPECTED_STATUS, build_rows


@pytest.fixture(scope="session")
def rows():
    return build_rows()


def test_row_count_is_900_idioms_times_3_editions(rows):
    assert len(rows) == 2700


def test_every_row_has_exactly_the_declared_columns(rows):
    for row in rows:
        assert list(row.keys()) == COLUMNS


def test_match_status_counts_match_the_spec(rows):
    counts = collections.Counter(r["match_status"] for r in rows)
    assert dict(counts) == EXPECTED_STATUS
    assert EXPECTED_STATUS == {"ok": 2697, "straddle": 2, "no_segment": 1}


def test_rows_sorted_by_chapter_then_position_then_idiom_then_edition(rows):
    from build_idiom_parallel import CHAPTER_ORDER

    order = {c: i for i, c in enumerate(CHAPTER_ORDER)}
    keys = [(order[r["chapter"]], toknum(r["start_id"]), r["idiom_id"], r["edition"]) for r in rows]
    assert keys == sorted(keys)


def test_the_three_renderings_of_an_idiom_are_adjacent(rows):
    # Regression: sorting without an idiom_id tiebreaker interleaves the two idioms
    # that share start token c2_11145 ("Dico per dire" / "dico per dire").
    for i in range(0, len(rows), 3):
        triple = rows[i:i + 3]
        assert len({r["idiom_id"] for r in triple}) == 1
        assert [r["edition"] for r in triple] == ["1845", "1972", "2022"]


def test_duplicate_and_nested_idiom_spans_are_carried_through_not_deduped(rows):
    # Four Excel duplicates + one genuine nesting. Deduping is the linguists' call.
    ids = {r["idiom_id"] for r in rows}
    for pair in [(2495, 2501), (2688, 2690), (10775, 10776), (642, 644), (9805, 9808)]:
        assert set(pair) <= ids

    dico = sorted(r["label"] for r in rows if r["idiom_id"] in (642, 644) and r["edition"] == "1845")
    assert dico == ["Dico per dire", "dico per dire"]

    nested = {r["idiom_id"]: (r["start_id"], r["end_id"]) for r in rows if r["idiom_id"] in (9805, 9808)}
    assert nested[9805] == ("c18_13268", "c18_13272")
    assert nested[9808] == ("c18_13268", "c18_13270")


def test_only_the_known_1845_omission_has_an_empty_segment(rows):
    empty = [(r["idiom_id"], r["edition"], r["match_status"]) for r in rows if not r["en_segment"]]
    assert empty == [(11703, "1845", "no_segment")]


def test_la_piglia_con_me_is_absent_from_1845_only(rows):
    by_edition = {r["edition"]: r for r in rows if r["idiom_id"] == 11703}
    assert by_edition["1845"]["match_status"] == "no_segment"
    assert by_edition["1972"]["match_status"] == "ok"
    assert by_edition["2022"]["match_status"] == "ok"


def test_me_ne_lavo_le_mani_renders_as_wash_my_hands_everywhere(rows):
    for row in (r for r in rows if r["idiom_id"] == 25):
        assert "wash my hands" in row["en_segment"].lower()


def test_carneade_straddles_in_the_modern_editions_only(rows):
    by_edition = {r["edition"]: r for r in rows if r["idiom_id"] == 3109}
    assert by_edition["1845"]["match_status"] == "ok"
    assert by_edition["1972"]["match_status"] == "straddle"
    assert by_edition["2022"]["match_status"] == "straddle"


def test_carneade_merge_joined_segments_in_the_right_order(rows):
    # A reversed join would put the question before the exclamation.
    penman = next(r for r in rows if r["idiom_id"] == 3109 and r["edition"] == "1972")
    moore = next(r for r in rows if r["idiom_id"] == 3109 and r["edition"] == "2022")

    assert "Carneades!" in penman["en_segment"][:20]
    assert "but who was he?" in penman["en_segment"]
    assert penman["note_id"] == "english_1972_cap8-n3+english_1972_cap8-n4"

    assert "Carneades!" in moore["en_segment"][:20]
    assert "who in the world was he?" in moore["en_segment"]
    assert moore["note_id"] == "english_2022_cap8-n1+english_2022_cap8-n2"


def test_straddle_rows_keep_the_idioms_span_not_the_merged_span(rows):
    for row in (r for r in rows if r["match_status"] == "straddle"):
        assert row["start_id"] == "c8_10002"
        assert row["end_id"] == "c8_10005"


def test_translators_are_attached_to_every_row(rows):
    expected = {"1845": "Henry Francis C. Logan", "1972": "Bruce Penman", "2022": "Michael Moore"}
    for row in rows:
        assert row["translator"] == expected[row["edition"]]


def test_italian_kwic_context_is_populated(rows):
    lavo = next(r for r in rows if r["idiom_id"] == 25)
    assert lavo["it_span"] == "me ne lavo le mani."
    assert lavo["it_left"].endswith("e")
    assert lavo["it_right"].startswith("—")


def test_corpus_still_contains_split_suffix_ids():
    # Guards test_toknum_ignores_split_suffix against becoming vacuous.
    import glob
    import re

    from build_idiom_parallel import BASE_DIR

    found = 0
    for path in glob.glob(os.path.join(BASE_DIR, "translations", "English_*", "*.xml")):
        with open(path, encoding="utf-8") as handle:
            found += len(re.findall(r'#\w+_\d+_\d+"', handle.read()))
    assert found > 0, "no split-suffix ids left; the toknum guard is now vacuous"


import json

from build_idiom_parallel import write_json, write_jsonl, write_xlsx


def test_write_json_round_trips_every_row(tmp_path, rows):
    path = tmp_path / "parallel.json"
    write_json(rows, str(path))
    loaded = json.loads(path.read_text(encoding="utf-8"))
    assert loaded == rows


def test_write_jsonl_excludes_the_no_segment_row(tmp_path, rows):
    path = tmp_path / "verify.jsonl"
    write_jsonl(rows, str(path))
    lines = path.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 2699

    records = [json.loads(line) for line in lines]
    assert all(set(r) == {"row_id", "idiom_it", "en_segment"} for r in records)
    assert all(r["en_segment"] for r in records)
    assert "11703_1845" not in {r["row_id"] for r in records}


def test_write_jsonl_row_id_joins_back_to_the_corpus(tmp_path, rows):
    path = tmp_path / "verify.jsonl"
    write_jsonl(rows, str(path))
    records = [json.loads(line) for line in path.read_text(encoding="utf-8").strip().split("\n")]

    by_row_id = {f"{r['idiom_id']}_{r['edition']}": r for r in rows}
    for record in records:
        assert record["row_id"] in by_row_id
        assert record["idiom_it"] == by_row_id[record["row_id"]]["label"]


def test_write_jsonl_uses_the_dictionary_label_not_the_surface_form(tmp_path, rows):
    path = tmp_path / "verify.jsonl"
    write_jsonl(rows, str(path))
    records = [json.loads(line) for line in path.read_text(encoding="utf-8").strip().split("\n")]
    lavo = next(r for r in records if r["row_id"] == "25_1972")
    assert lavo["idiom_it"] == "me ne lavo le mani"  # not "me ne lavo le mani."


def test_write_xlsx_has_header_freeze_and_autofilter(tmp_path, rows):
    import openpyxl

    path = tmp_path / "parallel.xlsx"
    write_xlsx(rows, str(path))

    workbook = openpyxl.load_workbook(str(path))
    sheet = workbook.active
    assert [c.value for c in sheet[1]] == COLUMNS
    assert sheet.max_row == 2701  # header + 2700
    assert sheet.freeze_panes == "A2"
    assert sheet.auto_filter.ref == sheet.dimensions
