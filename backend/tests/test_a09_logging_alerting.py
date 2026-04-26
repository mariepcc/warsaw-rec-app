"""
OWASP A09:2025 — Security Logging and Alerting Failures
Verifies that the API logs security-relevant events correctly and that
responses never reveal more information than necessary.
These tests check observable behavior — what the API returns and what
it does NOT return. Direct log file inspection is done separately.
"""

import pytest
import base64
import os
import time
from dotenv import load_dotenv

load_dotenv("tests/.env.test")

LOG_FILE = os.getenv("LOG_FILE", "app.log")


def _tamper_signature(token: str) -> str:
    parts = token.split(".")
    if len(parts) != 3:
        return token
    fake_sig = base64.urlsafe_b64encode(b"fakesig").rstrip(b"=").decode()
    return f"{parts[0]}.{parts[1]}.{fake_sig}"


class TestA09SecurityLoggingAndAlerting:
    def test_401_body_is_generic(self, client):
        """
        A09-1: 401 response must contain a generic message.
        Must NOT reveal: 'token expired', 'invalid signature',
        'user not found', 'wrong algorithm' — each of these
        helps an attacker understand what went wrong.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401
        body = response.text.lower()

        overly_specific = [
            "expired",
            "signature",
            "algorithm",
            "user not found",
            "does not exist",
            "invalid key",
            "cognito",
            "jwks",
        ]
        for phrase in overly_specific:
            assert phrase not in body, (
                f"401 response reveals too much: '{phrase}' found in body. "
                f"Use a generic message like 'Unauthorized'. "
                f"Body: {response.text[:200]}"
            )

    def test_403_body_is_generic(self, client, token_a, token_b, session_id_a):
        """
        A09-2: 403 response when accessing another user's resource
        must not reveal the resource exists or who owns it.
        'Access denied to session owned by user X' is too much information.
        """
        response = client.get(
            f"/sessions/{session_id_a}/messages",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert response.status_code == 403
        body = response.text.lower()

        for phrase in ["user_id", "owner", "belongs", "session exists"]:
            assert phrase not in body, (
                f"403 response leaks ownership info: '{phrase}'. "
                f"Body: {response.text[:200]}"
            )

    def test_404_body_does_not_confirm_resource_existence(self, client, token_a):
        """
        A09-3: 404 for a non-existent endpoint must not confirm
        that other endpoints exist or reveal routing structure.
        """
        response = client.get(
            "/sessions/nonexistent-path/something",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code in (404, 403)
        body = response.text.lower()

        for phrase in ["route", "router", "endpoint exists", "path"]:
            assert phrase not in body, (
                f"404 reveals routing info: '{phrase}'. Body: {response.text[:200]}"
            )

    def test_500_body_is_completely_generic(self, client, token_a):
        """
        A09-4: Any 500 response must return only a generic error message.
        No exception class names, no file paths, no variable values.
        """
        response = client.post(
            "/places/favourites/test-id/toggle",
            json={"name": "x" * 5000, "rating": 999999},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        if response.status_code == 500:
            body = response.text.lower()
            forbidden = [
                "traceback",
                "exception",
                "error in",
                'file "',
                "line ",
                "psycopg",
                "sqlalchemy",
                "postgres",
                "attributeerror",
                "keyerror",
                "valueerror",
                "typeerror",
            ]
            for phrase in forbidden:
                assert phrase not in body, (
                    f"500 response leaks exception details: '{phrase}'. "
                    f"Body: {response.text[:300]}"
                )

    def test_repeated_auth_failures_all_return_401(self, client):
        """
        A09-5: Ten consecutive authentication failures must all return 401.
        Consistent response is prerequisite for reliable security logging —
        if some return 500, those events may not be logged correctly.
        """
        codes = []
        for _ in range(10):
            response = client.get(
                "/sessions/",
                headers={"Authorization": "Bearer totallyfaketoken123"},
            )
            codes.append(response.status_code)

        assert all(c == 401 for c in codes), (
            f"Not all auth failures returned 401. Codes: {codes}. "
            "Inconsistent responses make security logging unreliable."
        )

    def test_tampered_token_consistently_returns_401(self, client, token_a):
        """
        A09-6: Tampered token must consistently return 401 across
        multiple requests. Inconsistency would indicate a flaky
        signature verification that might sometimes pass.
        """
        tampered = _tamper_signature(token_a)
        codes = []
        for _ in range(5):
            response = client.get(
                "/sessions/",
                headers={"Authorization": f"Bearer {tampered}"},
            )
            codes.append(response.status_code)

        assert all(c == 401 for c in codes), (
            f"Tampered token gave inconsistent responses: {codes}. "
            "Signature verification must be deterministic."
        )

    def test_access_control_violation_consistently_returns_403(
        self, client, token_b, session_id_a
    ):
        """
        A09-7: Cross-user access attempt must consistently return 403.
        Consistent enforcement is required for reliable alerting
        on access control violations.
        """
        codes = []
        for _ in range(5):
            response = client.get(
                f"/sessions/{session_id_a}/messages",
                headers={"Authorization": f"Bearer {token_b}"},
            )
            codes.append(response.status_code)

        assert all(c == 403 for c in codes), (
            f"Access control gave inconsistent responses: {codes}. "
            "403 must be returned every time, not occasionally."
        )

    def test_log_file_does_not_contain_plaintext_tokens(self):
        """
        A09-8: Log files must never contain full JWT tokens.
        A JWT in logs can be replayed by anyone with log access.
        Checks the log file if LOG_FILE env var points to it.

        To enable: set LOG_FILE=path/to/app.log in tests/.env.test
        """
        if not os.path.exists(LOG_FILE):
            pytest.skip(
                f"Log file not found at '{LOG_FILE}'. "
                "Set LOG_FILE in tests/.env.test to enable this test."
            )

        with open(LOG_FILE, "r", errors="replace") as f:
            log_content = f.read()
        import re

        jwt_pattern = re.compile(
            r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"
        )
        matches = jwt_pattern.findall(log_content)

        assert not matches, (
            f"Found {len(matches)} JWT token(s) in log file '{LOG_FILE}'. "
            "Tokens must never be logged in full. Log only the first 20 chars or user_id."
        )

    def test_log_file_does_not_contain_passwords(self):
        """
        A09-9: Log files must not contain passwords or API keys.
        Checks for common patterns like sk-, password=, OPENAI_API_KEY.
        """
        if not os.path.exists(LOG_FILE):
            pytest.skip(f"Log file not found at '{LOG_FILE}'.")

        with open(LOG_FILE, "r", errors="replace") as f:
            log_content = f.read().lower()

        sensitive_patterns = [
            "password=",
            "password:",
            "sk-",
            "openai_api_key",
            "postgres://",
            "postgresql://",
        ]
        for pattern in sensitive_patterns:
            assert pattern not in log_content, (
                f"Log file contains sensitive pattern: '{pattern}'. File: {LOG_FILE}"
            )

    def test_log_file_contains_security_events_after_auth_failure(self, client):
        """
        A09-10: After triggering an auth failure, the log file should
        contain a record of the event. Verifies security events are logged.

        Checks for the presence of any security-related log entry
        (401, unauthorized, auth, invalid token).
        """
        if not os.path.exists(LOG_FILE):
            pytest.skip(f"Log file not found at '{LOG_FILE}'.")
        with open(LOG_FILE, "r", errors="replace") as f:
            before = f.read()
        client.get(
            "/sessions/",
            headers={"Authorization": "Bearer triggerloggingtest123"},
        )

        time.sleep(0.5)

        with open(LOG_FILE, "r", errors="replace") as f:
            after = f.read()

        new_log_content = after[len(before) :].lower()

        security_keywords = ["401", "unauthorized", "invalid", "token", "auth"]
        found = any(kw in new_log_content for kw in security_keywords)

        assert found, (
            "No security event found in logs after authentication failure. "
            f"New log content: '{new_log_content[:300]}'. "
            "Ensure auth failures are logged at WARNING or ERROR level."
        )

    def test_error_responses_have_no_debug_headers(self, client, token_a):
        """
        A09-11: Error responses must not include debug headers like
        X-Debug, X-Powered-By, X-Runtime, X-Request-Id with internal details.
        These headers can reveal framework versions or internal timing.
        """
        response = client.get(
            "/nonexistent-endpoint",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        forbidden_headers = [
            "x-powered-by",
            "x-debug",
            "x-runtime",
            "x-aspnet-version",
            "x-aspnetmvc-version",
        ]
        for header in forbidden_headers:
            assert header not in response.headers, (
                f"Response contains debug header: '{header}': "
                f"'{response.headers[header]}'"
            )

    def test_successful_response_does_not_include_internal_ids(self, client, token_a):
        """
        A09-12: Successful API responses must not expose internal
        database IDs, server identifiers, or implementation details
        beyond what the API contract requires.
        /health specifically must return only status.
        """
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()

        forbidden_keys = [
            "server",
            "version",
            "python",
            "database",
            "host",
            "pid",
            "process",
            "internal",
        ]
        for key in forbidden_keys:
            assert key not in data, (
                f"/health response contains internal key: '{key}'. Response: {data}"
            )

    def test_timing_is_consistent_for_valid_vs_invalid_user(
        self, client, token_a, token_b
    ):
        """
        A09-13: Response time for valid vs invalid auth should not differ
        significantly — timing differences can be used to enumerate valid users.
        This is a soft check — flags large differences (> 2 seconds).
        """
        start = time.time()
        client.get("/sessions/", headers={"Authorization": f"Bearer {token_a}"})
        valid_time = time.time() - start
        start = time.time()
        client.get("/sessions/", headers={"Authorization": "Bearer invalidtoken123"})
        invalid_time = time.time() - start

        diff = abs(valid_time - invalid_time)
        assert diff < 2.0, (
            f"Timing difference between valid ({valid_time:.2f}s) and "
            f"invalid ({invalid_time:.2f}s) auth is {diff:.2f}s. "
            "Large timing differences can enable timing-based user enumeration."
        )
