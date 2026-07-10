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
