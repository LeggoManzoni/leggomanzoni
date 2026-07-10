import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))

from shard_verify import SHARD_SIZE, shard_records


def test_shard_size_is_60():
    assert SHARD_SIZE == 60


def test_sharding_preserves_every_record_once():
    records = [{"row_id": str(i)} for i in range(2699)]
    shards = shard_records(records)
    assert len(shards) == 45
    assert sum(len(s) for s in shards) == 2699
    flat = [r["row_id"] for s in shards for r in s]
    assert flat == [str(i) for i in range(2699)]  # order preserved, no dupes


def test_last_shard_is_the_remainder():
    records = [{"row_id": str(i)} for i in range(2699)]
    shards = shard_records(records)
    assert all(len(s) == 60 for s in shards[:-1])
    assert len(shards[-1]) == 2699 - 44 * 60  # 59
