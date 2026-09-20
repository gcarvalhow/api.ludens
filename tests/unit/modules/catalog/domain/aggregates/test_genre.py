from app.modules.catalog.domain.aggregates import Genre
from app.modules.catalog.domain.events import GenreCreated, GenreDeactivated, GenreUpdated

def test_create_sets_name_and_active():
    genre = Genre.create(name="Comédia")

    assert genre.name == "Comédia"
    assert genre.is_active is True

    events = genre.dequeue_events()

    assert len(events) == 1
    assert isinstance(events[0], GenreCreated)

    assert events[0].version == 1

def test_update_changes_name_and_raises_event():
    genre = Genre.create(name="Comédia")
    genre.dequeue_events()

    genre.update(name="Comédia Musical")

    assert genre.name == "Comédia Musical"

    events = genre.dequeue_events()
    assert len(events) == 1
    assert isinstance(events[0], GenreUpdated)

def test_deactivate_sets_is_active_false_and_raises_event():
    genre = Genre.create(name="Comédia")
    genre.dequeue_events()

    genre.deactivate()
    assert genre.is_active is False

    events = genre.dequeue_events()
    assert len(events) == 1
    assert isinstance(events[0], GenreDeactivated)
