from app.modules.catalog.domain.aggregates import Genre
from app.modules.catalog.application.schemas.response import GenreResponse

def genre_response(genre: Genre) -> GenreResponse:
    return GenreResponse(id=genre.id, name=genre.name)
