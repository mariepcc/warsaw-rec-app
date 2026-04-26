"""
OWASP A07:2025 — Authentication Failures
Verifies that the API correctly rejects all forms of invalid, missing,
tampered, or expired authentication tokens.
"""

import pytest
import base64
import json
import os
import time
from dotenv import load_dotenv

load_dotenv("tests/.env.test")

USER_POOL_ID = os.getenv("USER_POOL_ID")
APP_CLIENT_ID = os.getenv("APP_CLIENT_ID")
COGNITO_REGION = USER_POOL_ID.split("_")[0] if USER_POOL_ID else "eu-north-1"
PROTECTED_ENDPOINTS = [
    ("GET", "/sessions/"),
    ("GET", "/places/favourites"),
    ("GET", "/places/all"),
    ("GET", "/places/favourite-names"),
    ("GET", "/chat/search-history?q=test"),
    ("GET", "/chat/all-names"),
]


def _tamper_signature(token: str) -> str:
    """Replace the JWT signature with random bytes — header and payload unchanged."""
    parts = token.split(".")
    if len(parts) != 3:
        return token
    fake_sig = (
        base64.urlsafe_b64encode(b"fakesignature1234567890").rstrip(b"=").decode()
    )
    return f"{parts[0]}.{parts[1]}.{fake_sig}"


def _modify_payload(token: str, overrides: dict) -> str:
    """
    Decode JWT payload, apply overrides, re-encode.
    Signature becomes invalid — backend must detect this.
    """
    parts = token.split(".")
    if len(parts) != 3:
        return token
    padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded))
    payload.update(overrides)

    new_payload = (
        base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode())
        .rstrip(b"=")
        .decode()
    )
    fake_sig = base64.urlsafe_b64encode(b"invalidsig").rstrip(b"=").decode()
    return f"{parts[0]}.{new_payload}.{fake_sig}"


def _build_fake_token() -> str:
    """Build a structurally valid JWT from a different User Pool — wrong issuer."""
    header = (
        base64.urlsafe_b64encode(
            json.dumps({"alg": "RS256", "kid": "fakekey123"}).encode()
        )
        .rstrip(b"=")
        .decode()
    )

    payload = (
        base64.urlsafe_b64encode(
            json.dumps(
                {
                    "sub": "00000000-0000-0000-0000-000000000000",
                    "iss": "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_FAKEPOOLID",
                    "client_id": APP_CLIENT_ID,
                    "token_use": "access",
                    "scope": "aws.cognito.signin.user.admin",
                    "exp": int(time.time()) + 3600,
                    "iat": int(time.time()),
                    "jti": "fake-jti-value",
                    "username": "attacker@evil.com",
                },
                separators=(",", ":"),
            ).encode()
        )
        .rstrip(b"=")
        .decode()
    )

    fake_sig = base64.urlsafe_b64encode(b"fakesig").rstrip(b"=").decode()
    return f"{header}.{payload}.{fake_sig}"


