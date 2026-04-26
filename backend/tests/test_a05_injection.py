"""
OWASP A05 — Injection
Verifies that the API properly validates input data and is not vulnerable
to SQL injection, command injection, or malformed data attacks.
"""

SQL_INJECTION_PAYLOADS = [
    "'; DROP TABLE saved_places; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "1; SELECT * FROM sessions",
    "' OR 1=1 --",
    "%27 OR %271%27=%271",
]

XSS_PAYLOADS = [
    "<script>alert('xss')</script>",
    "javascript:alert(1)",
    "<img src=x onerror=alert(1)>",
]

OVERSIZED_PAYLOADS = [
    "A" * 10_000,
    "A" * 100_000,
]


class TestA03Injection:
    def test_sql_injection_in_category_filter(self, client, token_a):
        """
        A03-1: SQL injection attempts in the category query parameter.
        Expected: 200 with empty list OR 422 Unprocessable Entity.
        Must NOT return a 500 (database error leaking internals).
        """
        for payload in SQL_INJECTION_PAYLOADS:
            response = client.get(
                "/places/favourites",
                params={"category": payload},
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert response.status_code in (200, 422), (
                f"SQL injection payload '{payload}' caused unexpected response: "
                f"{response.status_code} — possible injection vulnerability!"
            )
            assert response.status_code != 500, (
                f"Payload '{payload}' caused a 500 error — "
                f"possible database error leaking internals!"
            )

    def test_sql_injection_in_search(self, client, token_a):
        """
        A03-2: SQL injection attempts in session search query.
        Expected: 200 with results only for the authenticated user,
        or 422. Must NOT return other users' data.
        """
        for payload in SQL_INJECTION_PAYLOADS:
            response = client.get(
                "/chat/search-history",
                params={"q": payload},
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert response.status_code in (200, 422), (
                f"SQL injection in search caused: {response.status_code}"
            )
            assert response.status_code != 500, (
                f"Payload '{payload}' caused a 500 — possible SQL injection!"
            )

    def test_invalid_rating_type_is_rejected(self, client, token_a):
        """
        A03-3: Sending a string instead of float for the rating field.
        Pydantic should reject this with 422 Unprocessable Entity.
        """
        response = client.post(
            "/places/favourites/test-id/toggle",
            json={
                "name": "Test Place",
                "rating": "not_a_number",
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 422, (
            f"Invalid rating type should be rejected by Pydantic. "
            f"Got: {response.status_code}"
        )

    def test_invalid_boolean_field_is_rejected(self, client, token_a):
        """
        A03-4: Sending a string instead of boolean for serves_vegetarian.
        Pydantic should reject this with 422 Unprocessable Entity.
        """
        response = client.post(
            "/places/favourites/test-id/toggle",
            json={
                "name": "Test Place",
                "serves_vegetarian": "yes_please",
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 422, (
            f"Invalid boolean type should be rejected. Got: {response.status_code}"
        )

    def test_missing_required_name_field_is_rejected(self, client, token_a):
        """
        A03-5: Sending toggle request without the required 'name' field.
        Expected: 422 Unprocessable Entity.
        """
        response = client.post(
            "/places/favourites/test-id/toggle",
            json={"rating": 4.5},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 422, (
            f"Request without required 'name' field should be rejected. "
            f"Got: {response.status_code}"
        )

    def test_xss_payload_in_place_name_is_handled(self, client, token_a):
        """
        A03-6: XSS payloads in the place name field.
        API should either accept and store as plain text (200/201)
        or reject (422). Must NOT execute or reflect script tags.
        """
        for payload in XSS_PAYLOADS:
            response = client.post(
                "/places/favourites/test-id/toggle",
                json={"name": payload},
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert response.status_code in (200, 201, 422), (
                f"XSS payload in name caused unexpected: {response.status_code}"
            )
            assert response.status_code != 500, (
                "XSS payload caused server error — check input handling!"
            )

    def test_oversized_chat_message_is_handled(self, client, token_a):
        """
        A03-8: Large message sent to chat endpoint.
        Requires ChatRequest validator — must return 422, not process with AI.
        """
        response = client.post(
            "/chat/message",
            json={"message": "A" * 10_001, "session_id": None},
            headers={"Authorization": f"Bearer {token_a}"},
            timeout=15.0,
        )
        assert response.status_code == 422, (
            f"Message over 10k chars should be rejected by validator. "
            f"Got: {response.status_code}"
        )

    def test_empty_chat_message_is_rejected(self, client, token_a):
        """
        A03-9: Empty string as chat message.
        Requires ChatRequest validator — must return 422 immediately.
        """
        response = client.post(
            "/chat/message",
            json={"message": "", "session_id": None},
            headers={"Authorization": f"Bearer {token_a}"},
            timeout=15.0,
        )
        assert response.status_code == 422, (
            f"Empty message should be rejected. Got: {response.status_code}"
        )

    def test_null_message_is_rejected(self, client, token_a):
        """
        A03-10: Null value as chat message.
        Expected: 422 Unprocessable Entity.
        """
        response = client.post(
            "/chat/message",
            json={"message": None, "session_id": None},
            headers={"Authorization": f"Bearer {token_a}"},
            timeout=15.0,
        )
        assert response.status_code == 422, (
            f"Null message should be rejected. Got: {response.status_code}"
        )

    def test_sql_injection_in_toggle_name_field(self, client, token_a):
        """
        A03-11: SQL injection in place name.
        Parameterized queries protect the DB — payload stored as plain text.
        Must NOT cause 500.
        """
        for payload in SQL_INJECTION_PAYLOADS:
            response = client.post(
                "/places/favourites/test-id/toggle",
                json={"name": payload},
                headers={"Authorization": f"Bearer {token_a}"},
                timeout=15.0,
            )
            assert response.status_code in (200, 201, 422), (
                f"SQL injection in name caused: {response.status_code} — "
                f"possible injection vulnerability!"
            )
            assert response.status_code != 500
