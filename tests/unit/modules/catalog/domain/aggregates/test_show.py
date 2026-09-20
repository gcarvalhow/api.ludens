from uuid import uuid4

from app.modules.catalog.domain.aggregates import Show
from app.modules.catalog.domain.enumerations import ShowStatus

from app.modules.catalog.domain.events import (
    ShowCreated,
    ShowDeactivated,
    ShowPublished,
    ShowUnpublished,
    ShowUpdated,
)

_GENRE_ID = uuid4()

def _create() -> Show:
    return Show.create(
        title="Hamlet", synopsis="Tragédia.", image_url="/img/hamlet.jpg", genre_id=_GENRE_ID
    )

def test_create_sets_draft_status_and_active():
    show = _create()

    assert show.status is ShowStatus.DRAFT
    assert show.is_active is True
    assert show.is_published is False

    events = show.dequeue_events()
    assert len(events) == 1
    assert isinstance(events[0], ShowCreated)
    assert events[0].version == 1

def test_update_changes_fields_and_raises_event():
    show = _create()
    show.dequeue_events()
    new_genre_id = uuid4()

    show.update(title="Hamlet (revival)", synopsis="Nova sinopse.", image_url=show.image_url, genre_id=new_genre_id)

    assert show.title == "Hamlet (revival)"
    assert show.synopsis == "Nova sinopse."
    assert show.genre_id == new_genre_id

    events = show.dequeue_events()
    assert isinstance(events[0], ShowUpdated)

def test_publish_changes_status_and_raises_event():
    show = _create()
    show.dequeue_events()

    show.publish()

    assert show.status is ShowStatus.PUBLISHED
    assert show.is_published is True

    events = show.dequeue_events()

    assert len(events) == 1
    assert isinstance(events[0], ShowPublished)


def test_publish_when_already_published_is_a_noop():
    show = _create()
    show.publish()
    show.dequeue_events()

    show.publish()

    assert show.dequeue_events() == []
    assert show.version == 2


def test_unpublish_changes_status_and_raises_event():
    show = _create()
    show.publish()
    show.dequeue_events()

    show.unpublish()

    assert show.status is ShowStatus.DRAFT
    events = show.dequeue_events()

    assert len(events) == 1
    assert isinstance(events[0], ShowUnpublished)

def test_unpublish_when_already_draft_is_a_noop():
    show = _create()
    show.dequeue_events()

    show.unpublish()

    assert show.dequeue_events() == []
    assert show.version == 1

def test_deactivate_raises_event():
    show = _create()
    show.dequeue_events()

    show.deactivate()

    assert show.is_active is False
    
    events = show.dequeue_events()
    assert isinstance(events[0], ShowDeactivated)
