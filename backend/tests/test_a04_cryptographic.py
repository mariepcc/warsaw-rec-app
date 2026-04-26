"""
OWASP A04 — Cryptographic Failures
Weryfikuje że tokeny są poprawnie walidowane kryptograficznie.
"""

import base64
import json
import httpx as httpx_lib
import pytest


def _make_fake_token(algorithm: str = "HS256", expired: bool = False) -> str:
    """Tworzy nieprawidłowy token JWT do testów."""
    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": algorithm, "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )

    payload = (
        base64.urlsafe_b64encode(
            json.dumps(
                {
                    "sub": "fake-user-id",
                    "email": "fake@test.com",
                    "exp": 1000000000 if expired else 9999999999,
                }
            ).encode()
        )
        .rstrip(b"=")
        .decode()
    )

    return f"{header}.{payload}.fakesignature"


class TestA02CryptographicFailures:
    def test_token_hs256_jest_odrzucany(self, client):
        """
        A02-1: Token podpisany algorytmem HS256 zamiast RS256.
        Cognito używa RS256 — inny algorytm powinien być odrzucony.
        Oczekiwany wynik: 401 Unauthorized
        """
        fake_token = _make_fake_token(algorithm="HS256")

        response = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {fake_token}"},
        )

        assert response.status_code == 401, (
            f"Token HS256 powinien być odrzucony — API akceptuje tylko RS256. "
            f"Otrzymano: {response.status_code} — potencjalna luka A02!"
        )

    def test_token_z_falszywa_sygnatura_jest_odrzucany(self, client):
        """
        A02-2: Token z prawidłowym formatem ale fałszywą sygnaturą.
        Oczekiwany wynik: 401 Unauthorized
        """
        fake_token = _make_fake_token(algorithm="RS256")

        response = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {fake_token}"},
        )

        assert response.status_code == 401, (
            f"Token z fałszywą sygnaturą powinien być odrzucony. "
            f"Otrzymano: {response.status_code} — potencjalna luka A02!"
        )

    def test_wygasly_token_jest_odrzucany(self, client):
        """
        A02-3: Token z datą wygaśnięcia w przeszłości (exp: 2001-09-09).
        Oczekiwany wynik: 401 Unauthorized
        """
        fake_token = _make_fake_token(expired=True)

        response = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {fake_token}"},
        )

        assert response.status_code == 401, (
            f"Wygasły token powinien być odrzucony. "
            f"Otrzymano: {response.status_code} — potencjalna luka A02!"
        )

    def test_pusty_token_jest_odrzucany(self, client):
        """
        A02-4: Pusty string jako token.
        httpx odrzuca nagłówek 'Bearer ' jako nieprawidłowy HTTP —
        co samo w sobie jest poprawnym zachowaniem (LocalProtocolError).
        Testujemy też wariant bez spacji.
        """
        with pytest.raises(httpx_lib.LocalProtocolError):
            client.get(
                "/places/favourites",
                headers={"Authorization": "Bearer "},
            )

        response = client.get(
            "/places/favourites",
            headers={"Authorization": "Bearer"},
        )
        assert response.status_code in (401, 403, 422), (
            f"'Bearer' bez tokena powinien być odrzucony. "
            f"Otrzymano: {response.status_code}"
        )

    def test_losowy_string_jako_token_jest_odrzucany(self, client):
        """
        A02-5: Całkowicie losowy string zamiast JWT.
        Oczekiwany wynik: 401 Unauthorized
        """
        response = client.get(
            "/places/favourites",
            headers={"Authorization": "Bearer abcdef123456"},
        )

        assert response.status_code == 401, (
            f"Losowy string jako token powinien być odrzucony. "
            f"Otrzymano: {response.status_code}"
        )

    def test_brak_naglowka_authorization(self, client):
        """
        A02-6: Request bez nagłówka Authorization w ogóle.
        Oczekiwany wynik: 401 Unauthorized
        """
        response = client.get("/places/favourites")

        assert response.status_code == 401, (
            f"Brak nagłówka Authorization powinien zwrócić 401. "
            f"Otrzymano: {response.status_code}"
        )

    def test_poprawny_token_jest_akceptowany(self, client, token_a):
        """
        A02-7: Prawidłowy token RS256 z Cognito.
        Oczekiwany wynik: 200 OK — weryfikacja że walidacja nie blokuje
        prawidłowych użytkowników.
        """
        response = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {token_a}"},
        )

        assert response.status_code == 200, (
            f"Prawidłowy token powinien być akceptowany. "
            f"Otrzymano: {response.status_code}"
        )

    def test_odpowiedz_nie_zawiera_wrazliwych_danych_w_bledzie(self, client):
        """
        A02-8: Komunikat błędu nie ujawnia szczegółów implementacji.
        Oczekiwany wynik: ogólny komunikat błędu bez stacktrace,
        nazw algorytmów, struktury kluczy.
        """
        fake_token = _make_fake_token()

        response = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {fake_token}"},
        )

        response_text = response.text.lower()

        assert "traceback" not in response_text, (
            "Odpowiedź zawiera traceback — nie ujawniaj szczegółów błędów!"
        )
        assert "jose" not in response_text, (
            "Odpowiedź ujawnia nazwę biblioteki kryptograficznej!"
        )
        assert "jwks" not in response_text, "Odpowiedź ujawnia szczegóły walidacji JWT!"
        assert "secret" not in response_text, (
            "Odpowiedź może zawierać wrażliwe słowa kluczowe!"
        )