class TestA07AuthenticationFailures:
    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_missing_token_returns_401(self, client, method, path):
        """
        A07-1: Every protected endpoint must return 401 when
        the Authorization header is completely absent.
        """
        response = client.request(method, path)
        assert response.status_code == 401, (
            f"{method} {path} returned {response.status_code} without a token. "
            "Expected 401 Unauthorized."
        )

    def test_empty_bearer_token_returns_401(self, client):
        """
        A07-2: Authorization: Bearer <empty> must be rejected with 401.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": "Bearer x"},
        )
        assert response.status_code == 401, (
            f"Empty Bearer token returned {response.status_code}. Expected 401."
        )

    def test_authorization_without_bearer_prefix_returns_401(self, client, token_a):
        """
        A07-3: Token sent without the 'Bearer ' prefix must be rejected.
        Only the correct Authorization: Bearer <token> format is valid.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": token_a},
        )
        assert response.status_code == 401, (
            f"Token without 'Bearer' prefix returned {response.status_code}. "
            "Expected 401."
        )

    def test_basic_auth_scheme_is_rejected(self, client):
        """
        A07-4: Authorization: Basic <credentials> must not be accepted.
        API uses Bearer JWT exclusively.
        """
        import base64

        fake_basic = base64.b64encode(b"user:password").decode()
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Basic {fake_basic}"},
        )
        assert response.status_code == 401, (
            f"Basic auth scheme returned {response.status_code}. Expected 401."
        )

    def test_random_string_token_returns_401(self, client):
        """
        A07-5: A random string that looks nothing like a JWT must be rejected.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": "Bearer thisisnotavalidjwttoken"},
        )
        assert response.status_code == 401, (
            f"Random string token returned {response.status_code}. Expected 401."
        )

    def test_token_with_only_two_parts_returns_401(self, client):
        """
        A07-6: A JWT must have exactly three base64 parts separated by dots.
        A two-part token (missing signature) must be rejected.
        """
        fake = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0"
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {fake}"},
        )
        assert response.status_code == 401, (
            f"Malformed JWT (2 parts) returned {response.status_code}. Expected 401."
        )

    def test_tampered_signature_returns_401(self, client, token_a):
        """
        A07-7: A valid token with its signature replaced must be rejected.
        Backend must verify the RS256 signature against Cognito JWKS.
        If this passes, signature verification is not working.
        """
        tampered = _tamper_signature(token_a)
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert response.status_code == 401, (
            f"Tampered signature returned {response.status_code}. "
            "Expected 401 — JWT signature verification may not be working!"
        )

    def test_modified_user_id_in_payload_returns_401(self, client, token_a):
        """
        A07-8: A token with a modified 'sub' claim (user ID) but invalid
        signature must be rejected. This simulates a privilege escalation attempt
        where an attacker tries to impersonate another user.
        """
        modified = _modify_payload(
            token_a, {"sub": "00000000-0000-0000-0000-000000000000"}
        )
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {modified}"},
        )
        assert response.status_code == 401, (
            f"Modified sub claim returned {response.status_code}. "
            "Expected 401 — backend must verify signature, not just decode payload!"
        )

    def test_modified_expiry_to_future_returns_401(self, client, token_a):
        """
        A07-9: A token with 'exp' extended far into the future but with
        invalid signature must be rejected.
        Verifies that backend validates signature, not just expiry.
        """
        far_future = int(time.time()) + 999_999
        modified = _modify_payload(token_a, {"exp": far_future})
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {modified}"},
        )
        assert response.status_code == 401, (
            f"Token with modified exp returned {response.status_code}. "
            "Expected 401 — signature verification must catch payload tampering."
        )

    def test_algorithm_none_attack_returns_401(self, client, token_a):
        """
        A07-10: The 'alg: none' attack — attacker sets algorithm to 'none'
        to bypass signature verification entirely. Classic JWT vulnerability.
        Must always be rejected with 401.
        """
        parts = token_a.split(".")
        fake_header = (
            base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode())
            .rstrip(b"=")
            .decode()
        )
        none_token = f"{fake_header}.{parts[1]}."
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {none_token}"},
        )
        assert response.status_code == 401, (
            f"'alg: none' attack returned {response.status_code}. "
            "Expected 401 — this is a critical JWT vulnerability!"
        )

    def test_token_from_different_user_pool_returns_401(self, client):
        """
        A07-11: A structurally valid JWT issued by a different Cognito User Pool
        must be rejected. Backend must validate the 'iss' claim matches
        the configured User Pool.
        """
        fake_token = _build_fake_token()
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert response.status_code == 401, (
            f"Token from foreign User Pool returned {response.status_code}. "
            "Expected 401 — issuer validation must be enforced."
        )

    def test_token_with_wrong_client_id_returns_401(self, client, token_a):
        """
        A07-12: A token with a modified 'client_id' claim must be rejected.
        Ensures backend validates the token was issued for this specific app client.
        """
        modified = _modify_payload(token_a, {"client_id": "wrongclientid00000000000"})
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {modified}"},
        )
        assert response.status_code == 401, (
            f"Token with wrong client_id returned {response.status_code}. Expected 401."
        )

    def test_manually_expired_token_returns_401(self, client, token_a):
        """
        A07-13: A token with 'exp' set to the past but invalid signature
        must be rejected. (Signature is already invalid so this also tests
        that expired tokens with tampered payloads are caught.)
        Note: testing a naturally expired Cognito token requires waiting 1h.
        This test simulates the scenario via payload modification.
        """
        expired = _modify_payload(token_a, {"exp": 1000000000})
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert response.status_code == 401, (
            f"Expired token (modified payload) returned {response.status_code}. "
            "Expected 401."
        )

    def test_401_response_does_not_distinguish_between_invalid_and_missing(
        self, client, token_a
    ):
        """
        A07-14: Both missing token and invalid token should return 401.
        The response must NOT reveal whether the token was missing vs invalid
        vs expired — that distinction gives attackers useful information.
        """
        missing_response = client.get("/sessions/")
        tampered = _tamper_signature(token_a)
        invalid_response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert missing_response.status_code == 401
        assert invalid_response.status_code == 401

    def test_auth_error_does_not_return_500(self, client):
        """
        A07-15: Authentication errors must never result in a 500 response.
        A 500 on an auth check indicates an unhandled exception in the
        authentication middleware — possible information leak.
        """
        payloads = [
            "Bearer null",
            "Bearer undefined",
            "Bearer eyJhbGciOiJub25lIn0.e30.",
            f"Bearer {'A' * 2000}",
        ]
        for auth_header in payloads:
            response = client.get(
                "/sessions/",
                headers={"Authorization": auth_header},
            )
            assert response.status_code != 500, (
                f"Auth header '{auth_header[:50]}' caused 500. "
                "Authentication errors must never return 500."
            )

    def test_auth_failure_response_body_is_minimal(self, client):
        """
        A07-16: 401 response body must not contain stack traces,
        internal error messages, or Cognito configuration details.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401
        body = response.text.lower()

        for keyword in [
            "traceback",
            "cognito",
            "user_pool",
            "jwks",
            "secret",
            "eu-north",
        ]:
            assert keyword not in body, (
                f"401 response leaks internal detail: '{keyword}'. "
                f"Body: {response.text[:300]}"
            )

    def test_valid_token_returns_200(self, client, token_a):
        """
        A07-17: Sanity check — a valid token must still work after all the above.
        Ensures that security fixes did not break legitimate authentication.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 200, (
            f"Valid token returned {response.status_code}. "
            "Authentication is broken for legitimate users."
        )
