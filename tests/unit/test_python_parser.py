"""Unit tests for the Python traceback parser."""

from __future__ import annotations

from packages.parsers.python_stack_parser import (
    ParsedPythonTraceback,
    get_user_frames,
    parse_python_traceback,
)

_SIMPLE_TRACEBACK = """\
Traceback (most recent call last):
  File "/app/services/order_service.py", line 88, in checkout
    user = self.user_repo.get(order.user_id)
  File "/app/repositories/user_repository.py", line 42, in get
    return self.db.query(User).filter(User.id == user_id).one()
sqlalchemy.orm.exc.NoResultFound: No row was found when one was required
"""

_FRAMEWORK_TRACEBACK = """\
Traceback (most recent call last):
  File "/usr/local/lib/python3.12/site-packages/fastapi/routing.py", line 199, in app
    await run_endpoint_function(dependant=dependant, values=values, is_coroutine=is_coroutine)
  File "/app/api/views.py", line 34, in get_user
    return user.email
AttributeError: 'NoneType' object has no attribute 'email'
"""

_CHAINED_TRACEBACK = """\
Traceback (most recent call last):
  File "/app/services/payment.py", line 10, in charge
    result = client.post()
ConnectionError: Connection refused
During handling of the above exception, another exception occurred:
Traceback (most recent call last):
  File "/app/services/order_service.py", line 55, in place_order
    self._payment.charge(amount)
RuntimeError: Payment service unavailable
"""

_MULTILINE_MESSAGE = """\
Traceback (most recent call last):
  File "/app/tasks/bulk_import.py", line 77, in run
    result = processor.execute(batch)
ValueError: Invalid data in row 42:
    expected integer, got 'N/A'
"""


class TestParseSimpleTraceback:
    def test_returns_parsed_traceback(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        assert isinstance(result, ParsedPythonTraceback)

    def test_exception_type_extracted(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        assert result.exception_type == "NoResultFound"

    def test_exception_message_extracted(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        assert "No row was found" in result.exception_message

    def test_frame_count(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        assert len(result.frames) == 2

    def test_throw_site_frame_is_last(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        assert "user_repository.py" in result.frames[-1].file_path

    def test_no_traceback_returns_none(self) -> None:
        assert parse_python_traceback("Some plain log line") is None

    def test_empty_string_returns_none(self) -> None:
        assert parse_python_traceback("") is None


class TestFrameworkFrameFiltering:
    def test_site_packages_marked_as_not_user_code(self) -> None:
        result = parse_python_traceback(_FRAMEWORK_TRACEBACK)
        assert result is not None
        framework_frames = [f for f in result.frames if not f.is_user_code]
        assert len(framework_frames) >= 1
        assert any("site-packages" in f.file_path for f in framework_frames)

    def test_app_frame_marked_as_user_code(self) -> None:
        result = parse_python_traceback(_FRAMEWORK_TRACEBACK)
        assert result is not None
        user_frames = [f for f in result.frames if f.is_user_code]
        assert any("/app/" in f.file_path for f in user_frames)


class TestChainedExceptions:
    def test_chained_exception_detected(self) -> None:
        result = parse_python_traceback(_CHAINED_TRACEBACK)
        assert result is not None
        assert len(result.chained) == 1

    def test_first_block_is_cause(self) -> None:
        # Parser returns the first traceback block as the main result (the cause).
        result = parse_python_traceback(_CHAINED_TRACEBACK)
        assert result is not None
        assert result.exception_type == "ConnectionError"

    def test_chained_block_is_effect(self) -> None:
        # The second block (the effect / re-raise) is stored in chained[0].
        result = parse_python_traceback(_CHAINED_TRACEBACK)
        assert result is not None
        assert result.chained[0].exception_type == "RuntimeError"


class TestGetUserFrames:
    def test_returns_user_frames_most_inner_first(self) -> None:
        result = parse_python_traceback(_FRAMEWORK_TRACEBACK)
        assert result is not None
        frames = get_user_frames(result)
        assert len(frames) >= 1
        assert frames[0].file_path.endswith("views.py")

    def test_max_frames_respected(self) -> None:
        result = parse_python_traceback(_SIMPLE_TRACEBACK)
        assert result is not None
        frames = get_user_frames(result, max_frames=1)
        assert len(frames) == 1
