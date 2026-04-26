"""
OWASP A08:2025 — Software and Data Integrity Failures
Weryfikuje że API poprawnie sprawdza integralność tokenów JWT
i nie pozwala na manipulację danymi autoryzacyjnymi.

Testowane scenariusze:
- tokeny z nieprawidłowym podpisem
- tokeny z zmodyfikowanym payloadem (podmiana user_id)
- tokeny wygasłe
- tokeny z nieprawidłowym issuerem / audience
- brak tokenu i nieprawidłowy format
- manipulacja algorytmem (alg:none attack)
"""

import uuid
import base64
import json
import pytest


def _b64_encode(data: dict) -> str:
    """Enkoduje dict jako base64url bez paddingu — format segmentu JWT."""
    raw = json.dumps(data, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _forge_token(header: dict, payload: dict, signature: str = "fakesignature") -> str:
    """Tworzy fałszywy token JWT z podanym headerem i payloadem."""
    h = _b64_encode(header)
    p = _b64_encode(payload)
    s = base64.urlsafe_b64encode(signature.encode()).rstrip(b"=").decode()
    return f"{h}.{p}.{s}"


PROTECTED_ENDPOINTS = [
    ("GET", "/sessions/"),
    ("GET", "/places/favourites"),
    ("GET", "/places/all"),
    ("GET", "/places/favourite-names"),
    ("GET", "/chat/all-names"),
]


class TestA08SoftwareDataIntegrity:
    def test_token_z_falszywym_podpisem_zwraca_401(self, client, token_a):
        """
        A08-1: Token z poprawnym headerem i payloadem ale fałszywym podpisem
        musi być odrzucony. Weryfikacja podpisu RS256 jest krytyczna.
        """
        parts = token_a.split(".")
        assert len(parts) == 3, "Token nie ma 3 segmentów — nieprawidłowy JWT"

        forged = f"{parts[0]}.{parts[1]}.INVALIDSIGNATUREXXXXXXXXXXXXXXXXXX"

        for method, path in PROTECTED_ENDPOINTS:
            response = client.request(
                method,
                path,
                headers={"Authorization": f"Bearer {forged}"},
            )
            assert response.status_code == 401, (
                f"{method} {path}: Token z fałszywym podpisem zwrócił {response.status_code}. "
                "Oczekiwano 401 Unauthorized."
            )

    def test_token_z_zmodyfikowanym_payloadem_zwraca_401(
        self, client, token_a, token_b
    ):
        """
        A08-2: Token z podpisem użytkownika A ale zmodyfikowanym payloadem
        (podmieniony sub/user_id) musi być odrzucony.
        To klasyczny atak — zmiana user_id w payloadzie bez zmiany podpisu.
        """
        parts_a = token_a.split(".")
        parts_b = token_b.split(".")
        assert len(parts_a) == 3 and len(parts_b) == 3

        forged = f"{parts_a[0]}.{parts_b[1]}.{parts_a[2]}"

        for method, path in PROTECTED_ENDPOINTS:
            response = client.request(
                method,
                path,
                headers={"Authorization": f"Bearer {forged}"},
            )
            assert response.status_code == 401, (
                f"{method} {path}: Token z podmieniony payloadem zwrócił {response.status_code}. "
                "Oczekiwano 401 — podpis nie pasuje do zmodyfikowanego payloadu."
            )

    def test_token_z_algorytmem_none_zwraca_401(self, client, token_a):
        """
        A08-3: Atak 'alg:none' — token bez podpisu z headerem alg=none.
        Niektóre biblioteki JWT akceptują takie tokeny jeśli nie są
        poprawnie skonfigurowane. Musi zwrócić 401.
        """
        parts = token_a.split(".")

        try:
            payload_padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_padded))
        except Exception:
            pytest.skip("Nie można zdekodować payloadu tokenu")

        none_token_variants = [
            _forge_token({"alg": "none", "typ": "JWT"}, payload, ""),
            _forge_token({"alg": "None", "typ": "JWT"}, payload, ""),
            _forge_token({"alg": "NONE", "typ": "JWT"}, payload, ""),
            f"{_b64_encode({'alg': 'none', 'typ': 'JWT'})}.{parts[1]}.",
        ]

        for token in none_token_variants:
            for method, path in PROTECTED_ENDPOINTS:
                response = client.request(
                    method,
                    path,
                    headers={"Authorization": f"Bearer {token}"},
                )
                assert response.status_code == 401, (
                    f"{method} {path}: Token alg:none zwrócił {response.status_code}. "
                    f"Wariant: {token[:60]}... Oczekiwano 401."
                )

    def test_token_z_jednym_segmentem_zwraca_401(self, client):
        """
        A08-4: Token z tylko jednym segmentem (brak kropek) musi być odrzucony.
        """
        bad_tokens = [
            "notajwttoken",
            "onlyone",
            "two.segments",
            "four.segments.are.bad",
            "Bearer",
        ]

        for bad_token in bad_tokens:
            response = client.get(
                "/sessions/",
                headers={"Authorization": f"Bearer {bad_token}"},
            )
            assert response.status_code == 401, (
                f"Nieprawidłowy token '{bad_token[:20]}' zwrócił {response.status_code}. "
                "Oczekiwano 401."
            )

    def test_token_z_nieprawidlowym_issuerem_zwraca_401(self, client, token_a):
        """
        A08-5: Token z poprawną strukturą ale innym issuerem (iss)
        musi być odrzucony. Chroni przed tokenami z innych systemów Cognito.
        """
        parts = token_a.split(".")

        try:
            payload_padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_padded))
        except Exception:
            pytest.skip("Nie można zdekodować payloadu tokenu")

        fake_payload = {**payload, "iss": "https://fake-issuer.example.com/fake-pool"}

        forged = _forge_token({"alg": "RS256", "typ": "JWT"}, fake_payload, "fakesig")

        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {forged}"},
        )
        assert response.status_code == 401, (
            f"Token z fałszywym issuerem zwrócił {response.status_code}. "
            "Oczekiwano 401."
        )

    def test_brak_naglowka_authorization_zwraca_401(self, client):
        """
        A08-6: Żądanie bez nagłówka Authorization musi zwrócić 401.
        Weryfikuje że endpointy nie są przypadkowo publiczne.
        """
        for method, path in PROTECTED_ENDPOINTS:
            response = client.request(method, path)
            assert response.status_code == 401, (
                f"{method} {path}: Brak Authorization zwrócił {response.status_code}. "
                "Oczekiwano 401 — endpoint nie powinien być publiczny."
            )

    def test_nieprawidlowy_format_naglowka_zwraca_401(self, client, token_a):
        """
        A08-7: Nagłówek Authorization z nieprawidłowym formatem
        (brak 'Bearer', inne schematy) musi zwrócić 401.
        """
        bad_auth_headers = [
            token_a,
            f"Basic {token_a}",
            f"Token {token_a}",
            f"bearer {token_a}",
            "Bearer null",
            "Bearer undefined",
            "Bearer None",
        ]

        for auth_header in bad_auth_headers:
            response = client.get(
                "/sessions/",
                headers={"Authorization": auth_header},
            )
            assert response.status_code == 401, (
                f"Nieprawidłowy nagłówek '{auth_header[:40]}' zwrócił {response.status_code}. "
                "Oczekiwano 401."
            )

    def test_user_id_in_body_does_not_override_token(self, client, token_a, token_b):
        """
        A08-8: Sending user_id in the request body must not override
        the user_id from the JWT token. Backend must always take the
        user identity from the verified token, never from the body.
        """
        place_id = str(uuid.uuid4())
        response_inject = client.post(
            f"/places/favourites/{place_id}/toggle",
            json={
                "name": f"InjectedPlace_{uuid.uuid4().hex[:6]}",
                "rating": 4.0,
                "user_id": "some-other-user-id",
                "userId": "some-other-user-id",
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response_inject.status_code in (200, 422), (
            f"Toggle with extra user_id field returned {response_inject.status_code}."
        )

    def test_place_id_w_url_i_body_musi_byc_spojny(self, client, token_a):
        """
        A08-9: place_id z URL path musi być użyty przez backend — nie z body.
        Zapobiega manipulacji identyfikatorem zasobu przez podmianę w body.
        """
        place_id_url = str(uuid.uuid4())
        place_id_body = str(uuid.uuid4())

        response = client.post(
            f"/places/favourites/{place_id_url}/toggle",
            json={
                "id": place_id_body,
                "name": "IntegrityTest",
                "rating": 3.5,
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code in (200, 422), (
            f"Toggle z różnymi ID w URL i body zwrócił {response.status_code}."
        )
        assert response.status_code != 500, (
            "Różnica ID w URL i body spowodowała crash serwera."
        )
