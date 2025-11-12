"""
Search service

Provides article retrieval features driven by concept membership.
"""

from typing import List

from sqlalchemy import func

from app.extensions import db
from app.models import Article, Concept, Article_Concept


class SearchService:
    """Service utilities for concept-driven article search."""

    @staticmethod
    def get_articles_by_concept(concept_name: str) -> List[Article]:
        cleaned = (concept_name or "").strip()
        if not cleaned:
            return []

        concept = Concept.query.filter(func.lower(Concept.name) == cleaned.lower()).first()
        if not concept:
            return []

        article_ids = (
            db.session.query(Article_Concept.article_id)
            .filter(Article_Concept.concept_id == concept.concept_id)
            .subquery()
        )

        return (
            Article.query.filter(Article.article_id.in_(article_ids))
            .order_by(Article.created_at.desc())
            .all()
        )

    @staticmethod
    def get_articles_by_multiple_concepts(concept_names: List[str]) -> List[Article]:
        cleaned_names = [name.strip() for name in concept_names if name and name.strip()]
        if not cleaned_names:
            return []

        concepts = Concept.query.filter(func.lower(Concept.name).in_(map(str.lower, cleaned_names))).all()
        if len(concepts) != len(set(name.lower() for name in cleaned_names)):
            # At least one concept missing
            return []

        concept_ids = [concept.concept_id for concept in concepts]

        matching_articles_subquery = (
            db.session.query(Article_Concept.article_id)
            .filter(Article_Concept.concept_id.in_(concept_ids))
            .group_by(Article_Concept.article_id)
            .having(func.count(func.distinct(Article_Concept.concept_id)) == len(concept_ids))
            .subquery()
        )

        return (
            Article.query.filter(Article.article_id.in_(matching_articles_subquery))
            .order_by(Article.created_at.desc())
            .all()
        )
