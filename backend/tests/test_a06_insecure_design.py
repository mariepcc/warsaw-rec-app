"""
OWASP A06:2025 — Insecure Design
Weryfikuje że logika biznesowa API jest bezpieczna architekturalnie —
nie tylko na poziomie implementacji, ale na poziomie projektu.

Testowane scenariusze:
- izolacja danych między użytkownikami (IDOR)
- brak możliwości dostępu do cudzych sesji i ulubionych
- brak możliwości enumeracji zasobów innych użytkowników
- poprawność logiki toggle (idempotentność)
"""

import uuid
import pytest


class TestA06InsecureDesign:
    def test_uzytkownik_b_nie_widzi_sesji_uzytkownika_a(self, client, token_a, token_b):
        """
        A06-1: Sesje użytkownika A nie mogą być widoczne dla użytkownika B.
        GET /sessions/ musi zwracać tylko sesje zalogowanego użytkownika.
        """
        response_a = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_a.status_code == 200
        assert response_b.status_code == 200

        sessions_a = {s["id"] for s in response_a.json()}
        sessions_b = {s["id"] for s in response_b.json()}

        overlap = sessions_a & sessions_b
        assert not overlap, (
            f"Użytkownicy A i B widzą te same sesje: {overlap}. "
            "Sesje powinny być izolowane per użytkownik."
        )

    def test_uzytkownik_b_nie_moze_czytac_wiadomosci_sesji_a(
        self, client, token_a, token_b
    ):
        """
        A06-2: Użytkownik B nie może odczytać wiadomości z sesji użytkownika A.
        Nawet jeśli zna session_id — musi dostać 403.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 200
        sessions = response.json()

        if not sessions:
            pytest.skip(
                "Użytkownik A nie ma żadnych sesji — uruchom najpierw /chat/message"
            )

        session_id_a = sessions[0]["id"]
        response_b = client.get(
            f"/sessions/{session_id_a}/messages",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_b.status_code == 403, (
            f"Użytkownik B uzyskał dostęp do sesji użytkownika A (HTTP {response_b.status_code}). "
            "Oczekiwano 403 Forbidden."
        )

    def test_uzytkownik_b_nie_moze_usunac_sesji_a(self, client, token_a, token_b):
        """
        A06-3: Użytkownik B nie może usunąć sesji użytkownika A.
        DELETE /sessions/{id} musi sprawdzać właściciela przed usunięciem.
        """
        response = client.get(
            "/sessions/",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response.status_code == 200
        sessions = response.json()

        if not sessions:
            pytest.skip("Użytkownik A nie ma żadnych sesji")

        session_id_a = sessions[0]["id"]

        response_b = client.delete(
            f"/sessions/{session_id_a}",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_b.status_code in (403, 404), (
            f"Użytkownik B usunął sesję użytkownika A (HTTP {response_b.status_code}). "
            "Oczekiwano 403 lub 404."
        )
        response_check = client.get(
            f"/sessions/{session_id_a}/messages",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert response_check.status_code in (200, 403), (
            "Sesja użytkownika A została usunięta przez użytkownika B."
        )

    def test_ulubione_sa_izolowane_per_uzytkownik(self, client, token_a, token_b):
        """
        A06-4: GET /places/favourites musi zwracać tylko ulubione zalogowanego użytkownika.
        Użytkownik B nie może widzieć ulubionych użytkownika A.
        """
        place_name = f"TestPlace_A06_{uuid.uuid4().hex[:8]}"
        place_id = str(uuid.uuid4())
        client.post(
            f"/places/favourites/{place_id}/toggle",
            json={
                "name": place_name,
                "rating": 4.5,
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/places/favourites",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert response_b.status_code == 200

        names_b = [p["name"] for p in response_b.json()]
        assert place_name not in names_b, (
            f"Ulubione miejsce użytkownika A ('{place_name}') jest widoczne dla użytkownika B. "
            "Ulubione powinny być izolowane per użytkownik."
        )

    def test_favourite_names_sa_izolowane(self, client, token_a, token_b):
        """
        A06-5: GET /places/favourite-names zwraca tylko nazwy ulubionych
        zalogowanego użytkownika — nie globalną listę.
        """
        place_name = f"UniqueFavName_{uuid.uuid4().hex[:8]}"
        place_id = str(uuid.uuid4())
        client.post(
            f"/places/favourites/{place_id}/toggle",
            json={"name": place_name, "rating": 3.0},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/places/favourite-names",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert response_b.status_code == 200
        names_b = response_b.json().get("names", [])

        assert place_name not in names_b, (
            "Nazwa ulubionego miejsca użytkownika A widoczna dla użytkownika B. "
            "Endpoint favourite-names nie filtruje po użytkowniku."
        )

    def test_toggle_dodaje_i_usuwa_ulubione(self, client, token_a):
        """
        A06-6: Logika toggle musi być deterministyczna.
        Pierwsze wywołanie dodaje, drugie usuwa, trzecie dodaje ponownie.
        Błąd tutaj oznacza lukę w logice biznesowej — można manipulować stanem.
        """
        place_id = str(uuid.uuid4())
        payload = {"name": f"ToggleTest_{uuid.uuid4().hex[:6]}", "rating": 4.0}
        headers = {"Authorization": f"Bearer {token_a}"}
        r1 = client.post(
            f"/places/favourites/{place_id}/toggle",
            json=payload,
            headers=headers,
        )
        assert r1.status_code == 200
        state1 = r1.json()["is_favourite"]
        r2 = client.post(
            f"/places/favourites/{place_id}/toggle",
            json=payload,
            headers=headers,
        )
        assert r2.status_code == 200
        state2 = r2.json()["is_favourite"]
        r3 = client.post(
            f"/places/favourites/{place_id}/toggle",
            json=payload,
            headers=headers,
        )
        assert r3.status_code == 200
        state3 = r3.json()["is_favourite"]

        assert state1 != state2, "Toggle nie zmienił stanu przy drugim wywołaniu"
        assert state2 != state3, "Toggle nie zmienił stanu przy trzecim wywołaniu"
        assert state1 == state3, (
            "Toggle nie jest deterministyczny — stan 1 i 3 powinny być identyczne"
        )

    def test_wszystkie_miejsca_dostepne_dla_kazdego_zalogowanego(
        self, client, token_a, token_b
    ):
        """
        A06-7: GET /places/all to publiczny zasób dla zalogowanych użytkowników.
        Obaj użytkownicy muszą widzieć tę samą listę — to nie jest dane prywatne.
        """
        response_a = client.get(
            "/places/all",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/places/all",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_a.status_code == 200
        assert response_b.status_code == 200
        assert len(response_a.json()) == len(response_b.json()), (
            "Użytkownicy A i B widzą różną liczbę miejsc w /places/all. "
            "To zasób współdzielony — powinien być identyczny."
        )

    def test_sekwencyjne_session_id_nie_ujawniaja_danych(self, client, token_b):
        """
        A06-8: Jeśli session_id jest UUID (losowe), nie można enumerować cudzych sesji.
        Test sprawdza że losowe UUIDs zwracają 403/404 — nie 200 z cudzymi danymi.
        Brak tego zabezpieczenia = klasyczny IDOR.
        """
        guessed_ids = [str(uuid.uuid4()) for _ in range(10)]

        for session_id in guessed_ids:
            response = client.get(
                f"/sessions/{session_id}/messages",
                headers={"Authorization": f"Bearer {token_b}"},
            )
            assert response.status_code in (403, 404), (
                f"Losowy session_id '{session_id}' zwrócił {response.status_code}. "
                "Oczekiwano 403 lub 404."
            )
            assert response.status_code != 200, (
                "Losowy session_id zwrócił dane (200). Możliwe IDOR."
            )

    def test_search_history_zwraca_tylko_swoje_sesje(self, client, token_a, token_b):
        """
        A06-9: GET /chat/search-history?q=... musi filtrować po zalogowanym użytkowniku.
        Użytkownik B nie może przez wyszukiwanie zobaczyć historii użytkownika A.
        """
        response_a = client.get(
            "/chat/search-history?q=",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        response_b = client.get(
            "/chat/search-history?q=",
            headers={"Authorization": f"Bearer {token_b}"},
        )

        assert response_a.status_code == 200
        assert response_b.status_code == 200

        ids_a = {s.get("id") for s in response_a.json() if isinstance(s, dict)}
        ids_b = {s.get("id") for s in response_b.json() if isinstance(s, dict)}

        overlap = ids_a & ids_b
        assert not overlap, (
            f"Search history użytkowników A i B zawiera wspólne sesje: {overlap}. "
            "Historia powinna być izolowana per użytkownik."
        )
