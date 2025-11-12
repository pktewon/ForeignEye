"""
데이터베이스 적재기

Discovery 단계에서 추출한 개념을 기사와 연결합니다.
"""

from typing import Dict, Optional

from app.extensions import db
from app.models import Article, Concept, Article_Concept


PLACEHOLDER_DESCRIPTION = "(Placeholder) 기사에서 이 개념이 어떻게 사용되는지 확인하세요."


class DBLoader:
    """간소화된 데이터베이스 적재 클래스"""

    def __init__(self, app_context):
        self.app_context = app_context

    def load_article_data(self, article_data: Dict, analysis: Dict) -> Optional[Article]:
        """기사와 개념을 저장하고 연결합니다."""
        with self.app_context:
            try:
                url = article_data['url']
                existing_article = Article.query.filter_by(original_url=url).first()
                if existing_article:
                    print(f"  ⊘ Article already exists (ID: {existing_article.article_id})")
                    return None

                new_article = Article(
                    title=article_data['title'],
                    title_ko=analysis.get('title_ko', ''),
                    original_url=url,
                    summary_ko=analysis.get('summary_ko', '')
                )
                db.session.add(new_article)
                db.session.flush()

                print(f"  ✓ Created Article (ID: {new_article.article_id})")

                concept_names = analysis.get('concept_names', [])
                if not concept_names:
                    print("  ! No concepts detected by AI.")
                    db.session.commit()
                    return new_article

                linked_count = 0
                for concept_name in concept_names:
                    concept = self._get_or_create_concept(concept_name)
                    if concept and self._link_concept_to_article(new_article, concept):
                        linked_count += 1

                db.session.commit()
                print(f"  ✓ Linked {linked_count} concepts to article")
                print(f"  ✓✓ Successfully saved article to database!")
                return new_article

            except Exception as e:
                db.session.rollback()
                print(f"  ✗✗ Database error: {e}")
                import traceback
                traceback.print_exc()
                return None

    def _get_or_create_concept(self, concept_name: str) -> Optional[Concept]:
        cleaned_name = (concept_name or '').strip()
        if not cleaned_name:
            return None

        concept = Concept.query.filter_by(name=cleaned_name).first()
        if concept:
            return concept

        concept = Concept(
            name=cleaned_name,
            description_ko=PLACEHOLDER_DESCRIPTION,
            real_world_examples_ko=[]
        )
        db.session.add(concept)
        db.session.flush()
        print(f"  ✓ Created concept: {cleaned_name} (ID: {concept.concept_id})")
        return concept

    def _link_concept_to_article(self, article: Article, concept: Concept) -> bool:
        existing_link = Article_Concept.query.filter_by(
            article_id=article.article_id,
            concept_id=concept.concept_id
        ).first()

        if existing_link:
            return False

        db.session.add(Article_Concept(
            article_id=article.article_id,
            concept_id=concept.concept_id
        ))
        return True
