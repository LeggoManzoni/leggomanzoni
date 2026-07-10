import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))

from merge_verdicts import validate_verdict, partition

ROW_IDS = {"25_1972", "26_1845"}


def test_valid_yes_passes():
    v = {"row_id": "25_1972", "aligned": "yes", "confidence": "high", "note": ""}
    assert validate_verdict(v, ROW_IDS) is None


def test_valid_no_with_note_passes():
    # "no" is a legitimate verdict (a suspected alignment error), not a failure.
    v = {"row_id": "25_1972", "aligned": "no", "confidence": "high", "note": "unrelated passage"}
    assert validate_verdict(v, ROW_IDS) is None


def test_valid_partial_passes():
    v = {"row_id": "25_1972", "aligned": "partial", "confidence": "medium", "note": "English continues past the Italian"}
    assert validate_verdict(v, ROW_IDS) is None


def test_bad_aligned_value_fails():
    v = {"row_id": "25_1972", "aligned": "maybe", "confidence": "high", "note": ""}
    assert validate_verdict(v, ROW_IDS) is not None


def test_bad_confidence_fails():
    v = {"row_id": "25_1972", "aligned": "yes", "confidence": "certain", "note": ""}
    assert validate_verdict(v, ROW_IDS) is not None


def test_note_not_a_string_fails():
    v = {"row_id": "25_1972", "aligned": "yes", "confidence": "high", "note": 5}
    assert validate_verdict(v, ROW_IDS) is not None


def test_unknown_row_id_fails():
    v = {"row_id": "999_1845", "aligned": "yes", "confidence": "low", "note": ""}
    assert validate_verdict(v, ROW_IDS) is not None


def test_partition_splits_clean_from_failures():
    verdicts = [
        {"row_id": "25_1972", "aligned": "yes", "confidence": "high", "note": ""},
        {"row_id": "26_1845", "aligned": "sideways", "confidence": "low", "note": ""},  # bad enum
    ]
    clean, failures = partition(verdicts, ROW_IDS)
    assert [c["row_id"] for c in clean] == ["25_1972"]
    assert [f["row_id"] for f in failures] == ["26_1845"]


def test_partition_flags_missing_and_duplicate_row_ids():
    verdicts = [
        {"row_id": "25_1972", "aligned": "yes", "confidence": "high", "note": ""},
        {"row_id": "25_1972", "aligned": "yes", "confidence": "high", "note": ""},  # duplicate
    ]
    clean, failures = partition(verdicts, ROW_IDS)
    reasons = {f["row_id"]: f["_failure"] for f in failures}
    assert "25_1972" in reasons          # duplicate flagged
    assert "26_1845" in reasons          # missing flagged
