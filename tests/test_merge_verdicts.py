import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))

from merge_verdicts import validate_verdict, partition

EN = {"25_1972": "I'll wash my hands of it here and now.'"}


def test_valid_found_verdict_passes():
    v = {"row_id": "25_1972", "found": True, "en_span": "wash my hands of it",
         "confidence": "high", "reason": ""}
    assert validate_verdict(v, EN) is None


def test_valid_not_found_verdict_passes():
    v = {"row_id": "11703_1845", "found": False, "en_span": "",
         "confidence": "high", "reason": "omitted"}
    assert validate_verdict(v, {"11703_1845": "..."}) is None


def test_span_not_a_substring_fails():
    v = {"row_id": "25_1972", "found": True, "en_span": "washed my hands",  # not verbatim
         "confidence": "high", "reason": ""}
    assert validate_verdict(v, EN) is not None


def test_found_true_with_empty_span_fails():
    v = {"row_id": "25_1972", "found": True, "en_span": "",
         "confidence": "high", "reason": ""}
    assert validate_verdict(v, EN) is not None


def test_found_false_with_nonempty_span_fails():
    v = {"row_id": "25_1972", "found": False, "en_span": "wash my hands of it",
         "confidence": "high", "reason": "x"}
    assert validate_verdict(v, EN) is not None


def test_bad_confidence_fails():
    v = {"row_id": "25_1972", "found": True, "en_span": "wash my hands of it",
         "confidence": "certain", "reason": ""}
    assert validate_verdict(v, EN) is not None


def test_unknown_row_id_fails():
    v = {"row_id": "999_1845", "found": False, "en_span": "", "confidence": "low", "reason": "x"}
    assert validate_verdict(v, EN) is not None


def test_partition_splits_clean_from_failures():
    input_index = {"25_1972": EN["25_1972"], "26_1845": "some english"}
    verdicts = [
        {"row_id": "25_1972", "found": True, "en_span": "wash my hands of it",
         "confidence": "high", "reason": ""},
        {"row_id": "26_1845", "found": True, "en_span": "NOT PRESENT",
         "confidence": "low", "reason": ""},
    ]
    clean, failures = partition(verdicts, input_index)
    assert [c["row_id"] for c in clean] == ["25_1972"]
    assert [f["row_id"] for f in failures] == ["26_1845"]


def test_partition_flags_missing_and_duplicate_row_ids():
    input_index = {"25_1972": EN["25_1972"], "26_1845": "some english"}
    verdicts = [
        {"row_id": "25_1972", "found": True, "en_span": "wash my hands of it",
         "confidence": "high", "reason": ""},
        {"row_id": "25_1972", "found": True, "en_span": "wash my hands of it",
         "confidence": "high", "reason": ""},  # duplicate
    ]
    clean, failures = partition(verdicts, input_index)
    reasons = {f["row_id"]: f["_failure"] for f in failures}
    assert "25_1972" in reasons          # duplicate flagged
    assert "26_1845" in reasons          # missing flagged
