"""
OWASP A01 — Broken Access Control
Weryfikuje że użytkownicy mają dostęp tylko do własnych zasobów.
"""


class TestA01AccessControl:
    def test_brak_tokena_zwraca_401_favourites(self, client):
        """
        A01-1: Dostęp do ulubionych bez tokena.
        Oczekiwany wynik: 401 Unauthorized
        """
        response = client.get("/places/favourites")

        assert response.status_code == 401, (
            f"Endpoint /places/favourites powinien wymagać autoryzacji. "
            f"Otrzymano: {response.status_code}"
        )

    def test_brak_tokena_zwraca_401_sessions(self, client):
        """
        A01-2: Dostęp do sesji bez tokena.
        Oczekiwany wynik: 401 Unauthorized
        """
        response = client.get("/sessions/")

        assert response.status_code == 401, (
            f"Endpoint /sessions/ powinien wymagać autoryzacji. "
            f"Otrzymano: {response.status_code}"
        )

    def test_uzytkownik_b_nie_moze_czytac_sesji_a(self, client, token_b, session_id_a):
        """
        A01-3: Użytkownik B próbuje odczytać wiadomości z sesji użytkownika A.
        Oczekiwany wynik: 403 Forbidden
        """
        response = client.get(
            f"/sessions/{session_id_a}/messages",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response.status_code == 403, (
            f"Użytkownik B nie powinien mieć dostępu do sesji użytkownika A. "
            f"Otrzymano: {response.status_code} — potencjalna luka A01!"
        )

    def test_uzytkownik_b_nie_moze_usunac_sesji_a(self, client, token_b, session_id_a):
        """
        A01-4: Użytkownik B próbuje usunąć sesję użytkownika A.
        Oczekiwany wynik: 403 Forbidden
        """
        response = client.delete(
            f"/sessions/{session_id_a}",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response.status_code == 403, (
            f"Użytkownik B nie powinien móc usuwać sesji użytkownika A. "
            f"Otrzymano: {response.status_code} — potencjalna luka A01!"
        )

    def test_uzytkownik_a_widzi_tylko_swoje_ulubione(self, client, token_a, token_b):
        """
        A01-5: Ulubione użytkownika A nie są widoczne dla użytkownika B.
        Oczekiwany wynik: listy ulubionych obu użytkowników są różne lub B ma pustą listę.
        """
        response_a = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_a.status_code == 200
        assert response_b.status_code == 200

        places_a = {p["name"] for p in response_a.json()}
        places_b = {p["name"] for p in response_b.json()}
        if places_a:
            assert places_a != places_b, (
                "Użytkownik B widzi te same ulubione co użytkownik A — "
                "potencjalna luka A01!"
            )

    def test_uzytkownik_a_widzi_swoje_sesje(self, client, token_a, session_id_a):
        """
        A01-6: Użytkownik A ma dostęp do własnej sesji.
        Oczekiwany wynik: 200 OK
        """
        response = client.get(
            f"/sessions/{session_id_a}/messages",
            headers={"Authorization": f"Bearer {token_a}"},
        )

        assert response.status_code == 200, (
            f"Użytkownik A powinien mieć dostęp do własnej sesji. "
            f"Otrzymano: {response.status_code}"
        )
